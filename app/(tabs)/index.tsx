import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle } from 'react-native-progress';
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
          source={require('../../assets/images/aquasense-logo.png')}
          style={styles.logo}
        />

        <Text style={styles.tagline}>Your Daily Hydration Tracker</Text>

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
    backgroundColor: '#FFFFFF',
  },
  container: {
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 32,
    color: '#41b8d5',
    fontWeight: 'bold',
  },
  intakeText: {
    marginTop: 20,
    fontSize: 18,
    color: '#555',
    fontWeight: '500',
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#d1ecf1',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c5460',
    marginBottom: 6,
  },
  alertText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
  },
  batteryText: {
    fontSize: 14,
    color: '#777',
    marginTop: 10,
    marginBottom: 30,
  },
});
