import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle } from 'react-native-progress';
import { useSettings } from '../../context/SettingsContext';

export default function ProgressScreen() {
  const screenWidth = Dimensions.get('window').width;
  const { settings } = useSettings();

  const currentIntake = 24; // Replace with actual tracked value
  const dailyGoal = settings.dailyGoal || (settings.weight / 2 + settings.exerciseHours * 12);
  const progressPercent = Math.min(currentIntake / dailyGoal, 1);

  const chartConfig = {
    backgroundGradientFrom: '#f5f5f5',
    backgroundGradientTo: '#f5f5f5',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(65, 184, 213, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#41b8d5',
    },
  };

  //sample hydration data for the weekly chart
  const hydrationData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [64, 80, 72, 50, 90, 66, 75],
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Today's Progress Section */}
      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <Circle
          size={160}
          progress={progressPercent}
          showsText
          formatText={() => `${Math.round(progressPercent * 100)}%`}
          color={'#41b8d5'}
          unfilledColor={'#d3f2fa'}
          borderWidth={0}
          thickness={10}
          textStyle={{ fontSize: 22, fontWeight: 'bold', color: '#41b8d5' }}
        />
        <Text style={styles.todayText}>
          {currentIntake} oz of {Math.round(dailyGoal)} oz goal
        </Text>
      </View>

      {/* Weekly Chart Section */}
      <Text style={styles.title}>Weekly Hydration Progress</Text>
      <LineChart
        data={hydrationData}
        width={screenWidth - 40}
        height={240}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </ScrollView>
  );
}

//styles for Progress Screen
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 40,
    marginBottom: 20,
    color: '#41b8d5',
  },
  chart: {
    borderRadius: 16,
  },
  todaySection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#555',
  },
  todayText: {
    fontSize: 16,
    color: '#555',
    marginTop: 16,
  },
});
