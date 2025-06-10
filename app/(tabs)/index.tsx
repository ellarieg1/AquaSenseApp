import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

export default function HomeScreen() {
  const [dailyGoal, setDailyGoal] = useState(75);
  const [currentIntake, setCurrentIntake] = useState(24);

  const progressPercent = Math.round((currentIntake / dailyGoal) * 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo at the top */}
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
        <CircularProgress
          value={progressPercent}
          maxValue={100}
          radius={90}
          title={'Hydration'}
          progressValueColor={'#41b8d5'}
          activeStrokeColor={'#41b8d5'}
          inActiveStrokeColor={'#82b5c8'}
          progressValueFontSize={40}
          titleFontSize={14}
          progressFormatter={(value) => `${value.toFixed(0)}%`}
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
    marginBottom: 25,
    fontStyle: 'italic',
    textAlign: 'center',
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
  },
  dailyGoal: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#41b8d5',
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
  },
  alertCard: {
    backgroundColor: '#82b5c8',
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
  },
  alertText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  batteryText: {
    marginTop: 30,
    fontSize: 14,
    color: '#555555',
  },
});
