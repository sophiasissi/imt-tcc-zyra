import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '../styles/theme';

type Props = TextInputProps & {
  label: string;
};

export function ZyraInput({ label, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#929292"
        style={[styles.input, style]}
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
    marginBottom: 7,
    marginLeft: 2,
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: theme.radius.input,
    backgroundColor: theme.colors.input,
    color: theme.colors.inputText,
    fontFamily: theme.fonts.medium,
    fontSize: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
