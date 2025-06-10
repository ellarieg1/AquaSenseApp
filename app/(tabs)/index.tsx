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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Intake</Text>
        <Text style={styles.dailyGoal}>Today: {dailyGoal} oz</Text>
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
          progressValueFontSize={24}
          titleFontSize={16}
        />
        <Text style={styles.intakeText}>{currentIntake} oz consumed</Text>
        <Text style={styles.percentText}>{progressPercent}% of goal</Text>
      </View>

      <View style={styles.alertCard}>
        <Text style={styles.alertTitle}>🌡️ Hot Weather Alert!</Text>
        <Text style={styles.alertText}>
          It’s warmer than usual today. Your hydration goal has been adjusted to keep you healthy and hydrated.
        </Text>
      </View>

      <Text style={styles.batteryText}>🔋 70% Battery Remaining</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#41b8d5',
    marginBottom: 20,
  },
  section: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#555555',
    marginBottom: 5,
    fontWeight: '600',
  },
  dailyGoal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#41b8d5',
  },
  progressSection: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  intakeText: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '600',
    color: '#555555',
  },
  percentText: {
    fontSize: 16,
    color: '#555555',
  },
  alertCard: {
    backgroundColor: '#82b5c8',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#000000',
  },
  batteryText: {
    marginTop: 30,
    fontSize: 14,
    color: '#555555',
  },
});
