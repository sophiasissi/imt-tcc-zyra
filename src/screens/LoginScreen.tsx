import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import GoogleIcon from '../../assets/icons/googleColor.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';

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

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [senhaTouched, setSenhaTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      console.log(
        '[Login] Access token recebido:',
        Boolean(loginResponse.accessToken),
      );
      console.log(
        '[Login] ID token recebido:',
        Boolean(loginResponse.idToken),
      );
      console.log(
        '[Login] Refresh token recebido:',
        Boolean(loginResponse.refreshToken),
      );

      console.log('[Login] Buscando perfil do usuário no PostgreSQL...');

      const profileResponse = await apiRequest<UserProfileResponse>(
        '/users/me',
        {
          method: 'GET',
          token: loginResponse.accessToken,
        },
      );

      console.log('[Login] Perfil localizado com sucesso.');
      console.log('[Login] ID interno recebido:', Boolean(profileResponse.id));
      console.log(
        '[Login] Vínculo Cognito recebido:',
        Boolean(profileResponse.cognitoSub),
      );
      console.log(
        '[Login] Nome salvo:',
        Boolean(profileResponse.nome),
      );
      console.log(
        '[Login] Onboarding possui data de nascimento:',
        Boolean(profileResponse.dataNascimento),
      );

      Alert.alert(
        'Login realizado',
        `Bem-vindo(a) de volta, ${profileResponse.nome ?? 'usuário'}! Seu perfil foi localizado.`,
      );

      /*
        A navegação para Home será adicionada quando a tela principal
        estiver conectada ao fluxo autenticado.
      */
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar na sua conta.';

      console.error('[Login] Erro ao autenticar ou localizar perfil:', message);

      Alert.alert('Erro ao entrar', message);
    } finally {
      setIsLoading(false);
      console.log('[Login] Processamento finalizado.');
    }
  }

  function handleGoogleLogin() {
    Alert.alert(
      'Em breve',
      'O login com Google ainda não está integrado. Entre usando email e senha.',
    );
  }

  function handleForgotPassword() {
    Alert.alert(
      'Em breve',
      'A recuperação de senha será integrada na próxima etapa.',
    );
  }

  return (
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
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        error={erroSenha}
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