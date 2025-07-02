import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const badgeCategories = [
  {
    title: 'Getting Started',
    badges: [
      {
        id: 'first-sip-badge',
        title: 'First Sip',
        description: 'First time logging water.',
        image: require('@/assets/images/firstsipbadge.png'),
        earned: true,
      },

      {
        id: 'hydration-hero',
        title: 'Hydration Hero',
        description: 'Met your goal 5 times.',
        image: require('@/assets/images/hydrationhero.png'),
        earned: true,
      },

      {
        id: '7-day-streak',
        title: '7-Day Streak',
        description: 'Met goal 7 days in a row.',
        image: require('@/assets/images/7daystreak.png'),
        earned: false,
      },
    ],
  },
  {
    title: 'Consistency Champs',
    badges: [
      
      {
        id: 'consistent-drinker',
        title: 'Consistent Drinker',
        description: 'Logged water 15 days total.',
        image: require('@/assets/images/consistentdrinker.png'),
        earned: false,
      },
      {
        id: 'full-month-flow',
        title: 'Full Month Flow',
        description: 'Met goal every day for a month.',
        image: require('@/assets/images/fullmonthflow.png'),
        earned: false,
      },
      {
        id: 'commitment-conquerer',
        title: 'Commitment Conqueror',
        description: 'Met goal 3 months in a row.',
        image: require('@/assets/images/commitmentconqueror.png'),
        earned: false,
      },
      {
        id: 'half-year-hero',
        title: 'Half Year Hero',
        description: 'Met goal 6 months in a row.',
        image: require('@/assets/images/halfyearhero.png'),
        earned: false,
      },
    ],
  },
  {
    title: 'Weather Warriors',
    badges: [
      {
        id: 'weather-warrior',
        title: 'Weather Warrior',
        description: 'Met goal on a hot day.',
        image: require('@/assets/images/weatherwarrior.png'),
        earned: true,
      },
      {
        id: 'heat-wave-hustler',
        title: 'Heat Wave Hustler',
        description: 'Met goal for 3 hot days in a row.',
        image: require('@/assets/images/heatwavehustler.png'),
        earned: false,
      },
      {
        id: 'glacial-grit',
        title: 'Glacial Grit',
        description: 'Logged on a below-freezing day.',
        image: require('@/assets/images/glacialgrit.png'),
        earned: false,
      },
      {
        id: 'aqua-beast',
        title: 'Aqua Beast',
        description: 'Drank at least a gallon of water in one day.',
        image: require('@/assets/images/aquabeast.png'),
        earned: true,
      },
      {
        id: 'h2overachiever',
        title: 'H2Overachiever',
        description: 'Surpassed your daily goal.',
        image: require('@/assets/images/H2Overachiever.png'),
        earned: false,
      },
    ],
  },
  {
    title: 'Time-Based Logging',
    badges: [
      {
        id: 'morning-sipper',
        title: 'Morning Sipper',
        description: 'Logged water in the morning.',
        image: require('@/assets/images/morningsipper.png'),
        earned: true,
      },
      {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Logged water at night.',
        image: require('@/assets/images/nightowl.png'),
        earned: true,
      },
      {
        id: 'balancing-act',
        title: 'Balancing Act',
        description: 'Logged morning, afternoon, and evening.',
        image: require('@/assets/images/balancingact.png'),
        earned: false,
      },
    ],
  },
  {
    title: 'Customization & Adaptability',
    badges: [
      {
        id: 'personalization-pro',
        title: 'Personalization Pro',
        description: 'Changed settings for the first time.',
        image: require('@/assets/images/personalizationpro.png'),
        earned: true,
      },
      {
        id: 'adaptability-award',
        title: 'Adaptability Award',
        description: 'Updated settings information 5 times.',
        image: require('@/assets/images/adaptabilityaward.png'),
        earned: false,
      },
    ],
  },
];


export default function Achievements() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Achievements</Text>
        <Text style={styles.sub}>Collect badges by staying hydrated!</Text>

        {badgeCategories.map((category) => (
          <View key={category.title} style={styles.tierSection}>
            <Text style={styles.tierTitle}>{category.title}</Text>
            <ScrollView
              horizontal
              contentContainerStyle={styles.row}
              showsHorizontalScrollIndicator={false}
            >
              {category.badges.map((badge) => (
                <View key={badge.id} style={styles.badgeWrapper}>
                  <Image
                    source={badge.image}
                    style={[styles.badgeImage, !badge.earned && styles.grayedOut]}
                  />
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2FAFC',
  },
  container: {
    paddingTop: 20,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 30,
    fontWeight: '600',
    color: '#1B4965',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'System',
  },
  sub: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
    paddingHorizontal: 10,
    fontFamily: 'System',
  },
  tierSection: {
    marginBottom: 32,
  },
  tierTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#679aad',
    marginBottom: 12,
    fontFamily: 'System',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: 180,
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badgeImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  grayedOut: {
    opacity: 0.2,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555555',
    textAlign: 'center',
    fontFamily: 'System',
  },
  badgeDesc: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    fontFamily: 'System',
  },
});