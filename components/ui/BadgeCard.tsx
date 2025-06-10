import { Image, StyleSheet, View } from 'react-native';

type BadgeProps = {
  title: string;
  description: string;
  image: any;
  earned: boolean;
};

export default function BadgeCard({ image, earned }: BadgeProps) {
  return (
    <View style={[styles.card, !earned && styles.unearnedCard]}>
      <Image
        source={image}
        style={[
            styles.image, 
            !earned && styles.grayscale
        ]}
        resizeMode="contain"
      />
      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 8,
    width: 140,
  },
  unearnedCard: {
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: 80,
    height: 80,
  },
  grayscale: {
    tintColor: 'gray', // Makes the image appear gray
    opacity: 0.8, //Makes image appear slightly faded
  },
});
