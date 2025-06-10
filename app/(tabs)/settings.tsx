import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [location, setLocation] = useState('Fetching...');
  const [weight, setWeight] = useState('160');
  const [exerciseHours, setExerciseHours] = useState('1');

  // Simulate fetching location from an API
  const fetchLocation = () => {
    // Here you’d use react-native-location, Expo Location, or another library
    // For now, we'll simulate a successful API call
    setTimeout(() => {
      setLocation('Villanova, PA'); // Simulated location result
    }, 1000);
  };

  const handleSave = () => {
    Alert.alert('Preferences Saved!', 'Your preferences have been updated successfully.');
    // Later: Save to async storage or backend
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.tagline}>Personalize your hydration goals</Text>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Location (from device)</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>{location}</Text>
          <TouchableOpacity style={styles.fetchButton} onPress={fetchLocation}>
            <Text style={styles.fetchButtonText}>Fetch Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="e.g. 160"
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.label}>Exercise Hours per Day</Text>
        <TextInput
          style={styles.input}
          value={exerciseHours}
          onChangeText={setExerciseHours}
          keyboardType="numeric"
          placeholder="e.g. 1"
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#41b8d5',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#555555',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 25,
  },
  infoBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
  },
  locationContainer: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#000',
  },
  fetchButton: {
    backgroundColor: '#41b8d5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  fetchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  saveButton: {
    backgroundColor: '#41b8d5',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
