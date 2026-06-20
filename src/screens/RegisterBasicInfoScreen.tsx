import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBasicInfo'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegisterBasicInfoScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const nameIsValid = trimmedName.length > 0;
  const emailIsValid = EMAIL_PATTERN.test(trimmedEmail);
  const firstName = trimmedName.split(/\s+/)[0];
  const canContinue = nameIsValid && emailIsValid;

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    navigation.navigate('RegisterPassword', {
      firstName,
      name: trimmedName,
      email: trimmedEmail,
    });
  }

  return (
    <AuthLayout
      title="Crie uma conta"
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
      <ZyraInput
        label="Nome"
        placeholder="Digite seu nome"
        value={name}
        onChangeText={setName}
        onBlur={() => setNameTouched(true)}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        error={
          nameTouched && !nameIsValid ? 'O nome é obrigatório.' : undefined
        }
      />

      <ZyraInput
        label="Email"
        placeholder="Digite seu email"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setEmailTouched(true)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        error={
          emailTouched && !emailIsValid
            ? 'Digite um e-mail válido, como nome@email.com.'
            : undefined
        }
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 150,
  },
});
