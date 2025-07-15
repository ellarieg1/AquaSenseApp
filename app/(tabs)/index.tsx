import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle } from 'react-native-progress';
import { connectToDeviceAndSync } from '../../bluetooth/BluetoothManager';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';
import { requestNotificationPermissions, scheduleReminder } from '../../utils/notificationUtils';




export default function HomeScreen() {
  const [dailyGoal, setDailyGoal] = useState(75);
  const [currentIntake, setCurrentIntake] = useState(24);
  const { temperature } = useSettings();


  const progressPercent = Math.round((currentIntake / dailyGoal) * 100);

  useFocusEffect(
  useCallback(() => {
    const loadDailyGoal = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.error('User not authenticated:', error?.message);
          return;
        }

        const { data, error: settingsError } = await supabase
          .from('user_settings')
          .select('daily_goal')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          console.error('Error fetching daily goal from Supabase:', settingsError.message);
          return;
        }

        if (data?.daily_goal) {
          setDailyGoal(data.daily_goal);
          await AsyncStorage.setItem('dailyGoal', data.daily_goal.toString()); // Optional: keep local fallback in sync
        }
      } catch (err) {
        console.error('Unexpected error loading goal:', err);
      }
    };

    loadDailyGoal();
  }, [])
);

  useEffect(() => {
    const setReminders = async () => {
      await requestNotificationPermissions();
      await scheduleReminder(8, 0, '💧 Morning Reminder', 'Fuel your morning — take your first sip!');
      await scheduleReminder(14, 0, '💧 Afternoon Reminder', 'Time for a hydration check!');
      await scheduleReminder(20, 0, '💧 Evening Reminder', 'End your day strong. One last hydration boost!');
    };

    setReminders();
  }, []);

  const isHot = temperature > 85;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../../assets/images/homescreenlogo.png')}
          style={styles.logo}
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Goal</Text>
          <Text style={styles.goalText}>{dailyGoal} oz</Text>
        </View>

        <View style={styles.card}>
          <Circle
            size={180}
            progress={progressPercent / 100}
            showsText={true}
            formatText={() => `${progressPercent}%`}
            color="#41b8d5"
            unfilledColor="#e0f2f7"
            borderWidth={0}
            thickness={10}
            textStyle={{ fontSize: 24, fontWeight: '600', color: '#41b8d5' }}
          />
          <Text style={styles.intakeText}>{currentIntake} oz logged today</Text>
        </View>

        <TouchableOpacity
  style={{
    backgroundColor: '#41b8d5',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  }}
  onPress={async () => {
  try {
    await connectToDeviceAndSync(); // this just connects + alerts if successful
  } catch (err) {
    Alert.alert('Error', 'Something went wrong while trying to connect.');
    console.error('BLE Connect Error:', err);
  }
}}

>
  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
    Sync from Bottle
  </Text>
</TouchableOpacity>



        {isHot && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>🌡️ Hot Weather Alert</Text>
            <Text style={styles.alertText}>
              It's hotter than usual today — we've adjusted your hydration goal accordingly to keep you safe and hydrated.
            </Text>
          </View>
        )}

        <Text style={styles.batteryText}>🔋 70% battery remaining</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2FAFC',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardTitle: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 8,
  },
  goalText: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#41b8d5',
  },
  intakeText: {
    marginTop: 18,
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '500',
    color: '#555555',
    textAlign: 'center',
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
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: '#0c5460',
    marginBottom: 6,
    textAlign: 'center',
  },
  alertText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#0c5460',
    lineHeight: 20,
    textAlign: 'center',
  },
  batteryText: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#555555',
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
});
