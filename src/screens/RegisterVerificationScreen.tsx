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
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterVerification'>;

type ConfirmSignUpResponse = {
  message: string;
};

type LoginResponse = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

type RegisterProfileResponse = {
  id: string;
  cognitoSub: string;
  nome: string | null;
  email: string | null;
};

function isInvalidCodeMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes('código inválido') ||
    lowerMessage.includes('codigo invalido') ||
    lowerMessage.includes('code')
  );
}

function isEmailAlreadyRegistered(message: string) {
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes('email já possui uma conta') ||
    lowerMessage.includes('email já está cadastrado')
  );
}

export function RegisterVerificationScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();

  const { firstName, name, email, password } = route.params;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const inputRef = useRef<TextInput>(null);

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
  const canContinue = normalizedCode.length === 6 && !isLoading;

  function closePopup() {
    setPopup(null);
  }

  async function handleContinue() {
    if (!canContinue) {
      console.log('[Verificação] Código ainda não possui 6 dígitos.');
      return;
    }

    try {
      setIsLoading(true);

      console.log('[Verificação] Enviando código para confirmação...');

      const confirmResponse = await apiRequest<ConfirmSignUpResponse>(
        '/auth/confirm-signup',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            confirmationCode: normalizedCode,
          }),
        },
      );

      console.log(
        '[Verificação] Conta confirmada com sucesso.',
        confirmResponse.message,
      );

      console.log('[Login automático] Iniciando autenticação...');

      const loginResponse = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log('[Login automático] Login concluído com sucesso.');
      console.log(
        '[Login automático] Access token recebido:',
        Boolean(loginResponse.accessToken),
      );
      console.log(
        '[Login automático] ID token recebido:',
        Boolean(loginResponse.idToken),
      );
      console.log(
        '[Login automático] Refresh token recebido:',
        Boolean(loginResponse.refreshToken),
      );

      console.log('[Perfil] Iniciando criação do perfil inicial...');

      const profileResponse = await apiRequest<RegisterProfileResponse>(
        '/auth/register-profile',
        {
          method: 'POST',
          token: loginResponse.accessToken,
          body: JSON.stringify({
            nome: name,
            email,
          }),
        },
      );

      await signIn(loginResponse, {
        id: profileResponse.id,
        cognitoSub: profileResponse.cognitoSub,
        nome: profileResponse.nome,
        email: profileResponse.email,
        dataNascimento: null,
        genero: null,
        tipoDaltonismo: null,
        nivelDificuldadeLooks: null,
      });

      console.log('[Perfil] Perfil inicial salvo no PostgreSQL.');
      console.log('[Perfil] ID interno recebido:', Boolean(profileResponse.id));
      console.log(
        '[Perfil] Vínculo Cognito recebido:',
        Boolean(profileResponse.cognitoSub),
      );

      console.log('[Onboarding] Iniciando perguntas complementares...');

      navigation.navigate('RegisterWelcome', {
        firstName,
        accessToken: loginResponse.accessToken,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir seu cadastro. Tente novamente.';

      console.error('[Cadastro] Erro na confirmação/login/perfil:', message);

      if (isInvalidCodeMessage(message)) {
        setPopup({
          variant: 'error',
          title: 'Código inválido',
          message: 'Confira o código enviado para seu email e tente novamente.',
          buttonText: 'Tentar novamente',
        });

        return;
      }

      if (isEmailAlreadyRegistered(message)) {
        setPopup({
          variant: 'warning',
          title: 'Este email já está cadastrado',
          message:
            'Entre com sua senha ou recupere o acesso caso tenha esquecido.',
          buttonText: 'Ir para login',
          onConfirm: () => {
            setPopup(null);
            navigation.navigate('Login');
          },
        });

        return;
      }

      setPopup({
        variant: 'error',
        title: 'Não foi possível concluir seu cadastro',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsLoading(false);
      console.log('[Cadastro] Processamento da verificação finalizado.');
    }
  }

  return (
    <>
      <AuthLayout
        title="Crie uma conta"
        onBack={() => navigation.goBack()}
        contentStyle={styles.content}
        footer={
          <ZyraButton
            title={isLoading ? 'Confirmando...' : 'Continuar'}
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
            accessibilityLabel="Código de verificação"
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
