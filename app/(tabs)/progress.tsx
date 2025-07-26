import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle } from 'react-native-progress';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../supabase';

export default function ProgressScreen() {
  const { settings } = useSettings();
  const screenWidth = Dimensions.get('window').width;

  const [dailyGoal,  setDailyGoal]  = useState<number | null>(null);
  const [todayIntake,setTodayIntake]= useState(0);

  useFocusEffect(
    useCallback(() => {
      /* ---------- fetch daily goal from Supabase ---------- */
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('user_settings')
          .select('daily_goal')
          .eq('user_id', user.id)
          .single();
        if (data?.daily_goal) setDailyGoal(data.daily_goal);
      })();

      /* ---------- fetch today's consumed oz from storage --- */
      (async () => {
        const todayKey = () => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        };
        const key = `@aqua:consumedOz:${todayKey()}`;
        const stored = await AsyncStorage.getItem(key);
        setTodayIntake(stored && !isNaN(+stored) ? +stored : 0);
      })();
    }, [])
  );

  const goal = dailyGoal ?? settings.dailyGoal ??
               Math.round(settings.weight / 2 + settings.exerciseHours * 12);

  const progressPercent = Math.min(todayIntake / goal, 1);

  const chartConfig = {
    backgroundGradientFrom: '#f2fafc',
    backgroundGradientTo:   '#f2fafc',
    decimalPlaces: 0,
    color:      (o=1) => `rgba(65,184,213,${o})`,
    labelColor: (o=1) => `rgba(0,0,0,${o})`,
    style:{ borderRadius:20 },
    propsForDots:{ r:'6', strokeWidth:'2', stroke:'#41b8d5' },
  };

  const hydrationData = {
    labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets:[{ data:[64,80,72,50,90,66,75], strokeWidth:2 }],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Your Hydration Progress</Text>
        <Text style={styles.tagline}>A strong week behind you. An even better one lies ahead.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Progress</Text>
          <Circle
            size={160}
            progress={progressPercent}
            showsText
            formatText={() => `${Math.round(progressPercent * 100)}%`}
            color="#41b8d5"
            unfilledColor="#d3f2fa"
            borderWidth={0}
            thickness={10}
            textStyle={{ fontSize:22, fontWeight:'600', color:'#41b8d5' }}
          />
          <Text style={styles.goalText}>
            {todayIntake} oz of {Math.round(goal)} oz
          </Text>
        </View>

        <Text style={styles.chartTitle}>Weekly Hydration Progress</Text>
        <LineChart
          data={hydrationData}
          width={screenWidth - 40}
          height={240}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safeArea:{ flex:1, backgroundColor:'#F2FAFC' },
  container:{ alignItems:'center', padding:24, backgroundColor:'#F2FAFC' },
  header:{ fontSize:28, fontWeight:'600', color:'#1B4965', textAlign:'center', marginBottom:6 },
  tagline:{ fontSize:16, color:'#4A4A4A', fontStyle:'italic', marginBottom:24, textAlign:'center' },
  card:{ width:'100%', backgroundColor:'#fff', alignItems:'center', paddingVertical:24, paddingHorizontal:16, borderRadius:20, elevation:2, marginBottom:24 },
  cardTitle:{ fontSize:20, fontWeight:'600', color:'#333', marginBottom:12 },
  goalText:{ fontSize:18, color:'#555', fontWeight:'500', marginTop:16 },
  chartTitle:{ fontSize:20, fontWeight:'600', color:'#555', marginBottom:16, textAlign:'center' },
  chart:{ borderRadius:20, marginBottom:40 },
});
