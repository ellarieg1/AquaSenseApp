import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';

export default function SettingsScreen() {
  const { updateSettings, setTemperature, temperature } = useSettings();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState('Unknown');
  const [weight, setWeight] = useState('');
  const [exerciseHours, setExerciseHours] = useState('');
  const [age, setAge] = useState('');
  const [dailyGoal, setDailyGoal] = useState(0);
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

  const scheduleHydrationReminders = async (times: string[]) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const timeStr of times) {
      const [hour, minute] = timeStr.split(':').map((t) => parseInt(t,10));
      const trigger = {
        hour,
        minute,
        repeats: true,
        type: 'calendar',
      } as const;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Time to hydrate!',
          body: "Don't forget to drink some water!",
        },
        trigger,
      });
    }
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
        const savedTimes = await AsyncStorage.getItem('reminderTimes');
        if (savedTimes) setReminderTimes(JSON.parse(savedTimes));
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const checkNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Notification permissions required', 'Please enable notifications to receive hydration reminders.');
        }
      }
    };
    checkNotificationPermissions();
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
      setTemperature(temp); // Update via context

      const goal = calculateGoal();
      setDailyGoal(goal);

      await AsyncStorage.setItem('dailyGoal', goal.toString());
      await AsyncStorage.setItem('remindersEnabled', JSON.stringify(remindersEnabled));
      await AsyncStorage.setItem('reminderTimes', JSON.stringify(reminderTimes));
      updateSettings({ dailyGoal: goal, weight: parseInt(weight), exerciseHours: parseFloat(exerciseHours) });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
if (!userError && user) {
  const { error: upsertError } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    weight: parseInt(weight, 10),
    age: parseInt(age, 10),
    exercise_hours: parseFloat(exerciseHours),
    daily_goal: goal,
  });
  if (upsertError) {
    console.error('Error writing goal to Supabase:', upsertError.message);
  }
}

      Alert.alert('Hydration Goal Updated!', `Today's hydration goal: ${goal} oz (Temp: ${temp}°F)`);
    } catch (err: any) {
      console.error('Error:', err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      const timeString = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!reminderTimes.includes(timeString)) {
        setReminderTimes((prev) => [...prev, timeString]);
      }
    }
  };

  const handleRemoveReminder = (time: string) => {
    setReminderTimes((prev) => prev.filter((t) => t !== time));
  };

  const handleSave = async () => {
    try {
      Keyboard.dismiss();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const goal = calculateGoal();
      setDailyGoal(goal);

      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        weight: parseInt(weight, 10),
        age: parseInt(age, 10),
        exercise_hours: parseFloat(exerciseHours),
        daily_goal: goal,
    },
    { onConflict: 'user_id' } // 👈 this resolves the duplicate key error
  );
      if (error) throw new Error(error.message);

      await AsyncStorage.setItem('remindersEnabled', JSON.stringify(remindersEnabled));
      await AsyncStorage.setItem('reminderTimes', JSON.stringify(reminderTimes));
      if (remindersEnabled) await scheduleHydrationReminders(reminderTimes);

      Alert.alert('Preferences Saved', 'Your hydration settings were saved successfully.');
    } catch (err: any) {
      console.error('Save error:', err.message);
      Alert.alert('Error', err.message);
    }
  };


return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAFC' }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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

          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderLabel}>Hydration Reminders</Text>
              <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
            </View>
            <Text style={styles.reminderNote}>
              You'll receive hydration reminders at 8 AM, 2 PM, and 8 PM if enabled.
            </Text>
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
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F2FAFC',
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  header: {
  fontSize: 28,
  fontWeight: '600', // softer than bold
  color: '#679aad', // your medium blue
  textAlign: 'center',
  marginBottom: 6,
  letterSpacing: 0.5,
  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
},
  tagline: {
    fontSize: 15,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  infoBlock: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#ffffffee',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 18,
    color: '#1B4965',
    fontWeight: '600',
  },
  temperatureText: {
    fontSize: 18,
    color: '#1B4965',
    fontWeight: '600',
  },
  fetchButton: {
    backgroundColor: '#41b8d5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  goalBlock: {
    alignItems: 'center',
    backgroundColor: '#ffffffee',
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 26,
    width: '100%',
  },
  goalLabel: {
    fontSize: 17,
    color: '#555555',
    marginBottom: 8,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#41b8d5',
  },
  saveButton: {
    backgroundColor: '#1B4965',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  reminderCard: {
    width: '100%',
    backgroundColor: '#ffffffee',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4965',
  },
  reminderNote: {
    fontSize: 14,
    color: '#444',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
