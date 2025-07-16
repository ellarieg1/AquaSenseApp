// bluetooth/BluetoothManager.ts
// Minimal BLE helper for AquaSense ESP32 with debug pop-up tracing.

import { decode as base64Decode } from 'base-64';
import { Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// -------- DEBUG --------
const DEBUG_ALERTS = true; // set false when done debugging
function dbg(msg: string) {
  console.log(msg);
  if (!DEBUG_ALERTS) return;
  setTimeout(() => Alert.alert('BLE Debug', msg), 0);
}
// -----------------------

// ==== ESP32 values from your sketch ====
const TARGET_DEVICE_NAME = 'AquaSense';
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

// Single shared manager
const bleManager = new BleManager();

// Pull numeric mL value out of the ESP32 payload string.
// Examples: " Volume: 142.3 mL", "Waiting...", " Volume: 0.0 mL"
function extractMl(text: string): number | null {
  const t = text.trim();
  if (!t || /^waiting/i.test(t)) return null;

  // Look specifically for a number before "mL"; fallback to any number.
  const mlMatch = t.match(/([-+]?\d*\.?\d+)\s*mL/i) || t.match(/([-+]?\d*\.?\d+)/);
  if (!mlMatch) return null;

  const mlVal = parseFloat(mlMatch[1]);
  if (isNaN(mlVal)) return null;
  return Math.round(mlVal); // round to whole mL
}

/**
 * Scan -> connect -> read UTF-8 volume string -> parse mL.
 * Resolves mL number or null if no numeric data.
 * Rejects on error so caller can catch.
 */
export function connectToDeviceAndSync(): Promise<number | null> {
  return new Promise((resolve, reject) => {
    console.log('🔍 Starting BLE scan...');
    dbg('scan start');

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const subscription = bleManager.startDeviceScan(
      // Null = scan all (more reliable for ESP32 than filtering on service UUID)
      null,
      null,
      async (error, device) => {
        if (error) {
          console.error('❌ Scan error:', error.message);
          dbg('scan error: ' + error.message);
          subscription.remove();
          if (timeoutId) clearTimeout(timeoutId);
          reject(error);
          return;
        }

        if (device?.name) {
          console.log(`📡 Found: ${device.name} (${device.id})`);
          if (device.name === TARGET_DEVICE_NAME) dbg('found AquaSense');
        }

        if (device?.name === TARGET_DEVICE_NAME) {
          console.log('✅ AquaSense found. Connecting...');
          dbg('connecting...');
          subscription.remove();
          if (timeoutId) clearTimeout(timeoutId);

          try {
            const connected = await device.connect();
            console.log('🔗 Connected. Discovering services...');
            dbg('connected, discovering...');
            await connected.discoverAllServicesAndCharacteristics();

            // Direct read
            dbg('reading characteristic...');
            const char = await connected.readCharacteristicForService(
              SERVICE_UUID,
              CHARACTERISTIC_UUID
            );

            if (!char?.value) {
              throw new Error('No data received from characteristic');
            }

            // base64 -> text (UTF-8-ish; BLEStringCharacteristic)
            const decoded = base64Decode(char.value);
            console.log('📦 Raw text from ESP32:', JSON.stringify(decoded));
            dbg('decoded: ' + decoded);

            const ml = extractMl(decoded);
            console.log('📏 Parsed mL:', ml);
            dbg('parsed mL: ' + ml);

            resolve(ml);
          } catch (err: any) {
            console.error('❌ BLE connect/read error:', err?.message ?? err);
            dbg('connect/read error');
            reject(err);
          }
        }
      }
    );

    // Safety timeout
    timeoutId = setTimeout(() => {
      subscription.remove();
      console.warn('⏰ Scan timeout: AquaSense not found.');
      dbg('scan timeout (no AquaSense)');
      reject(new Error('Scan timeout: device not found'));
    }, 10000);
  });
}
