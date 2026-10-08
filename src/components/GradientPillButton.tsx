import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../styles/theme';

type Props = {
  title: string;
  accessibilityLabel: string;
  icon?: ReactNode;
  onPress: () => void;
};

/**
 * Pílula com o degradê rosa da bolinha do chat. Usada nos botões que trocam
 * o painel da Home entre o armário e a Galeria de Looks.
 */
export function GradientPillButton({
  title,
  accessibilityLabel,
  icon,
  onPress,
}: Props) {
  return (
    <View style={styles.shadow}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.84}
        style={styles.button}
        onPress={onPress}
      >
        <LinearGradient
          colors={theme.gradientPrimary.colors}
          locations={theme.gradientPrimary.locations}
          start={theme.gradientPrimary.start}
          end={theme.gradientPrimary.end}
          style={StyleSheet.absoluteFill}
        />

        {icon}

        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mesma sombra da bolinha do chat.
  shadow: {
    borderRadius: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    height: 30,
    borderRadius: 30,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  text: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },
});
