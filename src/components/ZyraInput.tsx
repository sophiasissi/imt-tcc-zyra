import { Text, TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

type Props = TextInputProps & {
  label: string;
};

export function ZyraInput({ label, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#777"
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 14,
    color: theme.colors.inputText,
    fontSize: 15,
  },
});
