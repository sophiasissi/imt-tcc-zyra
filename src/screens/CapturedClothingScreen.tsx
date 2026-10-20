import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { cadastrarPeca, nomeDaPeca } from '../services/pecasApi';
import { combinarPecas, RespostaCombinar } from '../services/looksApi';
import { FotoDaPeca } from '../components/FotoDaPeca';
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
    photoTipo,
    semFundo,
    tipoDaPeca,
    colorName,
    colorAddSymbol,
    hex,
  } = route.params;
  const { tokens } = useAuth();

  const [isCadastrando, setIsCadastrando] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  // As sugestões crescem com a tela, sem empurrar o botão para fora dela.
  const { height: alturaDaTela } = useWindowDimensions();
  const alturaSugestao = Math.round(
    Math.min(Math.max(alturaDaTela * 0.17, 110), 180),
  );
  // undefined: carregando; null: não deu para buscar (sem tipo, sem cor, erro).
  const [combinacoes, setCombinacoes] = useState<
    RespostaCombinar | null | undefined
  >(tipoDaPeca && colorName && colorAddSymbol && hex ? undefined : null);

  const accessTokenAtual = tokens?.accessToken;

  // Peças do armário que combinam: só regras de cor no back, sem IA.
  // "Ver outras": cada rodada pede uma dupla nova, sem repetir as já vistas.
  const [rodada, setRodada] = useState(0);
  const pecasVistas = useRef<string[]>([]);

  useEffect(() => {
    if (!tipoDaPeca || !colorName || !colorAddSymbol || !hex) return;
    if (!accessTokenAtual) return;

    let ativo = true;
    combinarPecas(
      {
        tipo: tipoDaPeca,
        corNome: colorName,
        hex,
        colorAddSymbol,
        excluir: pecasVistas.current,
      },
      accessTokenAtual,
    )
      .then((resposta) => {
        if (!ativo) return;
        if (resposta.status === 'OK') {
          const novas = resposta.sugestoes.map(({ peca }) => peca.id);
          // Se o back recomeçou (já tinha mostrado todas), a lista recomeça.
          const repetiu = novas.some((id) => pecasVistas.current.includes(id));
          pecasVistas.current = repetiu
            ? novas
            : [...pecasVistas.current, ...novas];
        }
        setCombinacoes(resposta);
      })
      .catch((error: unknown) => {
        console.error('[Peça capturada] Falha ao buscar combinações:', error);
        if (ativo) setCombinacoes(null);
      });

    return () => {
      ativo = false;
    };
  }, [tipoDaPeca, colorName, colorAddSymbol, hex, accessTokenAtual, rodada]);

  function verOutrasCombinacoes() {
    setCombinacoes(undefined);
    setRodada((atual) => atual + 1);
  }

  const symbol = getColorAddSymbol(colorAddSymbol);
  const displayedColorName = symbol?.label ?? colorName ?? '';

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
      const peca = await cadastrarPeca(
        {
          photoUri,
          photoTipo,
          corNome: colorName,
          hex,
          colorAddSymbol,
        },
        accessToken,
      );

      setPopup({
        variant: 'success',
        title: 'Roupa cadastrada!',
        // A análise da peça pode corrigir a cor lida pela câmera (luz de
        // lâmpada engana a leitura por pixels), então diz o que foi salvo.
        message: `Salvamos ${nomeDaPeca(peca)}, ${
          getColorAddSymbol(peca.colorAddSymbol)?.label ??
          peca.corNome.toLowerCase()
        }. A peça já está no seu armário digital.`,
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
    <View style={styles.screen}>
      {/* O vermelho da marca fica só no cabeçalho, com a cor e o símbolo. No
          corpo, um fundo que não altera como a cor da peça é percebida. */}
      <View style={styles.headerFundo}>
        <SafeAreaView>
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
              {symbol ? (
                <Image
                  source={symbol.image}
                  style={styles.colorSymbol}
                  tintColor="#FFFFFF"
                />
              ) : null}

              {displayedColorName ? (
                <Text style={styles.colorText}>{displayedColorName}</Text>
              ) : null}
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={styles.corpo}>
        {/* A foto ocupa o espaço que sobra: sugestões e botão sempre cabem. */}
        <View style={styles.fotoArea}>
          <Image
            source={{ uri: photoUri }}
            style={[styles.clothingImage, semFundo && styles.clothingSemFundo]}
          />
        </View>

        {/* Recomendações num cartão, separadas da foto da peça nova. */}
        <View style={styles.cartaoSugestoes}>
          <Text style={styles.sectionTitle}>
            Peças do seu armário que combinam
          </Text>

          {combinacoes === undefined ? (
            <View style={[styles.emptyStateBox, { height: alturaSugestao }]}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : combinacoes?.status === 'OK' ? (
            <>
              <View style={styles.sugestoes}>
                {combinacoes.sugestoes.map(({ peca }) => {
                  // Só a peça e a cor (nome + símbolo ColorADD), sem quadro em
                  // volta: a peça sem fundo fica sobre a cor da tela.
                  const simbolo = getColorAddSymbol(peca.colorAddSymbol);
                  const cor = simbolo?.label ?? peca.corNome;
                  return (
                    <View
                      key={peca.id}
                      style={styles.sugestao}
                      accessible
                      accessibilityLabel={`${nomeDaPeca(peca)}, ${cor}`}
                    >
                      <FotoDaPeca
                        uri={peca.imagemMiniUrl}
                        style={[
                          styles.sugestaoFoto,
                          { height: alturaSugestao },
                        ]}
                      />
                      <View style={styles.sugestaoCor}>
                        {simbolo ? (
                          <Image
                            source={simbolo.image}
                            style={styles.sugestaoSimbolo}
                          />
                        ) : null}
                        <Text style={styles.sugestaoCorTexto}>{cor}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.75}
                hitSlop={8}
                style={styles.verOutras}
                onPress={verOutrasCombinacoes}
              >
                <Text style={styles.verOutrasTexto}>
                  Ver outras combinações
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.emptyStateBox, { height: alturaSugestao }]}>
              <Text style={styles.emptyStateTitle}>
                {combinacoes?.status === 'POUCAS_PECAS'
                  ? 'Ainda não é possível sugerir combinações'
                  : 'Ainda não há combinações disponíveis'}
              </Text>

              <Text style={styles.emptyStateText}>
                {combinacoes
                  ? combinacoes.mensagem
                  : 'Cadastre a peça para ver as combinações com o seu armário.'}
              </Text>
            </View>
          )}
        </View>

        <ZyraButton
          title="Cadastrar nova peça"
          onPress={handleCadastrar}
          disabled={isCadastrando}
          style={styles.botao}
        />
      </SafeAreaView>

      {/* Montado só durante o cadastro, para as etapas recomeçarem do início
          a cada tentativa. */}
      {isCadastrando ? (
        <ZyraLoadingPopup
          modal={false}
          visible
          title="Cadastrando sua peça"
          steps={CADASTRO_STEPS}
        />
      ) : null}

      <ZyraPopup
        modal={false}
        visible={Boolean(popup)}
        variant={popup?.variant ?? 'info'}
        title={popup?.title ?? ''}
        message={popup?.message}
        buttonText={popup?.buttonText ?? 'Entendi'}
        onConfirm={handleConfirmPopup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerFundo: {
    backgroundColor: '#AB003E',
  },
  corpo: {
    flex: 1,
    marginHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  fotoArea: {
    flex: 1,
    minHeight: 160,
    marginBottom: 18,
  },
  botao: {
    marginTop: 4,
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
  clothingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  // Sem fundo: a peça inteira, sobre a cor da tela, sem o quadro cinza.
  clothingSemFundo: {
    resizeMode: 'contain',
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  cartaoSugestoes: {
    // Um tom abaixo do fundo e borda suave: separa as recomendações sem
    // apagar as peças brancas sem fundo.
    backgroundColor: '#F0EEEA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  sugestoes: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  verOutras: {
    alignSelf: 'center',
    paddingVertical: 4,
    marginTop: -6,
    marginBottom: 12,
  },
  verOutrasTexto: {
    color: theme.colors.link,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  sugestao: {
    flex: 1,
    alignItems: 'center',
  },
  sugestaoFoto: {
    width: '100%',
    height: 210,
  },
  sugestaoCor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  sugestaoSimbolo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  sugestaoCorTexto: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    textTransform: 'lowercase',
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
