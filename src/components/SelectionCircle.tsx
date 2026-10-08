import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { theme } from '../styles/theme';

type Props = {
  selected: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Bolinha de seleção, como a das Fotos do iPhone: vazia com borda branca, e
 * rosa com um visto quando marcada. O visto garante que a marcação não
 * depende só da cor.
 */
export function SelectionCircle({ selected, style }: Props) {
  if (!selected) {
    return <View style={[styles.circle, styles.empty, style]} />;
  }

  return (
    <View style={[styles.circle, styles.filledShadow, style]}>
      <LinearGradient
        colors={theme.gradientPrimary.colors}
        locations={theme.gradientPrimary.locations}
        start={theme.gradientPrimary.start}
        end={theme.gradientPrimary.end}
        style={[StyleSheet.absoluteFill, styles.filled]}
      />

      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke={theme.colors.white}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const SIZE = 24;

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fundo escurecido: a borda branca aparece até sobre foto clara.
  empty: {
    borderWidth: 2,
    borderColor: theme.colors.white,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  filled: {
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  filledShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
