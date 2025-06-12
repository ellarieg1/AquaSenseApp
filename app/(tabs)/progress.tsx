import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function ProgressScreen() {
  const screenWidth = Dimensions.get('window').width;

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
      <Text style={styles.title}>Weekly Hydration Progress</Text>
      <LineChart
        data={hydrationData}
        width={screenWidth - 40}
        height={240}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      <Text style={styles.description}>
        Stay consistent with your hydration goals to unlock more achievements!
      </Text>
    </ScrollView>
  );
}

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
    marginBottom: 20,
    color: '#41b8d5',
  },
  chart: {
    borderRadius: 16,
  },
  description: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});
