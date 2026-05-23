import { Text, TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

type Props = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function ZyraButton({ title, variant = 'primary', style, disabled, ...props }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.input,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.text,
  },
});
