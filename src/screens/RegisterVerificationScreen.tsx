import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterVerification'>;

export function RegisterVerificationScreen({ navigation, route }: Props) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);
  const normalizedCode = code.replace(/\D/g, '').slice(0, 4);
  const canContinue = normalizedCode.length === 4;

  return (
    <AuthLayout
      title="Crie uma conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <ZyraButton
          title="Continuar"
          disabled={!canContinue}
          onPress={() => navigation.navigate('RegisterWelcome', { firstName: route.params.firstName })}
        />
      }
    >
      <Text style={styles.heading}>Insira seu código</Text>
      <Text style={styles.description}>Seu código foi enviado a{`\n`}email/telefone do user</Text>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.codeContainer}
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="button"
        accessibilityLabel="Campo para código de quatro dígitos"
      >
        <View style={styles.slotRow} pointerEvents="none">
          {[0, 1, 2, 3].map((index) => (
            <Text key={index} style={styles.slot}>
              {normalizedCode[index] ?? '—'}
            </Text>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Código de verificação"
          value={normalizedCode}
          onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
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
    lineHeight: 16,
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
