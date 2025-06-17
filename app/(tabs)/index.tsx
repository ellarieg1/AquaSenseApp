import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle } from 'react-native-progress';

export default function HomeScreen() {
  const [dailyGoal, setDailyGoal] = useState(75);
  const [currentIntake, setCurrentIntake] = useState(24);

  const progressPercent = Math.round((currentIntake / dailyGoal) * 100);

  useFocusEffect(
    React.useCallback(() => {
      const loadDailyGoal = async () => {
        try {
          const storedGoal = await AsyncStorage.getItem('dailyGoal');
          if (storedGoal) {
            setDailyGoal(parseInt(storedGoal, 10));
          }
        } catch (err) {
          console.error('Error loading daily goal:', err);
        }
      };

      loadDailyGoal();
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/images/aquasense-logo.png')}
        style={styles.logo}
      />

      <Text style={styles.tagline}>Your Daily Hydration Tracker</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Hydration Goal</Text>
        <Text style={styles.dailyGoal}>{dailyGoal} oz</Text>
      </View>

      <View style={styles.progressSection}>
        <Circle
          size={180}
          progress={progressPercent / 100}
          showsText={true}
          formatText={() => `${progressPercent}%`}
          color={'#41b8d5'} // Original color kept
          unfilledColor={'#82b5c8'} // Original color kept
          borderWidth={0}
          thickness={10}
          textStyle={{ fontSize: 24, fontWeight: '600', color: '#41b8d5' }}
        />
        <Text style={styles.intakeText}>{currentIntake} oz logged today</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>🌡️ Hot Weather Alert</Text>
        <Text style={styles.alertText}>
          It’s warmer than usual in your area today, so we’ve adjusted your daily hydration goal to keep you properly hydrated.
        </Text>
      </View>

      <Text style={styles.batteryText}>🔋 70% battery remaining</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    fontFamily: 'San Francisco', // Apple's default system font
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#555555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'San Francisco',
  },
  section: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#555555',
    marginBottom: 8,
    fontWeight: '600',
    fontFamily: 'San Francisco',
  },
  dailyGoal: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#41b8d5', // Original color kept
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: 25,
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  intakeText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '500',
    color: '#555555',
    fontFamily: 'San Francisco',
  },
  alertCard: {
    backgroundColor: '#82b5c8', // Original color kept
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'San Francisco',
  },
  alertText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'San Francisco',
  },
  batteryText: {
    marginTop: 30,
    fontSize: 14,
    color: '#555555',
    fontFamily: 'San Francisco',
  },
});
