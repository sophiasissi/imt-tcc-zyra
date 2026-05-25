import { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPasswordVerification'
>;

export function ForgotPasswordVerificationScreen({
  navigation,
  route,
}: Props) {
  const { email } = route.params;

  const [code, setCode] = useState('');

  const inputRef = useRef<TextInput>(null);

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
  const canContinue = normalizedCode.length === 6;

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    console.log(
      '[Recuperação] Código preenchido. Direcionando para criação da nova senha.',
    );

    navigation.navigate('ForgotPasswordNewPassword', {
      email,
      confirmationCode: normalizedCode,
    });
  }

  return (
    <AuthLayout
      title="Recupere sua senha"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <ZyraButton
          title="Continuar"
          disabled={!canContinue}
          onPress={handleContinue}
        />
      }
    >
      <Text style={styles.heading}>Insira seu código</Text>

      <Text style={styles.description}>
        Seu código foi enviado para{`\n`}
        {email}
      </Text>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.codeContainer}
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="button"
        accessibilityLabel="Campo para código de seis dígitos"
      >
        <View style={styles.slotRow} pointerEvents="none">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Text key={index} style={styles.slot}>
              {normalizedCode[index] ?? '—'}
            </Text>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          accessibilityLabel="Código de recuperação"
          value={normalizedCode}
          onChangeText={(value) =>
            setCode(value.replace(/\D/g, '').slice(0, 6))
          }
          keyboardType="number-pad"
          maxLength={6}
          caretHidden
          autoFocus={false}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          style={styles.hiddenInput}
        />
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 150,
  },
  heading: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    marginBottom: 6,
    marginTop: 0,
  },
  description: {
    color: theme.colors.label,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 24,
  },
  codeContainer: {
    height: 68,
    width: '100%',
    borderRadius: theme.radius.input,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  slot: {
    minWidth: 22,
    textAlign: 'center',
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    opacity: 0.02,
  },
});