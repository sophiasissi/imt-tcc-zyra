import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { theme } from '../styles/theme';

type Props = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function ZyraButton({ title, onPress, style, disabled = false }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      activeOpacity={0.84}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 56,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.white,
  },
});
