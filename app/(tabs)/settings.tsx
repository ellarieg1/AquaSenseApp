// 📁 /tabs/settings.tsx - SETTINGS SCREEN (UPDATED)
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SettingsScreen() {
  const [location, setLocation] = useState('Villanova');
  const [weight, setWeight] = useState('160');
  const [exerciseHours, setExerciseHours] = useState('3');

  const handleSave = () => {
    Alert.alert('Saved!', 'Your preferences have been updated.');
    // Later: Save to async storage or backend
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.subHeader}>User Information:</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
        />
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Exercise Hours / Week</Text>
        <TextInput
          style={styles.input}
          value={exerciseHours}
          onChangeText={setExerciseHours}
          keyboardType="numeric"
        />
      </View>

      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  subHeader: { fontSize: 16, marginBottom: 12, color: '#666' },
  infoBlock: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
    color: '#000',
  },
});
