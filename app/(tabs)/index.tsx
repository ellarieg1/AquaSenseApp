// 📁 /tabs/index.tsx - HOME SCREEN (UPDATED)
import { StyleSheet, Text, View } from 'react-native';
import CircularProgress from 'react-native-circular-progress-indicator';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>AquaSense</Text>
      <Text style={styles.label}>Recommended Intake</Text>
      <Text style={styles.today}>Today: 75 oz</Text>

      <Text style={styles.progress}>24 oz</Text>
      <Text style={styles.percent}>32% of goal</Text>

      <View style={styles.progressContainer}>
        <CircularProgress
          value={32}
          maxValue={100}
          radius={80}
          title={'Hydration'}
          progressValueColor={'#007AFF'}
          activeStrokeColor={'#00BFFF'}
        />
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertText}>🌡 Hot weather alert!</Text>
        <Text style={styles.alertSub}>It’s warmer than usual today. Your hydration goal has been adjusted to keep you healthy and hydrated.</Text>
      </View>

      <Text style={styles.battery}>70% Battery Remaining</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 50 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  label: { fontSize: 16, color: '#666' },
  today: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  progress: { fontSize: 22, fontWeight: 'bold' },
  percent: { fontSize: 16, color: '#333' },
  progressContainer: { marginVertical: 20 },
  alertBox: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    width: '90%',
  },
  alertText: { fontWeight: '600' },
  alertSub: { fontSize: 14, color: '#555', marginTop: 5, textAlign: 'center' },
  battery: { marginTop: 30, fontSize: 14, color: '#888' },
});
