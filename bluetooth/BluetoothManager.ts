// bluetooth/BluetoothManager.ts
// AquaSense BLE helper: robust reconnect (cache deviceId, cancel stale, retry).
// Returns Promise<number | null> = current mL remaining in bottle (rounded) or null.

import { decode as base64Decode } from 'base-64';
import { BleManager, Device } from 'react-native-ble-plx';

// ==== AquaSense ESP32 UUIDs ====
const TARGET_DEVICE_NAME = 'AquaSense';
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

// Debug flag (console only)
const DEBUG = true;
const log = (...a: any[]) => { if (DEBUG) console.log('[BLE]', ...a); };

// One shared manager
const ble = new BleManager();

// Cache of last seen deviceId (set after first success)
let cachedDeviceId: string | null = null;

// Prevent overlapping syncs
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
  // Fast reconnect path (if we’ve connected before)
  if (cachedDeviceId) {
    const fast = await tryFastReconnect(cachedDeviceId);
    if (fast) {
      log('fast reconnect succeeded');
      return fast;
    }
    log('fast reconnect failed; fallback to scan');
  }

  // Scan for AquaSense
  const device = await scanForDevice();
  cachedDeviceId = device.id;
  log('found device', device.name, device.id);

  // Connect fresh
  const connected = await device.connect();
  log('connected (scan path)');

  // Discover & read
  return await readMlThenDisconnect(connected);
}

// Attempt reconnect by cached deviceId (cancel stale first, then connect)
async function tryFastReconnect(id: string): Promise<number | null> {
  try {
    // Ensure no stale connection state
    await ble.cancelDeviceConnection(id).catch(() => {});
    await sleep(300);

    const d = await ble.connectToDevice(id, { timeout: 8000 });
    log('connected (fast path)');
    return await readMlThenDisconnect(d);
  } catch (e) {
    log('fast reconnect error', e);
    return null;
  }
}

// Discover, read characteristic, parse mL, then disconnect
async function readMlThenDisconnect(d: Device): Promise<number | null> {
  log('discovering services...');
  await d.discoverAllServicesAndCharacteristics();
  await sleep(300); // give ESP32 GATT a moment

  log('reading characteristic...');
  const char = await d.readCharacteristicForService(SERVICE_UUID, CHARACTERISTIC_UUID);
  if (!char?.value) {
    log('no data from char');
    await safeDisconnect(d);
    throw new Error('No data received from characteristic');
  }

  const decoded = base64Decode(char.value); // ESP32 sends UTF-8 text
  log('decoded:', JSON.stringify(decoded));

  const ml = extractMl(decoded);
  log('parsed mL:', ml);

  await safeDisconnect(d);
  return ml;
}

// Scan helper: first AquaSense seen (10s timeout)
function scanForDevice(timeoutMs = 10000): Promise<Device> {
  return new Promise((resolve, reject) => {
    let done = false;
    let timeout: ReturnType<typeof setTimeout>;

    const stop = () => {
      try { ble.stopDeviceScan(); } catch {}
      clearTimeout(timeout);
    };

    ble.startDeviceScan(null, null, (error, device) => {
      if (done) return;
      if (error) {
        log('scan error', error.message);
        done = true;
        stop();
        reject(error);
        return;
      }
      if (!device?.name) return;
      // accept exact or contains
      if (
        device.name === TARGET_DEVICE_NAME ||
        device.name.toLowerCase().includes(TARGET_DEVICE_NAME.toLowerCase())
      ) {
        done = true;
        stop();
        resolve(device);
      }
    });

    timeout = setTimeout(() => {
      if (!done) {
        log('scan timeout');
        done = true;
        stop();
        reject(new Error('Scan timeout: AquaSense not found'));
      }
    }, timeoutMs);
  });
}

// Parse numeric mL out of payload: " Volume: 142.3 mL", "Waiting...", etc.
function extractMl(text: string): number | null {
  const t = text.trim();
  if (!t || /^waiting/i.test(t)) return null;
  const m = t.match(/([-+]?\d*\.?\d+)\s*mL/i) || t.match(/([-+]?\d*\.?\d+)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return isNaN(n) ? null : Math.round(n);
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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
