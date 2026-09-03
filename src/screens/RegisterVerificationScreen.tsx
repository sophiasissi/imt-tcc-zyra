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
import { ApiError, apiRequest } from '../services/api';
import { theme } from '../styles/theme';
import { useAuth, UserProfile } from '../contexts/AuthContext';

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

/**
 * Busca o perfil e, no caso raro em que ele não existe, cria.
 *
 * O caminho normal é só a busca: o perfil passou a ser gravado no
 * `/auth/signup`, junto com a criação da conta. A criação aqui cobre a falha
 * de banco naquele momento — e só é possível quando ainda temos o nome, ou
 * seja, quando o cadastro está sendo feito de ponta a ponta agora.
 */
async function carregarOuCriarPerfil(
  accessToken: string,
  email: string,
  nome?: string,
) {
  try {
    return await apiRequest<UserProfile>('/users/me', {
      method: 'GET',
      token: accessToken,
    });
  } catch (error) {
    if (!(error instanceof ApiError) || !error.isNotFound || !nome) {
      throw error;
    }

    console.log('[Perfil] Perfil ausente no login. Criando agora...');

    await apiRequest<UserProfile>('/auth/register-profile', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ nome, email }),
    });

    return apiRequest<UserProfile>('/users/me', {
      method: 'GET',
      token: accessToken,
    });
  }
}

export function RegisterVerificationScreen({ navigation, route }: Props) {
  const { signIn } = useAuth();

  const { firstName, name, email, password } = route.params;

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const inputRef = useRef<TextInput>(null);

  const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
  const canContinue = normalizedCode.length === 6 && !isLoading;

  function closePopup() {
    setPopup(null);
  }

  async function handleResendCode() {
    if (isResending || isLoading) {
      return;
    }

    try {
      setIsResending(true);

      const response = await apiRequest<{ message: string }>(
        '/auth/resend-code',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
        },
      );

      setPopup({
        variant: 'success',
        title: 'Código reenviado',
        message: response.message,
        buttonText: 'Entendi',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível reenviar o código.';

      setPopup({
        variant: 'error',
        title: 'Não foi possível reenviar',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsResending(false);
    }
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

      // O perfil já foi gravado no /auth/signup, junto com a criação da conta.
      // Aqui normalmente só o buscamos — inclusive quando a pessoa chegou por
      // um cadastro abandonado, em que o nome não está mais em mãos.
      const profileResponse = await carregarOuCriarPerfil(
        loginResponse.accessToken,
        email,
        name,
      );

      await signIn(loginResponse, profileResponse);

      console.log('[Perfil] Perfil confirmado no PostgreSQL.');
      console.log('[Onboarding] Iniciando perguntas complementares...');

      navigation.navigate('RegisterWelcome', {
        firstName: firstName ?? profileResponse.nome?.split(/\s+/)[0],
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

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Reenviar código de confirmação"
          accessibilityState={{ disabled: isResending || isLoading }}
          activeOpacity={0.75}
          disabled={isResending || isLoading}
          onPress={handleResendCode}
          style={styles.resendButton}
        >
          <Text style={styles.resendText}>
            {isResending ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
          </Text>
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
  resendButton: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resendText: {
    color: theme.colors.link,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    textAlign: 'center',
  },
});
