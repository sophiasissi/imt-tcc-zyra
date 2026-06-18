import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPasswordEmail'>;

type ForgotPasswordResponse = {
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ForgotPasswordEmailScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const trimmedEmail = email.trim().toLowerCase();
  const emailIsValid = EMAIL_PATTERN.test(trimmedEmail);
  const canContinue = emailIsValid && !isLoading;

  function closePopup() {
    setPopup(null);
  }

  async function handleContinue() {
    setEmailTouched(true);

    if (!canContinue) {
      return;
    }

    try {
      setIsLoading(true);

      console.log('[Recuperação] Solicitando código de redefinição...');

      const response = await apiRequest<ForgotPasswordResponse>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            email: trimmedEmail,
          }),
        },
      );

      console.log(
        '[Recuperação] Código solicitado com sucesso ao Cognito.',
        response.message,
      );

      setPopup({
        variant: 'success',
        title: 'Código enviado!',
        message: 'Enviamos um código de recuperação para seu email.',
        buttonText: 'Continuar',
        onConfirm: () => {
          setPopup(null);

          navigation.navigate('ForgotPasswordVerification', {
            email: trimmedEmail,
          });
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o código de recuperação.';

      console.error('[Recuperação] Erro ao solicitar código:', message);

      setPopup({
        variant: 'error',
        title: 'Não foi possível enviar o código',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsLoading(false);
      console.log('[Recuperação] Solicitação de código finalizada.');
    }
  }

  return (
    <>
      <AuthLayout
        title="Recupere sua senha"
        onBack={() => navigation.goBack()}
        contentStyle={styles.content}
        footer={
          <ZyraButton
            title={isLoading ? 'Enviando...' : 'Continuar'}
            disabled={!canContinue}
            onPress={handleContinue}
          />
        }
      >
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

      {popup ? (
        <ZyraPopup
          visible
          {...popup}
          onConfirm={popup.onConfirm ?? closePopup}
          onClose={closePopup}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 150,
  },
});
