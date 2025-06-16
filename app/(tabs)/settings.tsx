// 📁 /tabs/settings.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSettings } from '../../context/SettingsContext';

// Setting screem which allows users to input their weight, exercise hours, and fetch their current location and weather to calculate a hydration goal.
export default function SettingsScreen() {
  // state variables
  const { updateSettings } = useSettings();
  const [location, setLocation] = useState('Unknown');
  const [weight, setWeight] = useState('160');
  const [exerciseHours, setExerciseHours] = useState('1');
  const [age, setAge] = useState('25');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  //function to get user location and temperature to calculate hydration goal
  const fetchLocationAndWeather = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission was denied.');
      }

      //attempts to fetch current location coordinates
      let loc;
      try {
        loc = await Location.getCurrentPositionAsync({});
      } catch (err: any) {
        console.log('Error fetching current location:', err.message);
      }

      //fallback locations if location fetch fails -- defaults to New York City
      let latitude: number, longitude: number;
      if (loc && loc.coords) {
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      } else {
        latitude = 40.7128;
        longitude = -74.0060;
        console.log('Using fallback coordinates:', latitude, longitude);
      }

      let city = 'Unknown City';
      let region = 'Unknown Region';
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        console.log('Reverse geocode result:', reverse);

        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          city =
            place.city ||
            place.name ||
            place.subregion ||
            (latitude === 40.7128 ? 'New York' : 'Unknown City');
          region =
            place.region ||
            place.country ||
            (latitude === 40.7128 ? 'New York' : 'Unknown Region');
        }
      } catch (geoError) {
        console.log('Error during reverse geocoding:', geoError);
        if (latitude === 40.7128 && longitude === -74.0060) {
          city = 'New York';
          region = 'New York';
        }
      }

      setLocation(`${city}, ${region}`);

      //construct weather API URL and fetch current temperature
      const apiKey = '592a8ed7fc26ff9db2aef80214df0c41';
      const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${apiKey}`;
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();
      if (!weatherData.current?.temp) {
        throw new Error('Weather data is unavailable.');
      }
      const temp = weatherData.current.temp;
      setTemperature(temp); //saves current temperature

      //adds additional water based on temperature
      let additionalWater = 0;
      if (temp >= 95) additionalWater = 20;
      else if (temp >= 90) additionalWater = 16;
      else if (temp >= 85) additionalWater = 12;
      else if (temp >= 75) additionalWater = 8;
      else if (temp >= 60) additionalWater = 4;

      const ageNum = parseInt(age, 10);
      let ageAdjustment = 0;

      //apply age adjustment if age is provided
      if (!isNaN(ageNum)) { //check if age is a valid number and returns true if number
        if (ageNum >= 60) {
          ageAdjustment = -10; //older adults need less whater
        }
      else if (ageNum <= 18) {
        ageAdjustment = 5;  //younger needs more water
        }
      }

      //FORMULA: calculates hydration goal by taking half of user's weight in oz + 12oz per hour of exercise
      const baseGoal =
        parseInt(weight, 10) / 2 + parseInt(exerciseHours, 10) * 12 + ageAdjustment;
      const adjustedGoal = Math.round(baseGoal + additionalWater); //final daily goal
      setDailyGoal(adjustedGoal);

      //allows hydration goal to carry over to other screens
      await AsyncStorage.setItem('dailyGoal', adjustedGoal.toString());
     
      //update context
      updateSettings({
        dailyGoal: adjustedGoal,
        weight: parseInt(weight, 10),
        exerciseHours: parseInt(exerciseHours, 10),
      });

      //alert notification for new goal
      Alert.alert(
        'Hydration Goal Updated!',
        `Today's hydration goal: ${adjustedGoal} oz (Temp: ${temp}\u00b0F)`
      );
    } catch (err: any) {
      console.error('Error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  //called when user clicks save button
  const handleSave = () => {
    Keyboard.dismiss();
    Alert.alert('Preferences Saved', 'Your settings have been updated.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Settings</Text>
          <Text style={styles.tagline}>Personalize your hydration goals</Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Current Location:</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>

          <TouchableOpacity style={styles.fetchButton} onPress={fetchLocationAndWeather}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.fetchButtonText}>Fetch Location & Weather</Text>
            )}
          </TouchableOpacity>

          {temperature !== null && (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Current Temperature:</Text>
              <Text style={styles.temperatureText}>{temperature}°F</Text>
            </View>
          )}

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

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Age (optional)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g. 25"
            />
          </View>

          {dailyGoal > 0 && (
            <View style={styles.goalBlock}>
              <Text style={styles.goalLabel}>Today's Hydration Goal</Text>
              <Text style={styles.goalValue}>{dailyGoal} oz</Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

//styles for Settings Screen
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
