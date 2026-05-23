import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function OptionPill({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.pill, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 42,
    minWidth: 96,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  selected: {
    backgroundColor: theme.colors.primary,
  },
  text: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedText: {
    color: theme.colors.white,
  },
});
