import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPassword'>;

const SPECIAL_CHARACTER_PATTERN = /[\^$*.\[\]{}()?\-"!@#%&/\\,><':;|_~`+=]/;

type Rule = {
  label: string;
  isValid: boolean;
};

export function RegisterPasswordScreen({ navigation, route }: Props) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [confirmationTouched, setConfirmationTouched] = useState(false);

  const hasValidInternalSpace = /\S\s+\S/.test(password);
  const rules: Rule[] = [
    { label: 'Pelo menos 8 caracteres', isValid: password.length >= 8 },
    { label: 'Pelo menos uma letra minúscula', isValid: /[a-z]/.test(password) },
    { label: 'Pelo menos uma letra maiúscula', isValid: /[A-Z]/.test(password) },
    { label: 'Pelo menos um número', isValid: /\d/.test(password) },
    {
      label: 'Pelo menos um símbolo ou espaço interno',
      isValid: SPECIAL_CHARACTER_PATTERN.test(password) || hasValidInternalSpace,
    },
  ];

  const meetsAllRules = rules.every((rule) => rule.isValid);
  const passwordsMatch = confirmation.length > 0 && confirmation === password;
  const canContinue = meetsAllRules && passwordsMatch;

  return (
    <AuthLayout
      title="Crie uma conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <ZyraButton
          title="Continuar"
          disabled={!canContinue}
          onPress={() => navigation.navigate('RegisterVerification', { firstName: route.params.firstName })}
        />
      }
    >
      <ZyraInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.validationList} accessible accessibilityLabel="Requisitos da senha">
        {rules.map((rule) => (
          <View key={rule.label} style={styles.ruleRow}>
            <Text style={[styles.ruleIcon, rule.isValid && styles.ruleValid]}>
              {rule.isValid ? '✓' : '○'}
            </Text>
            <Text style={[styles.ruleText, rule.isValid && styles.ruleValid]}>{rule.label}</Text>
          </View>
        ))}
      </View>

      <ZyraInput
        label="Confirmar Senha"
        value={confirmation}
        onChangeText={setConfirmation}
        onBlur={() => setConfirmationTouched(true)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        error={confirmationTouched && !passwordsMatch ? 'As senhas precisam ser iguais.' : undefined}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 150,
  },
  validationList: {
    marginTop: -6,
    marginBottom: 18,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleIcon: {
    width: 18,
    color: theme.colors.label,
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
  },
  ruleText: {
    color: theme.colors.label,
    fontSize: 12,
    fontFamily: theme.fonts.medium,
  },
  ruleValid: {
    color: theme.colors.primary,
  },
});
