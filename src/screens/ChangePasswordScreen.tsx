import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';

import BackIcon from '../../assets/icons/backArrow.svg';
import EyeClosedIcon from '../../assets/icons/eye-closed.svg';
import EyeOpenIcon from '../../assets/icons/eye-open.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

const SPECIAL_CHARACTER_PATTERN = /[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=]/;

type Rule = {
  label: string;
  isValid: boolean;
};

export function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordTouched, setCurrentPasswordTouched] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [confirmationTouched, setConfirmationTouched] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const rules: Rule[] = [
    {
      label: 'Pelo menos 8 caracteres',
      isValid: newPassword.length >= 8,
    },
    {
      label: 'Pelo menos uma letra minúscula',
      isValid: /[a-z]/.test(newPassword),
    },
    {
      label: 'Pelo menos uma letra maiúscula',
      isValid: /[A-Z]/.test(newPassword),
    },
    {
      label: 'Pelo menos um número',
      isValid: /\d/.test(newPassword),
    },
    {
      label: 'Pelo menos um símbolo',
      isValid: SPECIAL_CHARACTER_PATTERN.test(newPassword),
    },
  ];

  const currentPasswordFilled = currentPassword.trim().length > 0;
  const newPasswordIsValid = rules.every((rule) => rule.isValid);
  const passwordsMatch =
    confirmation.length > 0 && confirmation === newPassword;

  const canSubmit =
    currentPasswordFilled && newPasswordIsValid && passwordsMatch;

  const currentPasswordError =
    currentPasswordTouched && !currentPasswordFilled
      ? 'Digite sua senha atual.'
      : undefined;

  const confirmationError =
    confirmationTouched && !passwordsMatch
      ? 'As senhas precisam ser iguais.'
      : undefined;

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

  function handleChangePassword() {
    Keyboard.dismiss();

    setCurrentPasswordTouched(true);
    setConfirmationTouched(true);

    if (!currentPasswordFilled) {
      return;
    }

    if (!newPasswordIsValid) {
      setPopup({
        variant: 'warning',
        title: 'Nova senha inválida',
        message: 'Confira os requisitos da nova senha antes de continuar.',
        buttonText: 'Entendi',
      });

      return;
    }

    if (!passwordsMatch) {
      return;
    }

    console.log('[Alterar senha] Fluxo visual criado. Integração futura.');

    setPopup({
      variant: 'info',
      title: 'Alteração de senha',
      message:
        'Essa tela já está pronta visualmente. Na próxima etapa, vamos integrar com o back para validar a senha atual e salvar a nova senha.',
      buttonText: 'Entendi',
    });
  }

  function handleForgotPassword() {
    Keyboard.dismiss();
    navigation.navigate('ForgotPasswordEmail');
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={theme.colors.background}
          />

          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              activeOpacity={0.75}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackIcon width={26} height={26} />
            </TouchableOpacity>

            <Text style={styles.title}>Alterar senha</Text>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.description}>
                A senha deve ter no mínimo 8 caracteres e incluir uma combinação
                de números, letras e caracteres especiais (!$@%).
              </Text>

              <ZyraInput
                label="Senha atual"
                placeholder=""
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onBlur={() => setCurrentPasswordTouched(true)}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
                error={currentPasswordError}
                rightAccessory={renderEyeButton(showCurrentPassword, () =>
                  setShowCurrentPassword((currentValue) => !currentValue),
                )}
              />

              <ZyraInput
                label="Nova senha"
                placeholder=""
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                rightAccessory={renderEyeButton(showNewPassword, () =>
                  setShowNewPassword((currentValue) => !currentValue),
                )}
              />

              <View style={styles.validationList}>
                {rules.map((rule) => (
                  <View key={rule.label} style={styles.ruleRow}>
                    <Text
                      style={[styles.ruleIcon, rule.isValid && styles.ruleValid]}
                    >
                      {rule.isValid ? '✓' : '○'}
                    </Text>

                    <Text
                      style={[styles.ruleText, rule.isValid && styles.ruleValid]}
                    >
                      {rule.label}
                    </Text>
                  </View>
                ))}
              </View>

              <ZyraInput
                label="Confirmar senha"
                placeholder=""
                value={confirmation}
                onChangeText={setConfirmation}
                onBlur={() => setConfirmationTouched(true)}
                secureTextEntry={!showConfirmation}
                autoCapitalize="none"
                autoCorrect={false}
                error={confirmationError}
                rightAccessory={renderEyeButton(showConfirmation, () =>
                  setShowConfirmation((currentValue) => !currentValue),
                )}
              />

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Esqueci minha senha"
                activeOpacity={0.8}
                style={styles.forgotButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotText}>esqueceu sua senha?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <ZyraButton
                title="Alterar Senha"
                disabled={!canSubmit}
                onPress={handleChangePassword}
              />
            </View>
          </ScrollView>

          {popup ? (
            <ZyraPopup
              visible
              {...popup}
              onConfirm={popup.onConfirm ?? closePopup}
              onClose={closePopup}
            />
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    height: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
  },
  headerSpacer: {
    width: 34,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  description: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 30,
  },
  validationList: {
    marginTop: -8,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 42,
  },
});