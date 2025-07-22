// 📁 /tabs/HomeScreen.tsx
//--------------------------------------------------------
//  AquaSense Home
//--------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle } from 'react-native-progress';
import { connectToDeviceAndSync, readBatteryPercent } from '../../bluetooth/BluetoothManager';
import InstructionsModal from '../../components/InstructionsModal';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';
import { requestNotificationPermissions, scheduleReminder } from '../../utils/notificationUtils';

/* ------------------------------------------------------------------
   Constants
------------------------------------------------------------------- */
const NOISE_ML  = 5;   // ignore tiny changes <5 mL
const REFILL_ML = 50;  // increase >50 mL treated as refill

const KEY_LAST_ML        = '@aqua:lastMlRemaining';
const KEY_CONSUMED_PREFIX = '@aqua:consumedOz:'; // + YYYY-MM-DD

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function HomeScreen() {
  /* ---------------- state ---------------- */
  const [dailyGoal,      setDailyGoal]      = useState(75);
  const [currentIntake,  setCurrentIntake]  = useState(0);
  const [isSyncing,      setIsSyncing]      = useState(false);
  const [lastMlRemaining,setLastMlRemaining]= useState<number | null>(null);
  const [showInstructions,setShowInstructions]=useState(false);
  const [batteryLevel,   setBatteryLevel]   = useState<number | null>(null);

  const { temperature } = useSettings();

  /* ---------------- show instructions once ---------------- */
  useEffect(() => {
    (async () => {
      if (!(await AsyncStorage.getItem('@aqua:instructionsSeen'))) {
        setShowInstructions(true);
      }
    })();
  }, []);

  /* ---------------- progress ring ---------------- */
  const progressRatio   = dailyGoal > 0 ? currentIntake / dailyGoal : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  /* ---------------- keys ---------------- */
  const TODAY_CONSUMED_KEY = KEY_CONSUMED_PREFIX + todayKey();

  /* ---------------- initial load ---------------- */
  useEffect(() => {
    (async () => {
      const storedMl = await AsyncStorage.getItem(KEY_LAST_ML);
      if (storedMl && !isNaN(+storedMl)) setLastMlRemaining(+storedMl);

      const storedOz = await AsyncStorage.getItem(TODAY_CONSUMED_KEY);
      if (storedOz && !isNaN(+storedOz)) setCurrentIntake(+storedOz);
      else await AsyncStorage.setItem(TODAY_CONSUMED_KEY, '0');
    })();
  }, []);

  /* ---------------- midnight reset ---------------- */
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const key = KEY_CONSUMED_PREFIX + todayKey();
        const saved = await AsyncStorage.getItem(key);
        if (saved && !isNaN(+saved)) setCurrentIntake(+saved);
        else {
          setCurrentIntake(0);
          await AsyncStorage.setItem(key, '0');
        }
      })();
    }, [])
  );

  /* ---------------- load goal from Supabase ---------------- */
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('user_settings').select('daily_goal').eq('user_id', user.id).single();
        if (data?.daily_goal) {
          setDailyGoal(data.daily_goal);
          await AsyncStorage.setItem('dailyGoal', String(data.daily_goal));
        }
      })();
    }, [])
  );

  /* ---------------- schedule reminders once ---------------- */
  useEffect(() => {
    (async () => {
      await requestNotificationPermissions();
      await scheduleReminder(8,  0, '💧 Morning Reminder',   'Fuel your morning — take your first sip!');
      await scheduleReminder(14, 0, '💧 Afternoon Reminder', 'Time for a hydration check!');
      await scheduleReminder(20, 0, '💧 Evening Reminder',   'End your day strong. One last hydration boost!');
    })();
  }, []);

  const isHot = temperature > 85;

  /* ---------------- helpers ---------------- */
  const setBaseline = async (ml: number) => {
    setLastMlRemaining(ml);
    await AsyncStorage.setItem(KEY_LAST_ML, String(ml));
  };

  /* ---------------- sync handler ---------------- */
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const mlRemaining = await connectToDeviceAndSync();
      setBatteryLevel(await readBatteryPercent());

      if (mlRemaining == null || isNaN(mlRemaining)) {
        Alert.alert('Sync Failed', 'Bottle sent no data. Make sure it is stable and nearby.');
        return;
      }

      if (lastMlRemaining == null) {
        await setBaseline(mlRemaining);
        Alert.alert('Synced', `Baseline set: ${mlRemaining} mL in bottle.`);
        return;
      }

      const delta    = lastMlRemaining - mlRemaining; // drank
      const increase = mlRemaining    - lastMlRemaining; // refill

      if (delta > NOISE_ML) {
        const oz = +(delta * 0.033814).toFixed(2);

        setCurrentIntake(prev => {
          const next = +(prev + oz).toFixed(2);
          AsyncStorage.setItem(TODAY_CONSUMED_KEY, String(next)).catch(() => {});
          return next;
        });

        /* ---- Supabase insert (safe) ---- */
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await supabase.from('hydration_logs').insert({
              user_id:   user.id,
              date:      new Date().toISOString(),
              intake_ml: Math.round(delta),
            });
          } catch (e) {
            console.warn('Supabase log failed; will retry on next sync', e);
          }
        }
        /* -------------------------------- */

        await setBaseline(mlRemaining);
        Alert.alert('Logged', `You drank ${oz} oz (${delta} mL).`);

      } else if (increase > REFILL_ML) {
        await setBaseline(mlRemaining);
        Alert.alert('Bottle Refilled', 'Baseline reset. Remember to sync after drinking and before refilling.');
      } else {
        Alert.alert('No Change', 'Bottle level unchanged.');
      }
    } catch (err) {
      console.error('BLE sync error:', err);
      Alert.alert('Error', 'Could not connect to the bottle. Check Bluetooth and try again.');
    } finally {
      setTimeout(() => setIsSyncing(false), 1500);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <InstructionsModal
        visible={showInstructions}
        onClose={async () => {
          setShowInstructions(false);
          await AsyncStorage.setItem('@aqua:instructionsSeen', 'yes');
        }}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={require('../../assets/images/homescreenlogo.png')} style={styles.logo} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Goal</Text>
          <Text style={styles.goalText}>{dailyGoal} oz</Text>
        </View>

        <View style={styles.card}>
          <Circle
            size={180}
            progress={progressRatio}
            showsText
            formatText={() => `${progressPercent}%`}
            color="#41b8d5"
            unfilledColor="#e0f2f7"
            borderWidth={0}
            thickness={10}
            textStyle={{ fontSize: 24, fontWeight: '600', color: '#41b8d5' }}
          />
          <Text style={styles.intakeText}>{currentIntake} oz logged today</Text>
        </View>

        <TouchableOpacity style={[styles.syncButton, isSyncing && { opacity: 0.6 }]} disabled={isSyncing} onPress={handleSync}>
          {isSyncing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sync from Bottle</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.syncButton, { marginTop: 12, backgroundColor: '#888' }]}
          onPress={async () => {
            const pct = await readBatteryPercent();
            Alert.alert('Battery Test', pct == null ? 'No reading' : `Battery: ${pct}%`);
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Test Battery Read</Text>
        </TouchableOpacity>

        {isHot && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>🌡️ Hot Weather Alert</Text>
            <Text style={styles.alertText}>
              It's hotter than usual today — we've adjusted your hydration goal accordingly to keep you safe and hydrated.
            </Text>
          </View>
        )}

        {batteryLevel !== null && <Text style={styles.batteryText}>🔋 {batteryLevel}% battery remaining</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2FAFC' },
  container: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 },
  logo:      { width: 180, height: 180, resizeMode: 'contain' },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle:  { fontSize: 20, fontWeight: '600', color: '#555', marginBottom: 8 },
  goalText:   { fontSize: 32, fontWeight: 'bold', color: '#41b8d5' },
  intakeText: { marginTop: 18, fontSize: 18, fontWeight: '500', color: '#555', textAlign: 'center' },

  syncButton: { backgroundColor: '#41b8d5', padding: 12, borderRadius: 10, marginTop: 20, alignItems: 'center' },

  alertCard: {
    width: '100%',
    backgroundColor: 'rgba(130,181,200,0.25)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#0c5460', marginBottom: 6 },
  alertText:  { fontSize: 15, color: '#0c5460', lineHeight: 20, textAlign: 'center' },

  batteryText: { fontSize: 14, color: '#555', marginTop: 6, marginBottom: 20, textAlign: 'center' },
});
