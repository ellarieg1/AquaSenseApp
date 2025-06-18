// 📁 /tabs/settings.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';

//Settings screen which allows users to input their weight, exercise hours, age, and fetch their location and weather to calculate a personalized hydration goal.
export default function SettingsScreen() {
  const { updateSettings } = useSettings();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState('Unknown');
  const [weight, setWeight] = useState('');
  const [exerciseHours, setExerciseHours] = useState('');
  const [age, setAge] = useState('');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateGoal = () => {
    const temp = temperature || 70;
    let additionalWater = 0;
    if (temp >= 95) additionalWater = 20;
    else if (temp >= 90) additionalWater = 16;
    else if (temp >= 85) additionalWater = 12;
    else if (temp >= 75) additionalWater = 8;
    else if (temp >= 60) additionalWater = 4;

    const ageNum = parseInt(age, 10);
    let ageAdjustment = 0;
    if (!isNaN(ageNum)) {
      if (ageNum >= 65) ageAdjustment = 12;
      else if (ageNum <= 18) ageAdjustment = 10;
    }

    const baseGoal = parseInt(weight, 10) / 2 + parseFloat(exerciseHours) * 12 + ageAdjustment;
    return Math.round(baseGoal + additionalWater);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error('Auth error or no user:', error);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Fetch settings error:', fetchError.message);
        return;
      }

      if (data) {
        console.log('Fetched settings:', data);
        setWeight(data.weight?.toString() || '');
        setAge(data.age?.toString() || '');
        setExerciseHours(data.exercise_hours?.toString() || '');
        setDailyGoal(data.daily_goal || 0);

        updateSettings({
          dailyGoal: data.daily_goal || 0,
          weight: data.weight,
          exerciseHours: data.exercise_hours,
        });

        await AsyncStorage.setItem('dailyGoal', data.daily_goal.toString());
      }
    };

    loadSettings();
  }, []);

  const fetchLocationAndWeather = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission was denied.');

      let loc = await Location.getCurrentPositionAsync({});
      let latitude = loc?.coords?.latitude || 40.7128;
      let longitude = loc?.coords?.longitude || -74.0060;

      let city = 'Unknown City';
      let region = 'Unknown Region';

      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverse?.length > 0) {
        const place = reverse[0];
        city = place.city || place.name || place.subregion || 'New York';
        region = place.region || place.country || 'New York';
      }

      setLocation(`${city}, ${region}`);

      const apiKey = '592a8ed7fc26ff9db2aef80214df0c41';
      const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${apiKey}`;
      const weatherResp = await fetch(weatherUrl);
      const weatherData = await weatherResp.json();
      const temp = weatherData.current?.temp;

      if (!temp) throw new Error('Weather data unavailable.');
      setTemperature(temp);

      const goal = calculateGoal();
      setDailyGoal(goal);

      await AsyncStorage.setItem('dailyGoal', goal.toString());
      await AsyncStorage.setItem('remindersEnabled', JSON.stringify(remindersEnabled));
      await AsyncStorage.setItem('reminderTimes', JSON.stringify(reminderTimes));
      updateSettings({ dailyGoal: goal, weight: parseInt(weight), exerciseHours: parseFloat(exerciseHours) });

      Alert.alert('Hydration Goal Updated!', `Today's hydration goal: ${goal} oz (Temp: ${temp}°F)`);
    } catch (err: any) {
      console.error('Error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = (event: DateTimePickerEvent, selectedTime?: Date) => {
    console.log("Picker fired:", event.type, selectedTime);
    setShowPicker(false);
    if (event.type === 'set' && selectedTime) {
      const timeString = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!reminderTimes.includes(timeString)) {
      setReminderTimes((prev) => [...prev, timeString]);
    }
  }
};

  const handleSave = async () => {
    try {
      Keyboard.dismiss();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw new Error('User not authenticated');

      const goal = calculateGoal();
      setDailyGoal(goal);

      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        weight: parseInt(weight, 10),
        age: parseInt(age, 10),
        exercise_hours: parseFloat(exerciseHours),
        daily_goal: goal,
      });

      if (error) throw new Error(error.message);

      await AsyncStorage.setItem('reminedersEnabled', JSON.stringify(remindersEnabled));
      await AsyncStorage.setItem('reminderTimes', JSON.stringify(reminderTimes));

      Alert.alert('Preferences Saved', 'Your hydration settings were saved successfully.');
    } catch (err: any) {
      console.error('Save error:', err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.header}>Settings</Text>
          <Text style={styles.tagline}>Personalize your hydration goals</Text>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Current Location:</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>

          <TouchableOpacity style={styles.fetchButton} onPress={fetchLocationAndWeather}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.fetchButtonText}>Fetch Location & Weather</Text>}
          </TouchableOpacity>

          {temperature !== null && (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Current Temperature:</Text>
              <Text style={styles.temperatureText}>{temperature}°F</Text>
            </View>
          )}

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 160" />
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Exercise Hours per Day</Text>
            <TextInput style={styles.input} value={exerciseHours} onChangeText={setExerciseHours} keyboardType="numeric" placeholder="e.g. 1" />
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.label}>Age (optional)</Text>
            <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 25" />
          </View>

<View style={styles.infoBlock}>
            <Text style={styles.label}>Hydration Reminders</Text>
            <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
          </View>

          {remindersEnabled && (
            <>
              <TouchableOpacity style={styles.fetchButton} onPress={() => setShowPicker(true)}>
                <Text style={styles.fetchButtonText}>Add Reminder Time</Text>
              </TouchableOpacity>
              {reminderTimes.map((time, idx) => (
                <Text key={idx} style={{ textAlign: 'center', marginVertical: 4 }}>{time}</Text>
              ))}
              {showPicker && (
                <DateTimePicker
                  mode="time"
                  value={new Date()}
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
                  onChange={handleAddReminder}
                />
              )}
            </>
          )}

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

// styles stay unchanged below
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
