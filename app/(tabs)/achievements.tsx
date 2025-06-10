import BadgeCard from '@/components/ui/BadgeCard';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
    description: 'You drank enough water everyday for a week. Way to stay consistent!',
    image: require('@/assets/images/7daystreak.png'),
    earned: false,
  }

];
export default function Achievements() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Achievements</Text>
      <Text style={styles.sub}>Collect badges by staying hydrated!</Text>

    <View style={styles.grid}>
      {badges.map((badge) => (
        <BadgeCard key={badge.id} {...badge} />
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sub: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    width: '90%',
    color: '#444',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }
});
