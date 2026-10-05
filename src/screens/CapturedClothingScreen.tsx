import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { cadastrarPeca } from '../services/pecasApi';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraLoadingPopup } from '../components/ZyraLoadingPopup';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';

import LeftArrowIcon from '../../assets/icons/left-arrow-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'CapturedClothing'>;

// Etapas reais do cadastro, na ordem em que o back executa.
const CADASTRO_STEPS = [
  'Guardando a foto no seu armário',
  'Reconhecendo o tipo, o tecido e o estilo',
  'Salvando as informações da peça',
];

export function CapturedClothingScreen({ navigation, route }: Props) {
  const {
    photoUri,
    colorName,
    colorAddSymbol,
    hex,
    corSecundariaNome,
    hexSecundario,
    colorAddSymbolSecundario,
  } = route.params;
  const { tokens } = useAuth();

  const [isCadastrando, setIsCadastrando] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const symbol = getColorAddSymbol(colorAddSymbol);
  const symbolSecundario = getColorAddSymbol(colorAddSymbolSecundario);
  const nomePrincipal = symbol?.label ?? colorName ?? '';
  const nomeSecundario = symbolSecundario?.label ?? corSecundariaNome ?? '';
  const displayedColorName =
    nomePrincipal && nomeSecundario
      ? `${nomePrincipal} e ${nomeSecundario}`
      : nomePrincipal;

  function handleGoBack() {
    navigation.goBack();
  }

  /**
   * Só aqui a análise paga acontece: o back sobe a foto para o S3, analisa a
   * peça com a OpenAI e grava no banco. Tirar a foto não gasta nada.
   */
  async function handleCadastrar() {
    const accessToken = tokens?.accessToken;

    if (!accessToken || isCadastrando) {
      return;
    }

    setIsCadastrando(true);

    try {
      await cadastrarPeca(
        {
          photoUri,
          corNome: colorName,
          hex,
          colorAddSymbol,
          corSecundariaNome,
          hexSecundario,
          colorAddSymbolSecundario,
        },
        accessToken,
      );

      setPopup({
        variant: 'success',
        title: 'Roupa cadastrada!',
        message: 'A peça já está no seu armário digital.',
        buttonText: 'Ir para o início',
        // Volta para a Home tirando a câmera e esta tela da pilha. A Home
        // recarrega o armário ao ganhar foco, então a peça nova já aparece.
        onConfirm: () => navigation.popTo('Home'),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível cadastrar a peça agora.';

      console.error('[Cadastro de peça] Falha:', message);

      // A foto continua nesta tela: a pessoa pode tentar de novo sem
      // precisar fotografar outra vez.
      setPopup({
        variant: 'error',
        title: 'Não foi possível cadastrar',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsCadastrando(false);
    }
  }

  function handleConfirmPopup() {
    const onConfirm = popup?.onConfirm;

    setPopup(null);
    onConfirm?.();
  }

  return (
    <LinearGradient
      colors={['#AB003E', '#D66A92', '#FAF9F6']}
      locations={[0, 0.45, 0.72]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.75}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <LeftArrowIcon width={28} height={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.colorHeader}>
            <View style={styles.colorSymbolRow}>
              {symbol ? (
                <Image
                  source={symbol.image}
                  style={styles.colorSymbol}
                  tintColor="#FFFFFF"
                />
              ) : null}

              {symbolSecundario ? (
                <Image
                  source={symbolSecundario.image}
                  style={styles.colorSymbol}
                  tintColor="#FFFFFF"
                />
              ) : null}
            </View>

            {displayedColorName ? (
              <Text style={styles.colorText}>{displayedColorName}</Text>
            ) : null}
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: photoUri }} style={styles.clothingImage} />

          <View style={styles.bottomContent}>
            <Text style={styles.sectionTitle}>
              Peças do seu armário que combinam
            </Text>

            {/* Aqui entram as duas peças sugeridas pelo algoritmo de
                combinação (sem IA), quando ele estiver pronto. */}
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>
                Ainda não há combinações disponíveis
              </Text>

              <Text style={styles.emptyStateText}>
                Cadastre mais peças no seu closet para o ZYRA sugerir
                combinações com esta roupa.
              </Text>
            </View>

            <ZyraButton
              title="Cadastrar nova peça"
              onPress={handleCadastrar}
              disabled={isCadastrando}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Montado só durante o cadastro, para as etapas recomeçarem do início
          a cada tentativa. */}
      {isCadastrando ? (
        <ZyraLoadingPopup
          visible
          title="Cadastrando sua peça"
          steps={CADASTRO_STEPS}
        />
      ) : null}

      <ZyraPopup
        visible={Boolean(popup)}
        variant={popup?.variant ?? 'info'}
        title={popup?.title ?? ''}
        message={popup?.message}
        buttonText={popup?.buttonText ?? 'Entendi'}
        onConfirm={handleConfirmPopup}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 86,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  colorHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  colorSymbolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSymbol: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  colorText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  clothingImage: {
    width: '100%',
    height: 390,
    borderRadius: 18,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  bottomContent: {
    marginTop: 28,
    backgroundColor: 'rgba(250, 249, 246, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
  },
  sectionTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyStateBox: {
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
