import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '../styles/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  rightAccessory?: ReactNode;
};

export function ZyraInput({ label, error, rightAccessory, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.colors.inputText}
          style={[styles.input, rightAccessory ? styles.inputWithAccessory : undefined, style]}
          {...props}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    height: 54,
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
  error: {
    marginTop: 7,
    marginLeft: 2,
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWithAccessory: {
    paddingRight: 50,
  },
  rightAccessory: {
    position: 'absolute',
    right: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
