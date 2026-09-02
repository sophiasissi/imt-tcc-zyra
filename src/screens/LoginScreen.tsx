import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import GoogleIcon from '../../assets/icons/googleColor.svg';
import EyeClosedIcon from '../../assets/icons/eye-closed.svg';
import EyeOpenIcon from '../../assets/icons/eye-open.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ApiError, apiRequest } from '../services/api';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginResponse = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

type UserProfileResponse = {
  id: string;
  cognitoSub: string;
  nome: string | null;
  email: string | null;
  dataNascimento: string | null;
  genero: string | null;
  tipoDaltonismo: string | null;
  nivelDificuldadeLooks: number | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Busca o perfil e, se ele não existir, recria.
 *
 * O cadastro encadeia confirm-signup, login e register-profile. Se a última
 * falhar — basta uma oscilação de rede — a conta fica confirmada no Cognito
 * sem registro no Postgres, e a partir daí todo login batia em 404 sem
 * nenhuma saída pelo app.
 *
 * O register-profile é idempotente e aceita perfil sem nome, então dá para
 * fechar essa lacuna sozinho. O nome é preenchido depois em "Meus dados".
 */
async function carregarOuRecriarPerfil(accessToken: string, email: string) {
  try {
    return await apiRequest<UserProfileResponse>('/users/me', {
      method: 'GET',
      token: accessToken,
    });
  } catch (error) {
    if (!(error instanceof ApiError) || !error.isNotFound) {
      throw error;
    }

    console.log('[Login] Perfil não encontrado. Recriando cadastro no ZYRA...');

    await apiRequest<UserProfileResponse>('/auth/register-profile', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ email }),
    });

    return apiRequest<UserProfileResponse>('/users/me', {
      method: 'GET',
      token: accessToken,
    });
  }
}

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [senhaTouched, setSenhaTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValido = EMAIL_PATTERN.test(normalizedEmail);
  const senhaPreenchida = senha.trim().length > 0;
  const podeEntrar = emailValido && senhaPreenchida && !isLoading;

  const erroEmail =
    emailTouched && normalizedEmail.length === 0
      ? 'O email é obrigatório.'
      : emailTouched && !emailValido
        ? 'Digite um email válido.'
        : undefined;

  const erroSenha =
    senhaTouched && !senhaPreenchida ? 'A senha é obrigatória.' : undefined;

  function closePopup() {
    setPopup(null);
  }

  async function handleEntrar() {
    setEmailTouched(true);
    setSenhaTouched(true);

    if (!podeEntrar) {
      console.log('[Login] Dados inválidos ou incompletos.');
      return;
    }

    try {
      setIsLoading(true);

      console.log('[Login] Iniciando autenticação no Cognito...');

      const loginResponse = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password: senha,
        }),
      });

      console.log('[Login] Autenticação concluída com sucesso.');

      const profileResponse = await carregarOuRecriarPerfil(
        loginResponse.accessToken,
        normalizedEmail,
      );

      await signIn(loginResponse, profileResponse);

      console.log('[Login] Perfil localizado com sucesso.');
      console.log('[Login] Direcionando usuário para a Home...');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar na sua conta.';

      console.error(
        '[Login] Erro ao autenticar ou localizar perfil:',
        rawMessage,
      );

      // O back-end já traduz as exceções do Cognito para português — conta não
      // confirmada, muitas tentativas, email não encontrado. Antes tudo isso
      // virava "confira email e senha", que em vários casos é falso e manda o
      // usuário procurar um problema que não existe.
      //
      // Só substituímos quando a mensagem é genérica demais para ajudar.
      const mensagemGenerica =
        !rawMessage ||
        rawMessage.includes('Não foi possível concluir a requisição') ||
        rawMessage.includes('Não foi possível concluir a solicitação');

      setPopup({
        variant: 'error',
        title: 'Não foi possível entrar',
        message: mensagemGenerica
          ? 'Confira seu email e senha e tente novamente.'
          : rawMessage,
        buttonText: 'Entendi',
      });
    } finally {
      setIsLoading(false);
      console.log('[Login] Processamento finalizado.');
    }
  }

  function handleGoogleLogin() {
    setPopup({
      variant: 'info',
      title: 'Em breve',
      message:
        'O login com Google ainda não está integrado. Entre usando email e senha.',
      buttonText: 'Entendi',
      showCloseButton: true,
    });
  }

  function handleForgotPassword() {
    console.log('[Recuperação] Usuário iniciou recuperação de senha.');

    navigation.navigate('ForgotPasswordEmail');
  }

  return (
    <>
      <AuthLayout
        title="Entrar na conta"
        onBack={() => navigation.goBack()}
        contentStyle={styles.content}
        footer={
          <ZyraButton
            title={isLoading ? 'Entrando...' : 'Entrar'}
            disabled={!podeEntrar}
            onPress={handleEntrar}
          />
        }
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          activeOpacity={0.84}
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <GoogleIcon width={20} height={20} />
          <Text style={styles.googleText}>Entrar com Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.or}>ou</Text>
          <View style={styles.divider} />
        </View>

        <ZyraInput
          label="Email"
          placeholder="Digite seu email"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setEmailTouched(true)}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          error={erroEmail}
        />

        <ZyraInput
          label="Senha"
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          onBlur={() => setSenhaTouched(true)}
          secureTextEntry={!showSenha}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          error={erroSenha}
          rightAccessory={
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
              activeOpacity={0.75}
              hitSlop={8}
              style={styles.eyeButton}
              onPress={() => setShowSenha((currentValue) => !currentValue)}
            >
              {showSenha ? (
                <EyeOpenIcon width={21} height={21} />
              ) : (
                <EyeClosedIcon width={21} height={21} />
              )}
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Esqueci minha senha"
          activeOpacity={0.8}
          style={styles.forgotButton}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgot}>esqueceu sua senha?</Text>
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
    paddingTop: 34,
  },
  googleButton: {
    height: 58,
    borderRadius: theme.radius.input,
    backgroundColor: theme.colors.input,
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 27,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  googleText: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 19,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  or: {
    color: theme.colors.muted2,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
  eyeButton: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
  },
  forgot: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
});