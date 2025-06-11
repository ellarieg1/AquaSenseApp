// 📁 /tabs/settings.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const [location, setLocation] = useState('Unknown');
  const [weight, setWeight] = useState('160');
  const [exerciseHours, setExerciseHours] = useState('1');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocationAndWeather = async () => {
    try {
      setLoading(true);

      // 1️⃣ Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission was denied.');
      }

      // 2️⃣ Try to get current coordinates
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({});
      } catch (err: any) {
        console.log('Error fetching current location:', err.message);
      }

      let latitude: number, longitude: number;
      if (loc && loc.coords) {
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      } else {
        // Fallback coordinates (New York City)
        latitude = 40.7128;
        longitude = -74.0060;
        console.log('Using fallback coordinates:', latitude, longitude);
      }

      // 3️⃣ Reverse geocode
      let city: string, region: string;
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse.length > 0) {
          city = reverse[0]?.city || 'Unknown City';
          region = reverse[0]?.region || 'Unknown Region';
        } else if (latitude === 40.7128 && longitude === -74.0060) {
          city = 'New York';
          region = 'New York';
        } else {
          city = 'Unknown City';
          region = 'Unknown Region';
        }
      } catch (geoError) {
        console.log('Error during reverse geocoding:', geoError);
        if (latitude === 40.7128 && longitude === -74.0060) {
          city = 'New York';
          region = 'New York';
        } else {
          city = 'Unknown City';
          region = 'Unknown Region';
        }
      }
      setLocation(`${city}, ${region}`);

      // 4️⃣ Fetch weather via One Call API 3.0
      const apiKey = '592a8ed7fc26ff9db2aef80214df0c41';
      const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${apiKey}`;
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();
      if (!weatherData.current?.temp) {
        throw new Error('Weather data is unavailable.');
      }
      const temp = weatherData.current.temp;
      setTemperature(temp);

      // 5️⃣ Calculate additional water
      let additionalWater = 0;
      if (temp >= 95) additionalWater = 20;
      else if (temp >= 90) additionalWater = 16;
      else if (temp >= 85) additionalWater = 12;
      else if (temp >= 75) additionalWater = 8;
      else if (temp >= 60) additionalWater = 4;

      // 6️⃣ Calculate and save daily goal
      const baseGoal =
        parseInt(weight, 10) / 2 + parseInt(exerciseHours, 10) * 12;
      const adjustedGoal = Math.round(baseGoal + additionalWater);
      setDailyGoal(adjustedGoal);

      await AsyncStorage.setItem('dailyGoal', adjustedGoal.toString());

      Alert.alert(
        'Hydration Goal Updated!',
        `Today's hydration goal: ${adjustedGoal} oz (Temp: ${temp}°F)`
      );
    } catch (err: any) {
      console.error('Error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    Alert.alert('Preferences Saved', 'Your settings have been updated.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.tagline}>Personalize your hydration goals</Text>

      {/* Location & Weather */}
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Current Location:</Text>
        <Text style={styles.locationText}>{location}</Text>
      </View>
      <TouchableOpacity
        style={styles.fetchButton}
        onPress={fetchLocationAndWeather}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.fetchButtonText}>
            Fetch Location & Weather
          </Text>
        )}
      </TouchableOpacity>

      {/* Temperature Display */}
      {temperature !== null && (
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Current Temperature:</Text>
          <Text style={styles.temperatureText}>{temperature}°F</Text>
        </View>
      )}

      {/* Weight Input */}
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="e.g. 160"
        />
      </View>

      {/* Exercise Hours Input */}
      <View style={styles.infoBlock}>
        <Text style={styles.label}>Exercise Hours per Day</Text>
        <TextInput
          style={styles.input}
          value={exerciseHours}
          onChangeText={setExerciseHours}
          keyboardType="numeric"
          placeholder="e.g. 1"
        />
      </View>

      {/* Daily Goal Display */}
      {dailyGoal > 0 && (
        <View style={styles.goalBlock}>
          <Text style={styles.goalLabel}>Today's Hydration Goal</Text>
          <Text style={styles.goalValue}>{dailyGoal} oz</Text>
        </View>
      )}

      {/* Save Preferences Button */}
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
    fontSize: 28,
    fontWeight: '700',
    color: '#41b8d5',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
  },
  infoBlock: {
    marginBottom: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  temperatureText: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  fetchButton: {
    backgroundColor: '#41b8d5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  fetchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    width: '100%',
  },
  goalBlock: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 20,
  },
  goalLabel: {
    fontSize: 18,
    color: '#555',
    marginBottom: 8,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#41b8d5',
  },
  saveButton: {
    backgroundColor: '#41b8d5',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
