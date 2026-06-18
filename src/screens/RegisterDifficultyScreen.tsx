import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterDifficulty'>;

type UpdateProfileResponse = {
  id: string;
  cognitoSub: string;
  nome: string | null;
  email: string | null;
  dataNascimento: string | null;
  genero: string | null;
  tipoDaltonismo: string | null;
  nivelDificuldadeLooks: number | null;
};

const numbers = [0, 1, 2, 3, 4, 5];

export function RegisterDifficultyScreen({ navigation, route }: Props) {
  const { tokens, updateUser } = useAuth();

  const { dataNascimento, genero, tipoDaltonismo } = route.params;
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
      ...(nivelDificuldadeLooks !== undefined ? { nivelDificuldadeLooks } : {}),
    };

    try {
      setIsLoading(true);

      console.log('[Onboarding] Enviando dados complementares para o banco...');

      const response = await apiRequest<UpdateProfileResponse>('/users/me', {
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
              <Text style={styles.skip}>Prefiro não dizer</Text>
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

        <View style={styles.scale}>
          {numbers.map((number) => (
            <TouchableOpacity
              key={number}
              accessibilityRole="button"
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={() => setSelected(number)}
              style={[
                styles.circle,
                selected === number && styles.selectedCircle,
              ]}
            >
              <Text
                style={[
                  styles.number,
                  selected === number && styles.selectedNumber,
                ]}
              >
                {number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.captionRow}>
          <Text style={styles.caption}>Nenhuma dificuldade</Text>
          <Text style={styles.caption}>Muita dificuldade</Text>
        </View>
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
  question: {
    marginTop: 200,
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
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    backgroundColor: theme.colors.primary,
  },
  number: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedNumber: {
    color: theme.colors.white,
  },
  captionRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 11,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});