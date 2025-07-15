export async function connectToDeviceAndSync(): Promise<void> {
  return new Promise((resolve) => {
    const bleManager = new BleManager();
    const TARGET_DEVICE_NAME = 'AquaSense';

    const subscription = bleManager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        Alert.alert('Scan Error', error.message);
        subscription.remove();
        resolve();
        return;
      }

      if (device?.name?.includes(TARGET_DEVICE_NAME)) {
        subscription.remove();

        try {
          const connectedDevice = await device.connect();
          await connectedDevice.discoverAllServicesAndCharacteristics();
          Alert.alert('Connected!', `Connected to ${device.name}`);
          resolve();
        } catch (err: any) {
          Alert.alert('Connection Error', err.message || 'Unknown error');
          resolve();
        }
      }
    });

    setTimeout(() => {
      subscription.remove();
      Alert.alert('Timeout', 'Could not find the bottle.');
      resolve();
    }, 10000);
  });
}
