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
              style={[
                styles.badgeImage,
                !badge.earned && styles.grayedOut,
              ]}
            />
            <Text style={styles.badgeTitle}>{badge.title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingBottom: 80,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#41b8d5',
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    width: '90%',
    color: '#555',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badgeWrapper: {
    alignItems: 'center',
    margin: 20, // Increased spacing between badges
  },
  badgeImage: {
    width: 160, // Significantly larger size
    height: 160,
    resizeMode: 'contain',
  },
  grayedOut: {
    opacity: 0.2, // Even more obvious gray-out
  },
  badgeTitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
