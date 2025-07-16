// 📁 /tabs/HomeScreen.tsx
//--------------------------------------------------------
//  Home screen for AquaSense
//  ‣ Shows daily goal, intake progress
//  ‣ Sync-button calls BluetoothManager to pull mL value
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
import { connectToDeviceAndSync } from '../../bluetooth/BluetoothManager';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';
import {
  requestNotificationPermissions,
  scheduleReminder,
} from '../../utils/notificationUtils';

export default function HomeScreen() {
  //------------------------------
  // Local state
  //------------------------------
  const [dailyGoal, setDailyGoal] = useState(75);      // user goal in oz
  const [currentIntake, setCurrentIntake] = useState(24); // today’s total oz
  const [isSyncing, setIsSyncing] = useState(false);   // spinner / disable flag
  const { temperature } = useSettings();

  const progressPercent = Math.round((currentIntake / dailyGoal) * 100);

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
            await AsyncStorage.setItem(
              'dailyGoal',
              data.daily_goal.toString()
            );
          }
        } catch (err) {
          console.error('Load goal error:', err);
        }
      };
      loadDailyGoal();
    }, [])
  );

  //------------------------------
  // Schedule hydration reminders once on mount
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
            progress={progressPercent / 100}
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

        {/* ============ Sync Button ============ */}
        <TouchableOpacity
          style={[
            styles.syncButton,
            isSyncing && { opacity: 0.6 }, // dim while busy
          ]}
          disabled={isSyncing}
          onPress={async () => {
            setIsSyncing(true);
            try {
              // BluetoothManager now returns decoded mL (number) or null
              const mL = await connectToDeviceAndSync();
              if (mL !== undefined && mL !== null && !isNaN(mL)) {
                const oz = parseFloat((mL * 0.033814).toFixed(2));
                setCurrentIntake((prev) =>
                  parseFloat((prev + oz).toFixed(2))
                );
                Alert.alert('Synced ✅', `Added ${oz} oz (${mL} mL)`);
              } else {
                Alert.alert(
                  'Sync Failed',
                  'Bottle sent no data. Make sure it is stable and nearby.'
                );
              }
            } catch (err) {
              console.error('BLE sync error:', err);
              Alert.alert(
                'Error',
                'Could not connect to the bottle. Check Bluetooth and try again.'
              );
            } finally {
              setIsSyncing(false);
            }
          }}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              Sync from Bottle
            </Text>
          )}
        </TouchableOpacity>

        {/* Hot-weather advisory */}
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
        <Text style={styles.batteryText}>🔋 70% battery remaining</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/*--------------------------------------------------
  Styles
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

  /* Card containers */
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

  /* Sync button */
  syncButton: {
    backgroundColor: '#41b8d5',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },

  /* Hot-weather alert card */
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
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#0c5460', marginBottom: 6 },
  alertText: { fontSize: 15, color: '#0c5460', lineHeight: 20, textAlign: 'center' },

  batteryText: {
    fontSize: 14,
    color: '#555',
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
});
