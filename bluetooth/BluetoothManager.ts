// bluetooth/BluetoothManager.ts
// AquaSense BLE helper: scan once, connect once, read once, disconnect.
// Returns Promise<number | null>: parsed mL (rounded) or null if no numeric data.

import { decode as base64Decode } from 'base-64';
import { BleManager, Device } from 'react-native-ble-plx';

// ==== AquaSense ESP32 UUIDs ====
const TARGET_DEVICE_NAME = 'AquaSense';
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

// Toggle console debug (no popups)
const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) console.log('[BLE]', ...args);
}

// ONE shared BleManager instance
const ble = new BleManager();

// Extract numeric mL from payload: " Volume: 142.3 mL", "Waiting...", etc.
function extractMl(text: string): number | null {
  const t = text.trim();
  if (!t || /^waiting/i.test(t)) return null;
  const match = t.match(/([-+]?\d*\.?\d+)\s*mL/i) || t.match(/([-+]?\d*\.?\d+)/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  return isNaN(n) ? null : Math.round(n);
}

// Prevent overlapping syncs (belt + suspenders)
let inFlight: Promise<number | null> | null = null;
export function connectToDeviceAndSync(): Promise<number | null> {
  if (inFlight) {
    log('sync already running; returning same promise');
    return inFlight;
  }
  inFlight = syncOnce().finally(() => (inFlight = null));
  return inFlight;
}

async function syncOnce(): Promise<number | null> {
  log('scan start');
  const device = await scanForDevice();
  log('found device', device.name, device.id);

  // Some stacks need a fresh connection even if reported connected
  let connected = device;
  const already = await connected.isConnected().catch(() => false);
  if (!already) {
    log('connecting...');
    connected = await connected.connect();
  } else {
    log('already connected');
  }

  log('discovering services...');
  await connected.discoverAllServicesAndCharacteristics();

  // Tiny delay can help some ESP32 BLE libs settle
  await sleep(300);

  log('reading characteristic...');
  const char = await connected.readCharacteristicForService(
    SERVICE_UUID,
    CHARACTERISTIC_UUID
  );
  if (!char?.value) {
    log('no data from char');
    await safeDisconnect(connected);
    throw new Error('No data received from characteristic');
  }

  const decoded = base64Decode(char.value); // ESP32 sends UTF-8 ASCII
  log('decoded text:', JSON.stringify(decoded));

  const ml = extractMl(decoded);
  log('parsed mL:', ml);

  await safeDisconnect(connected);
  return ml;
}

function scanForDevice(timeoutMs = 10000): Promise<Device> {
  return new Promise((resolve, reject) => {
    let found = false;
    let timeout: ReturnType<typeof setTimeout>;

    const stop = () => {
      try {
        ble.stopDeviceScan();
      } catch {}
      clearTimeout(timeout);
    };

    ble.startDeviceScan(null, null, (error, device) => {
      if (error) {
        log('scan error', error.message);
        stop();
        reject(error);
        return;
      }
      if (!device?.name) return;
      // Accept exact OR partial match (in case firmware changes)
      if (
        device.name === TARGET_DEVICE_NAME ||
        device.name.toLowerCase().includes(TARGET_DEVICE_NAME.toLowerCase())
      ) {
        if (found) return;
        found = true;
        stop();
        resolve(device);
      }
    });

    timeout = setTimeout(() => {
      if (!found) {
        log('scan timeout');
        stop();
        reject(new Error('Scan timeout: AquaSense not found'));
      }
    }, timeoutMs);
  });
}

async function safeDisconnect(d: Device) {
  try {
    const isConn = await d.isConnected();
    if (isConn) {
      log('disconnecting...');
      await d.cancelConnection();
    }
  } catch (e) {
    log('disconnect error', e);
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
