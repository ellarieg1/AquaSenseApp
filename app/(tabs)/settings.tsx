import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';

export default function SettingsScreen() {
  /* ───────── state ───────── */
  const { updateSettings, setTemperature, temperature } = useSettings();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [location, setLocation] = useState('Unknown');
  const [weight, setWeight] = useState('');
  const [exerciseHours, setExerciseHours] = useState('');
  const [age, setAge] = useState('');
  const [dailyGoal, setDailyGoal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ───────── helpers ───────── */
  const calculateGoal = () => {
    const temp = temperature || 86;
    let extra = 0;
    if (temp >= 95) extra = 20;
    else if (temp >= 90) extra = 16;
    else if (temp >= 85) extra = 12;
    else if (temp >= 75) extra = 8;
    else if (temp >= 60) extra = 4;

    const ageNum = parseInt(age, 10);
    let ageAdj = 0;
    if (!isNaN(ageNum)) {
      if (ageNum >= 65) ageAdj = 12;
      else if (ageNum <= 18) ageAdj = 10;
    }

    const base = parseInt(weight || '0', 10) / 2 + parseFloat(exerciseHours || '0') * 10 + ageAdj;
    return Math.round(base + extra);
  };

  const scheduleHydrationReminders = async (times: string[]) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const t of times) {
      const [h, m] = t.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Time to hydrate!', body: "Don't forget to drink water!" },
        trigger: { type: 'calendar', hour: h, minute: m, repeats: true },
      });
    }
  };

  /* ───────── load saved settings ───────── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
      if (data) {
        setWeight(data.weight?.toString() || '');
        setAge(data.age?.toString() || '');
        setExerciseHours(data.exercise_hours?.toString() || '');
        setDailyGoal(data.daily_goal || 0);

        updateSettings({
          dailyGoal: data.daily_goal || 0,
          weight: data.weight,
          exerciseHours: data.exercise_hours,
        });

        const saved = await AsyncStorage.getItem('reminderTimes');
        if (saved) setReminderTimes(JSON.parse(saved));
      }
    })();
  }, []);

  /* ───────── notification perms ───────── */
  useEffect(() => {
    Notifications.getPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') {
        const { status: s } = await Notifications.requestPermissionsAsync();
        if (s !== 'granted') {
          Alert.alert('Enable notifications to receive hydration reminders.');
        }
      }
    });
  }, []);

  /* ───────── safe location + weather fetch ───────── */
  const DEFAULT_COORDS = { latitude: 40.7128, longitude: -74.0060 };
  const DEFAULT_TEMP_F = 86;

  const fetchLocationAndWeather = async () => {
    try {
      setLoading(true);

      /* location */
      let { latitude, longitude } = DEFAULT_COORDS;
      let city = 'Unknown';
      let region = '';

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;

        try {
          const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (rev?.length) {
            const p = rev[0];
            city = p.city || p.name || p.subregion || city;
            region = p.region || p.country || region;
          }
        } catch (geoErr: any) {
          console.warn('reverseGeocode failed – fallback to lat/lon', geoErr?.message);
        }
      } else {
        Alert.alert('Location disabled', 'Using default location (NYC).');
      }

      setLocation(region ? `${city}, ${region}` : city);

      /* weather */
      let tempF = DEFAULT_TEMP_F;
      try {
        const apiKey = '592a8ed7fc26ff9db2aef80214df0c41';
        const url =
          `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}` +
          `&exclude=minutely,hourly,daily,alerts&units=imperial&appid=${apiKey}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const j = await resp.json();
          if (j?.current?.temp) tempF = j.current.temp;
        }
      } catch (wxErr) {
        console.warn('Weather fetch failed – using default temp', wxErr);
      }

      /* update state & backend */
      setTemperature(tempF);
      const newGoal = calculateGoal();
      setDailyGoal(newGoal);

      await AsyncStorage.multiSet([
        ['dailyGoal', String(newGoal)],
        ['remindersEnabled', JSON.stringify(remindersEnabled)],
        ['reminderTimes', JSON.stringify(reminderTimes)],
      ]);

      updateSettings({
        dailyGoal: newGoal,
        weight: parseInt(weight, 10),
        exerciseHours: parseFloat(exerciseHours),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            weight: parseInt(weight, 10),
            age: parseInt(age, 10),
            exercise_hours: parseFloat(exerciseHours),
            daily_goal: newGoal,
          },
          { onConflict: 'user_id' }
        );
      }

      Alert.alert('Hydration Goal Updated', `Goal: ${newGoal} oz  •  Temp: ${Math.round(tempF)}°F`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Weather Error', err.message || 'Could not update goal.');
    } finally {
      setLoading(false);
    }
  };

  /* ───────── save prefs ───────── */
  const handleSave = async () => {
    try {
      Keyboard.dismiss();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const goal = calculateGoal();
      setDailyGoal(goal);

      const { error } = await supabase.from('user_settings').upsert(
        {
          user_id: user.id,
          weight: parseInt(weight, 10),
          age: parseInt(age, 10),
          exercise_hours: parseFloat(exerciseHours),
          daily_goal: goal,
        },
        { onConflict: 'user_id' }
      );
      if (error) throw error;

      await AsyncStorage.setItem('remindersEnabled', JSON.stringify(remindersEnabled));
      await AsyncStorage.setItem('reminderTimes', JSON.stringify(reminderTimes));
      if (remindersEnabled) await scheduleHydrationReminders(reminderTimes);

      Alert.alert('Preferences Saved', 'Your hydration settings have been updated.');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Save Error', err.message);
    }
  };

  /* ───────── render ───────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAFC' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 80 }]} keyboardShouldPersistTaps="handled">
            <Text style={styles.header}>Settings</Text>
            <Text style={styles.tagline}>Personalize your hydration goals</Text>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Current Location:</Text>
              <Text style={styles.locationText}>{location}</Text>
            </View>

            <TouchableOpacity style={styles.fetchButton} onPress={fetchLocationAndWeather}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.fetchButtonText}>Fetch Location & Weather</Text>}
            </TouchableOpacity>

            {temperature !== null && (
              <View style={styles.infoBlock}>
                <Text style={styles.label}>Current Temperature:</Text>
                <Text style={styles.temperatureText}>{temperature}°F</Text>
              </View>
            )}

            {[ // inputs
              { label: 'Weight (lbs)', val: weight, set: setWeight, ph: '160' },
              { label: 'Exercise Hours per Day', val: exerciseHours, set: setExerciseHours, ph: '1' },
              { label: 'Age (optional)', val: age, set: setAge, ph: '25' },
            ].map((f) => (
              <View style={styles.infoBlock} key={f.label}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.val}
                  onChangeText={f.set}
                  keyboardType="numeric"
                  placeholder={`e.g. ${f.ph}`}
                />
              </View>
            ))}

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

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F2FAFC', paddingHorizontal: 20, paddingTop: 30, alignItems: 'center' },
  header: { fontSize: 28, fontWeight: '600', color: '#1B4965', textAlign: 'center', marginBottom: 6 },
  tagline: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  infoBlock: { width: '100%', marginBottom: 20, backgroundColor: '#ffffffee', borderRadius: 20, padding: 20, elevation: 2 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  locationText: { fontSize: 18, color: '#1B4965', fontWeight: '600' },
  temperatureText: { fontSize: 18, color: '#1B4965', fontWeight: '600' },
  fetchButton: { backgroundColor: '#41b8d5', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 25, alignItems: 'center', marginBottom: 22 },
  fetchButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#ccc', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 15, fontSize: 16 },
  goalBlock: { alignItems: 'center', backgroundColor: '#ffffffee', paddingVertical: 26, paddingHorizontal: 16, borderRadius: 20, elevation: 3, marginVertical: 26, width: '100%' },
  goalLabel: { fontSize: 17, color: '#555', marginBottom: 8, fontWeight: '600' },
  goalValue: { fontSize: 30, fontWeight: 'bold', color: '#41b8d5' },
  saveButton: { backgroundColor: '#1B4965', paddingVertical: 16, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', marginBottom: 40 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  reminderCard: { width: '100%', backgroundColor: '#ffffffee', padding: 20, borderRadius: 20, marginBottom: 24, elevation: 2 },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reminderLabel: { fontSize: 16, fontWeight: '700', color: '#1B4965' },
  reminderNote: { fontSize: 14, color: '#444' },
});
