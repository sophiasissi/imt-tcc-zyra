import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBasicInfo'>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type VerificarEmailResponse = {
  disponivel: boolean;
};

export function RegisterBasicInfoScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const nameIsValid = trimmedName.length > 0;
  const emailIsValid = EMAIL_PATTERN.test(trimmedEmail);
  const firstName = trimmedName.split(/\s+/)[0];
  const canContinue = nameIsValid && emailIsValid && !isChecking;

  function closePopup() {
    setPopup(null);
  }

  // Confere o email antes da senha: quem já tem conta descobre aqui, e não
  // depois de criar a senha.
  async function handleContinue() {
    if (!canContinue) {
      return;
    }

    let disponivel = true;

    try {
      setIsChecking(true);

      const response = await apiRequest<VerificarEmailResponse>(
        '/auth/verificar-email',
        {
          method: 'POST',
          body: JSON.stringify({ email: trimmedEmail }),
        },
      );

      disponivel = response.disponivel;
    } catch (error) {
      // Se a verificação falhar, segue o cadastro: o /auth/signup confere o
      // email de novo e mostra o mesmo aviso na tela de senha.
      console.error('[Cadastro] Não foi possível verificar o email:', error);
    } finally {
      setIsChecking(false);
    }

    if (!disponivel) {
      setPopup({
        variant: 'warning',
        title: 'Este email já está cadastrado',
        message:
          'Entre com sua senha ou recupere o acesso caso tenha esquecido.',
        buttonText: 'Entrar',
        onConfirm: () => {
          setPopup(null);
          // Sai do cadastro: a pilha vira Intro → Login, e o "voltar" do login
          // leva para o início em vez de voltar para esta tela.
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Intro' },
              { name: 'Login', params: { email: trimmedEmail } },
            ],
          });
        },
        // Voltar fecha o aviso para a pessoa corrigir o email.
        secondaryButtonText: 'Voltar',
        onSecondaryPress: closePopup,
      });

      return;
    }

    navigation.navigate('RegisterPassword', {
      firstName,
      name: trimmedName,
      email: trimmedEmail,
    });
  }

  return (
    <>
      <AuthLayout
        title="Crie uma conta"
        onBack={() => navigation.goBack()}
        contentStyle={styles.content}
        footer={
          <ZyraButton
            title={isChecking ? 'Verificando...' : 'Continuar'}
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
  // No centro da área livre: quando o teclado abre, a área encolhe e os
  // campos sobem junto com ele.
  content: {
    justifyContent: 'center',
  },
});
