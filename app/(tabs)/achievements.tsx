import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const badges = [
  {
    id: 'hydration-hero',
    title: 'Hydration Hero',
    description: 'You met your daily hydration goal 5 times. Keep it up!',
    image: require('@/assets/images/hydrationhero.png'),
    earned: true,
  },
  {
    id: 'weather-warrior',
    title: 'Weather Warrior',
    description: 'Met your hydration goal on a hot or humid day. Way to go!',
    image: require('@/assets/images/weatherwarrior.png'),
    earned: false,
  },
  {
    id: 'first-sip-badge',
    title: 'First Sip',
    description: 'First time logging water. Whoop Whoop!',
    image: require('@/assets/images/firstsipbadge.png'),
    earned: true,
  },
  {
    id: 'consistent-drinker',
    title: 'Consistent Drinker',
    description: 'Logged your water intake for 15 days total. Way to go!',
    image: require('@/assets/images/consistentdrinker.png'),
    earned: false,
  },
  {
    id: '7-day-streak',
    title: '7-Day Streak!!',
    description: 'You drank enough water every day for a week. Way to stay consistent!',
    image: require('@/assets/images/7daystreak.png'),
    earned: false,
  },
];

export default function Achievements() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Achievements</Text>
      <Text style={styles.sub}>Collect badges by staying hydrated!</Text>

      <View style={styles.grid}>
        {badges.map((badge) => (
          <View key={badge.id} style={styles.badgeWrapper}>
            <Image
              source={badge.image}
              style={[styles.badgeImage, !badge.earned && styles.grayedOut]}
            />
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <Text style={styles.badgeDesc}>{badge.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 100,
    alignItems: 'center',
    backgroundColor: '#F2FAFC',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: '600',
    color: '#1B4965',
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  badgeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: 210,
    margin: 10,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badgeImage: {
    width: 190,
    height: 190,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  grayedOut: {
    opacity: 0.2,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
});
