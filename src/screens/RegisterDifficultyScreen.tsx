import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { EscalaDificuldade } from '../components/EscalaDificuldade';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';
import { UserProfile, useAuth } from '../contexts/AuthContext';
import { DIFICULDADE_PREFIRO_NAO_DIZER } from '../constants/perfil';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterDifficulty'>;

export function RegisterDifficultyScreen({ navigation, route }: Props) {
  const { tokens, updateUser } = useAuth();

  const { dataNascimento, genero, tipoDaltonismo, consentimentoDadosSaude } =
    route.params;
  const accessToken = tokens?.accessToken ?? '';

  const [selected, setSelected] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  function closePopup() {
    setPopup(null);
  }

  async function finishOnboarding(nivelDificuldadeLooks?: number) {
    if (!accessToken) {
      console.error('[Onboarding] Token não disponível para salvar perfil.');

      setPopup({
        variant: 'warning',
        title: 'Sessão não encontrada',
        message:
          'Para salvar seus dados, conclua o cadastro utilizando e-mail.',
        buttonText: 'Entendi',
      });

      return;
    }

    const payload = {
      dataNascimento,
      ...(genero ? { genero } : {}),
      ...(tipoDaltonismo ? { tipoDaltonismo } : {}),
      ...(consentimentoDadosSaude ? { consentimentoDadosSaude: true } : {}),
      ...(nivelDificuldadeLooks !== undefined ? { nivelDificuldadeLooks } : {}),
    };

    try {
      setIsLoading(true);

      console.log('[Onboarding] Enviando dados complementares para o banco...');

      const response = await apiRequest<UserProfile>('/users/me', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify(payload),
      });

      updateUser(response);

      console.log('[Onboarding] Perfil complementar atualizado com sucesso.');

      setPopup({
        variant: 'success',
        title: 'Cadastro concluído!',
        message:
          'Seu perfil foi criado com sucesso. Agora você já pode usar o ZYRA.',
        buttonText: 'Ir para Home',
        onConfirm: () => {
          setPopup(null);

          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Tente novamente em alguns instantes.';

      console.error('[Onboarding] Erro ao atualizar perfil:', message);

      setPopup({
        variant: 'error',
        title: 'Não foi possível salvar suas informações',
        message:
          message.includes('conectar ao servidor') ||
          message.includes('Tente novamente')
            ? message
            : 'Tente novamente em alguns instantes.',
        buttonText: 'Tentar novamente',
      });
    } finally {
      setIsLoading(false);
      console.log('[Onboarding] Processamento finalizado.');
    }
  }

  function handleContinue() {
    if (selected === null) {
      return;
    }

    console.log('[Onboarding] Nível de dificuldade selecionado:', selected);

    void finishOnboarding(selected);
  }

  function handleSkip() {
    console.log('[Onboarding] Usuário preferiu não informar dificuldade.');

    void finishOnboarding();
  }

  return (
    <>
      <AuthLayout
        contentStyle={styles.centralizado}
        title=""
        onBack={() => navigation.goBack()}
        footer={
          <>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.8}
              disabled={isLoading}
              onPress={handleSkip}
            >
              <Text style={styles.skip}>{DIFICULDADE_PREFIRO_NAO_DIZER}</Text>
            </TouchableOpacity>

            <ZyraButton
              title={isLoading ? 'Salvando...' : 'Continuar'}
              disabled={selected === null || isLoading}
              onPress={handleContinue}
            />
          </>
        }
      >
        <Text style={styles.question}>
          Quanta dificuldade você sente ao combinar roupas?
        </Text>

        <Text style={styles.helper}>
          Isso permitirá entender melhor{`\n`}nosso público!
        </Text>

        <EscalaDificuldade
          selected={selected}
          onSelect={setSelected}
          disabled={isLoading}
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
  // Pergunta no centro da área entre o topo e o botão, em qualquer celular.
  centralizado: {
    justifyContent: 'center',
  },
  question: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    lineHeight: 29,
    textAlign: 'center',
  },
  helper: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
