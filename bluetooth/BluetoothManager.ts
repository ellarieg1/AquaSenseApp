// Import required libraries
import { Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Create a new instance of the BLE manager
const bleManager = new BleManager();

// Constants for your specific device and BLE UUIDs
const TARGET_DEVICE_NAME = 'Arduino'; // This is what your ESP32 advertises as its name
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab'; // Your custom service UUID from ESP32
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab'; // Custom characteristic for water volume

export async function connectToDeviceAndSync(): Promise<void> {
  return new Promise((resolve) => {
    console.log('🔍 Starting BLE scan...');

    // Start scanning for BLE devices that advertise the custom SERVICE_UUID
    const subscription = bleManager.startDeviceScan(
      [SERVICE_UUID],
      null,
      async (error, device) => {
        // If there's an error in the scan (e.g., Bluetooth turned off), show alert and stop
        if (error) {
          console.error('❌ Scan error:', error.message);
          Alert.alert('Scan Error', error.message);
          subscription.remove();
          resolve();
          return;
        }

        // Log each discovered device (helpful for debugging)
        console.log(`📡 Found device: ${device.name} (${device.id})`);

        // If the device's name includes "Arduino", proceed
        if (device.name?.includes(TARGET_DEVICE_NAME)) {
          console.log('✅ Target device found. Attempting to connect...');
          subscription.remove(); // Stop scanning

          try {
            // Connect to the device
            const connectedDevice = await device.connect();
            console.log('🔗 Connected to device. Discovering services...');

            // Discover all services and characteristics exposed by the device
            await connectedDevice.discoverAllServicesAndCharacteristics();

            // Get list of services
            const services = await connectedDevice.services();

            // Find the custom service you're interested in
            const service = services.find(s =>
              s.uuid.toLowerCase().includes(SERVICE_UUID.toLowerCase())
            );
            if (!service) throw new Error('Service not found');

            // Get all characteristics for the service
            const characteristics = await service.characteristics();

            // Find your specific characteristic that holds the water volume data
            const characteristic = characteristics.find(c =>
              c.uuid.toLowerCase().includes(CHARACTERISTIC_UUID.toLowerCase())
            );
            if (!characteristic) throw new Error('Characteristic not found');

            console.log('📥 Reading value from characteristic...');

            // Read the current value of the characteristic
            const data = await characteristic.read();

            // If no data, throw an error
            if (!data?.value) throw new Error('No data received from characteristic');

            // Decode the base64-encoded string to UTF-8 text
            const decoded = Buffer.from(data.value, 'base64').toString('utf-8');
            console.log('📦 Decoded value:', decoded);

            // Show an alert with the result
            Alert.alert('Success!', `Received: ${decoded}`);
            resolve();
          } catch (err: any) {
            // Handle errors that occur during connection or read
            console.error('❌ BLE connection error:', err.message);
            Alert.alert('Connection Error', err.message || 'Unknown error');
            resolve();
          }
        }
      }
    );

    // After 10 seconds, stop the scan if no device is found and show timeout alert
    setTimeout(() => {
      subscription.remove();
      console.warn('⏰ Scan timeout.');
      Alert.alert('Timeout', 'Could not find the AquaSense bottle.');
      resolve();
    }, 10000);
  });
}
