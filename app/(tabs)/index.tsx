// 📁 /tabs/HomeScreen.tsx 
//-------------------------------------------------------- 
//  AquaSense Home 
//  - Shows daily goal + intake progress 
//  - Sync button reads *remaining* mL from bottle (BLE) 
//  - Drop in remaining => water consumed (adds to progress) 
//  - Increase in remaining => refill (reset baseline; no intake) 
//  - Daily intake resets at midnight (device local) 
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
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';
import {
  requestNotificationPermissions,
  scheduleReminder,
} from '../../utils/notificationUtils';
 
 
/* ------------------------------------------------------------------ 
   Sensor interpretation thresholds 
   Tweak as you calibrate the pressure->volume math. 
------------------------------------------------------------------- */ 
const NOISE_ML = 5;   // ignore tiny changes <5 mL 
const REFILL_ML = 50; // increase >50 mL treated as refill 
 
 
/* ------------------------------------------------------------------ 
   AsyncStorage keys 
------------------------------------------------------------------- */ 
const KEY_LAST_ML = '@aqua:lastMlRemaining'; 
const KEY_CONSUMED_PREFIX = '@aqua:consumedOz:'; // append YYYY-MM-DD (local date) 
 
 
/* local YYYY-MM-DD */ 
function todayKey(): string { 
  const d = new Date(); 
  const y = d.getFullYear(); 
  const m = String(d.getMonth() + 1).padStart(2, '0'); 
  const day = String(d.getDate()).padStart(2, '0'); 
  return `${y}-${m}-${day}`; 
} 
 
 
export default function HomeScreen() { 
  //------------------------------ 
  // Local state 
  //------------------------------ 
  const [dailyGoal, setDailyGoal] = useState(75); // user goal in oz 
  const [currentIntake, setCurrentIntake] = useState(0); // today's consumed oz (replaces old hard-coded 24) 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [lastMlRemaining, setLastMlRemaining] = useState<number | null>(null);  
 
  const { temperature } = useSettings(); 
 
 
  // progress 
  const progressRatio = dailyGoal > 0 ? currentIntake / dailyGoal : 0; 
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100))); 
 
 
  // today's storage key 
  const today = todayKey(); 
  const TODAY_CONSUMED_KEY = KEY_CONSUMED_PREFIX + today; 
 
 
  //------------------------------ 
  // Initial load: baseline + today's consumed 
  //------------------------------ 
  useEffect(() => { 
	(async () => { 
      try { 
        // load last mL baseline 
        const storedMl = await AsyncStorage.getItem(KEY_LAST_ML); 
        if (storedMl != null) { 
          const n = Number(storedMl); 
          if (!isNaN(n)) setLastMlRemaining(n); 
    	} 
        // load today's consumed oz 
        const storedConsumed = await AsyncStorage.getItem(TODAY_CONSUMED_KEY); 
        if (storedConsumed != null) { 
          const n = Number(storedConsumed); 
          if (!isNaN(n)) setCurrentIntake(n); 
    	} else { 
          setCurrentIntake(0); 
          await AsyncStorage.setItem(TODAY_CONSUMED_KEY, '0'); 
    	} 
  	} catch (err) { 
        console.warn('Home init load error:', err); 
  	} 
	})(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // run once 
 
 
  //------------------------------ 
  // On focus: check date rollover (midnight reset) 
  //------------------------------ 
  useFocusEffect( 
    useCallback(() => { 
      const checkDate = async () => { 
        const todayNow = todayKey(); 
        const key = KEY_CONSUMED_PREFIX + todayNow; 
        const stored = await AsyncStorage.getItem(key); 
        if (stored != null) { 
          const n = Number(stored); 
          if (!isNaN(n)) setCurrentIntake(n); 
    	} else { 
          setCurrentIntake(0); 
          await AsyncStorage.setItem(key, '0'); 
    	} 
  	}; 
      checkDate(); 
	}, []) 
  ); 
 
 
  //------------------------------ 
  // Load goal from Supabase each time screen gains focus 
  //------------------------------ 
  useFocusEffect( 
    useCallback(() => { 
      const loadDailyGoal = async () => { 
        try { 
          const { 
            data: { user }, 
            error, 
      	} = await supabase.auth.getUser(); 
          if (error || !user) return; 
 
 
          const { data, error: settingsError } = await supabase 
        	.from('user_settings') 
        	.select('daily_goal') 
        	.eq('user_id', user.id) 
        	.single(); 
 
 
          if (!settingsError && data?.daily_goal) { 
            setDailyGoal(data.daily_goal); 
            await AsyncStorage.setItem('dailyGoal', data.daily_goal.toString()); 
      	} 
    	} catch (err) { 
          console.error('Load goal error:', err); 
    	} 
  	}; 
      loadDailyGoal(); 
	}, []) 
  ); 
 
 
  //------------------------------ 
  // Schedule hydration reminders once on mount (unchanged) 
  //------------------------------ 
  useEffect(() => { 
    const setReminders = async () => { 
      await requestNotificationPermissions(); 
      await scheduleReminder( 
        8, 
        0, 
        '💧 Morning Reminder', 
        'Fuel your morning — take your first sip!' 
  	); 
      await scheduleReminder( 
        14, 
        0, 
        '💧 Afternoon Reminder', 
        'Time for a hydration check!' 
  	); 
      await scheduleReminder( 
        20, 
        0, 
        '💧 Evening Reminder', 
        'End your day strong. One last hydration boost!' 
  	); 
	}; 
    setReminders(); 
  }, []); 
 
 
  const isHot = temperature > 85; 
 
 
  //------------------------------ 
  // Baseline helper 
  //------------------------------ 
  async function setBaseline(ml: number) { 
    setLastMlRemaining(ml); 
    await AsyncStorage.setItem(KEY_LAST_ML, String(ml)); 
  } 
 
 
  //------------------------------ 
  // Sync handler 
  //------------------------------ 
  async function handleSync() { 
    if (isSyncing) return; 
    setIsSyncing(true); 
    try { 
      const mlRemaining = await connectToDeviceAndSync(); // BLE value = remaining 
      if (mlRemaining == null || isNaN(mlRemaining)) { 
        Alert.alert( 
          'Sync Failed', 
          'Bottle sent no data. Make sure it is stable and nearby.' 
    	); 
        return; 
  	} 
 
 
      // First-ever reading: set baseline; don't log intake 
      if (lastMlRemaining == null) { 
        await setBaseline(mlRemaining); 
        Alert.alert('Synced', `Baseline set: ${mlRemaining} mL in bottle.`); 
        return; 
  	} 
 
 
      const delta = lastMlRemaining - mlRemaining;     // positive = drank 
      const increase = mlRemaining - lastMlRemaining;  // positive = refill 
 
 
      if (delta > NOISE_ML) { 
        // Drank water 
        const oz = Number((delta * 0.033814).toFixed(2)); 
        setCurrentIntake((prev) => { 
          const next = Number((prev + oz).toFixed(2)); 
          AsyncStorage.setItem(TODAY_CONSUMED_KEY, String(next)).catch(() => {}); 
          return next; 
    	}); 
        await setBaseline(mlRemaining); 
        Alert.alert('Logged', `You drank ${oz} oz (${delta} mL).`); 
  	} else if (increase > REFILL_ML) { 
        // Refill without prior sync -> reset baseline, no intake 
        await setBaseline(mlRemaining); 
        Alert.alert( 
          'Bottle Refilled', 
          'We reset to the new level. Please sync after drinking and before refilling to track usage.' 
    	); 
  	} else { 
        // No meaningful change 
        Alert.alert('No Change', 'Bottle level unchanged.'); 
  	} 
	} catch (err) { 
      console.error('BLE sync error:', err); 
      Alert.alert( 
        'Error', 
        'Could not connect to the bottle. Check Bluetooth and try again.' 
  	); 
	} finally { 
      // Give the ESP32 time to re-advertise before user can tap again 
      setTimeout(() => setIsSyncing(false), 1500); 
	} 
  } 
 
 
  //-------------------------------------------------------- 
  // JSX 
  //-------------------------------------------------------- 
  return ( 
    <SafeAreaView style={styles.safeArea}> 
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false} 
      > 
        {/* Logo */} 
        <Image 
          source={require('../../assets/images/homescreenlogo.png')} 
          style={styles.logo} 
        /> 
 
 
        {/* Goal card */} 
        <View style={styles.card}> 
          <Text style={styles.cardTitle}>Today's Goal</Text> 
          <Text style={styles.goalText}>{dailyGoal} oz</Text> 
        </View> 
 
 
        {/* Progress ring */} 
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
            textStyle={{ 
              fontSize: 24, 
              fontWeight: '600', 
              color: '#41b8d5', 
        	}} 
          /> 
          <Text style={styles.intakeText}>{currentIntake} oz logged today</Text> 
        </View> 
 
 
        {/* Sync Button */} 
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && { opacity: 0.6 }]} 
          disabled={isSyncing} 
          onPress={handleSync} 
        > 
          {isSyncing ? ( 
            <ActivityIndicator color="#fff" /> 
      	) : ( 
            <Text style={{ color: '#fff', fontWeight: 'bold' }}> 
          	Sync from Bottle 
            </Text> 
      	)} 
        </TouchableOpacity> 
 
 
        {/* Hot-weather advisory (unchanged text) */} 
        {isHot && ( 
          <View style={styles.alertCard}> 
            <Text style={styles.alertTitle}>🌡️ Hot Weather Alert</Text> 
            <Text style={styles.alertText}> 
          	It's hotter than usual today — we've adjusted your hydration goal 
          	accordingly to keep you safe and hydrated. 
            </Text> 
          </View> 
    	)} 
 
 
        {/* Placeholder battery indicator */} 
 
 
        <TouchableOpacity 
        style={[styles.syncButton, { marginTop: 12, backgroundColor: '#888' }]} 
        onPress={async () => { 
        const pct = await readBatteryPercent(); 
        Alert.alert( 
      'Battery Test', 
      pct == null ? 'No reading' : `Battery: ${pct}%` 
	); 
  }} 
> 
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Test Battery Read</Text> 
</TouchableOpacity> 
 
 
 
        <Text style={styles.batteryText}>🔋 70% battery remaining</Text> 
      </ScrollView> 
    </SafeAreaView> 
  ); 
} 
 
 
/*-------------------------------------------------- 
  Styles (unchanged from your original) 
--------------------------------------------------*/ 
const styles = StyleSheet.create({ 
  safeArea: { flex: 1, backgroundColor: '#F2FAFC' }, 
  container: { 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingHorizontal: 24, 
    paddingTop: 20, 
    paddingBottom: 60, 
  }, 
  logo: { width: 180, height: 180, resizeMode: 'contain', marginBottom: 0 }, 
 
 
  card: { 
    width: '100%', 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
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
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#555', marginBottom: 8 }, 
  goalText: { fontSize: 32, fontWeight: 'bold', color: '#41b8d5' }, 
  intakeText: { 
    marginTop: 18, 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#555', 
    textAlign: 'center', 
  }, 
 
 
  syncButton: { 
    backgroundColor: '#41b8d5', 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 20, 
    alignItems: 'center', 
  }, 
 
 
  alertCard: { 
    width: '100%', 
    backgroundColor: 'rgba(130, 181, 200, 0.25)', 
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
  alertTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0c5460', 
    marginBottom: 6, 
  }, 
  alertText: { 
    fontSize: 15, 
    color: '#0c5460', 
    lineHeight: 20, 
    textAlign: 'center', 
  }, 
 
 
  batteryText: { 
    fontSize: 14, 
    color: '#555', 
    marginTop: 6, 
    marginBottom: 20, 
    textAlign: 'center', 
  }, 
}); 
