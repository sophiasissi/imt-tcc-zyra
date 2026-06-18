import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import EyeClosedIcon from '../../assets/icons/eye-closed.svg';
import EyeOpenIcon from '../../assets/icons/eye-open.svg';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPassword'>;

const SPECIAL_CHARACTER_PATTERN = /[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=]/;

type Rule = {
  label: string;
  isValid: boolean;
};

type SignUpResponse = {
  message: string;
};

function isEmailAlreadyRegistered(message: string) {
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes('email já possui uma conta') ||
    lowerMessage.includes('email já está cadastrado') ||
    lowerMessage.includes('already')
  );
}

export function RegisterPasswordScreen({ navigation, route }: Props) {
  const { firstName, name, email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  function closePopup() {
    setPopup(null);
  }

  function renderEyeButton(isVisible: boolean, onPress: () => void) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
        activeOpacity={0.75}
        hitSlop={8}
        style={styles.eyeButton}
        onPress={onPress}
      >
        {isVisible ? (
          <EyeOpenIcon width={21} height={21} />
        ) : (
          <EyeClosedIcon width={21} height={21} />
        )}
      </TouchableOpacity>
    );
  }

  const rules: Rule[] = [
    { label: 'Pelo menos 8 caracteres', isValid: password.length >= 8 },
    {
      label: 'Pelo menos uma letra minúscula',
      isValid: /[a-z]/.test(password),
    },
    {
      label: 'Pelo menos uma letra maiúscula',
      isValid: /[A-Z]/.test(password),
    },
    { label: 'Pelo menos um número', isValid: /\d/.test(password) },
    {
      label: 'Pelo menos um símbolo',
      isValid: SPECIAL_CHARACTER_PATTERN.test(password),
    },
  ];

  const meetsAllRules = rules.every((rule) => rule.isValid);
  const passwordsMatch = confirmation.length > 0 && confirmation === password;
  const canContinue = meetsAllRules && passwordsMatch && !isLoading;

  async function handleContinue() {
    if (!canContinue) {
      return;
    }

    try {
      setIsLoading(true);

      console.log('[Cadastro] Iniciando criação da conta no Cognito...');

      const signUpResponse = await apiRequest<SignUpResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log(
        '[Cadastro] Signup concluído. Código solicitado ao Cognito.',
        signUpResponse.message,
      );

      setPopup({
        variant: 'success',
        title: 'Código enviado!',
        message: 'Enviamos um código de confirmação para seu email.',
        buttonText: 'Inserir código',
        onConfirm: () => {
          setPopup(null);

          console.log('[Navegação] Direcionando usuário para verificação...');

          navigation.navigate('RegisterVerification', {
            firstName,
            name,
            email,
            password,
          });
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar sua conta. Tente novamente.';

      console.error('[Cadastro] Erro ao criar conta:', message);

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
        title: 'Não foi possível criar sua conta',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsLoading(false);
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
            title={isLoading ? 'Criando conta...' : 'Continuar'}
            disabled={!canContinue}
            onPress={handleContinue}
          />
        }
      >
        <ZyraInput
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          rightAccessory={renderEyeButton(showPassword, () =>
            setShowPassword((currentValue) => !currentValue),
          )}
        />

        <View style={styles.validationList}>
          {rules.map((rule) => (
            <View key={rule.label} style={styles.ruleRow}>
              <Text style={[styles.ruleIcon, rule.isValid && styles.ruleValid]}>
                {rule.isValid ? '✓' : '○'}
              </Text>
              <Text style={[styles.ruleText, rule.isValid && styles.ruleValid]}>
                {rule.label}
              </Text>
            </View>
          ))}
        </View>

        <ZyraInput
          label="Confirmar senha"
          placeholder="Digite a senha novamente"
          value={confirmation}
          onChangeText={setConfirmation}
          onBlur={() => setConfirmationTouched(true)}
          secureTextEntry={!showConfirmation}
          autoCapitalize="none"
          autoCorrect={false}
          error={
            confirmationTouched && !passwordsMatch
              ? 'As senhas precisam ser iguais.'
              : undefined
          }
          rightAccessory={renderEyeButton(showConfirmation, () =>
            setShowConfirmation((currentValue) => !currentValue),
          )}
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
  eyeButton: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
