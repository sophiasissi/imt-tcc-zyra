import React from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { tituloDoLook } from '../components/LookSalvoItem';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PapelNoLook, PecaDoLook } from '../services/looksApi';
import { CATEGORIA_LABEL } from '../services/pecasApi';
import { theme } from '../styles/theme';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { formatarDataPorExtenso } from '../utils/formatarData';

type Props = NativeStackScreenProps<RootStackParamList, 'LookDetalhe'>;

/** Onde a peça entra no look, dito como a pessoa falaria. */
const PAPEL_LABEL: Record<PapelNoLook, string> = {
  SUPERIOR: 'Parte de cima',
  SOBREPOSICAO: 'Por cima',
  INFERIOR: 'Parte de baixo',
  PECA_UNICA: 'Peça única',
  CALCADO: 'Calçado',
};

const PAGE_SIDE = 24;
const THUMB_SIZE = 56;
const BACK_SIZE = 36;
const HEADER_GAP = 14;

function descreverPeca(peca: PecaDoLook) {
  const symbol = getColorAddSymbol(peca.colorAddSymbol);

  return {
    symbol,
    categoria: CATEGORIA_LABEL[peca.categoria],
    cor: symbol?.label ?? peca.corNome,
    papel: PAPEL_LABEL[peca.papel],
  };
}

/**
 * Look salvo em tela cheia: uma peça por página, grande, com a cor escrita e
 * o símbolo ColorADD; embaixo, as miniaturas de todas as peças para pular
 * direto para uma delas.
 */
export function LookDetalheScreen({ navigation, route }: Props) {
  const { look } = route.params;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const listRef = React.useRef<FlatList<PecaDoLook>>(null);
  const [paginaAtual, setPaginaAtual] = React.useState(0);

  const titulo = tituloDoLook(look);
  const data = formatarDataPorExtenso(look.criadoEm);
  const total = look.pecas.length;

  // Foto do maior tamanho que deixa título, legenda e miniaturas visíveis.
  const fotoLargura = screenWidth - PAGE_SIDE * 2;
  const fotoAltura = Math.min(fotoLargura * 1.2, screenHeight * 0.44);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const pagina = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setPaginaAtual(Math.max(0, Math.min(pagina, total - 1)));
  }

  function irParaPagina(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setPaginaAtual(index);
  }

  return (
    <LinearGradient
      colors={['#AB003E', '#D66A92', '#FAF9F6']}
      locations={[0, 0.38, 0.62]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {/* Seta e título na mesma linha, centrados entre si; a data fica
              embaixo, alinhada ao título, sem empurrar o título para cima. */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para a Galeria de Looks"
              activeOpacity={0.82}
              hitSlop={8}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M15.5 5l-7 7 7 7"
                  stroke={theme.colors.primary}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>

            <Text
              style={styles.title}
              numberOfLines={2}
              accessibilityRole="header"
            >
              {titulo}
            </Text>
          </View>

          {data ? <Text style={styles.date}>Salvo em {data}</Text> : null}
        </View>

        <FlatList
          ref={listRef}
          data={look.pecas}
          keyExtractor={(peca) => peca.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          style={styles.pager}
          renderItem={({ item: peca }) => {
            const { symbol, categoria, cor, papel } = descreverPeca(peca);

            return (
              <View
                style={[styles.page, { width: screenWidth }]}
                accessible
                accessibilityLabel={`${papel}: ${categoria}, ${cor}`}
              >
                <View style={styles.photoShadow}>
                  <Image
                    source={{ uri: peca.imagemUrl }}
                    style={[
                      styles.photo,
                      { width: fotoLargura, height: fotoAltura },
                    ]}
                  />
                </View>

                <View style={[styles.caption, { width: fotoLargura }]}>
                  {symbol ? (
                    <Image source={symbol.image} style={styles.captionSymbol} />
                  ) : null}

                  <View style={styles.captionTexts}>
                    <Text style={styles.captionPapel}>{papel}</Text>
                    <Text style={styles.captionPeca} numberOfLines={1}>
                      {categoria} {cor}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {total > 1 ? (
          <View style={styles.footer}>
            <Text style={styles.counter} accessibilityLiveRegion="polite">
              Peça {paginaAtual + 1} de {total}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbs}
            >
              {look.pecas.map((peca, index) => {
                const { categoria, cor } = descreverPeca(peca);
                const ativa = index === paginaAtual;

                return (
                  <TouchableOpacity
                    key={peca.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${categoria} ${cor}`}
                    accessibilityState={{ selected: ativa }}
                    activeOpacity={0.8}
                    style={[
                      styles.thumb,
                      ativa ? styles.thumbActive : styles.thumbInactive,
                    ]}
                    onPress={() => irParaPagina(index)}
                  >
                    <Image
                      source={{ uri: peca.imagemUrl }}
                      style={styles.thumbPhoto}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </SafeAreaView>
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
    paddingHorizontal: PAGE_SIDE,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_GAP,
  },
  // Branco sobre o degradê rosa, com a seta na cor do app.
  backButton: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: BACK_SIZE / 2,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    flex: 1,
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  // Alinhada ao início do título, não ao da seta.
  date: {
    color: theme.colors.white,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    marginTop: 2,
    marginLeft: BACK_SIZE + HEADER_GAP,
  },
  pager: {
    flexGrow: 0,
  },
  page: {
    alignItems: 'center',
  },
  photoShadow: {
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  photo: {
    borderRadius: 24,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  // A cor sempre escrita e com o símbolo, nunca só pela foto.
  caption: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: theme.colors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  captionSymbol: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  captionTexts: {
    flex: 1,
  },
  captionPapel: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  captionPeca: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    textTransform: 'lowercase',
  },
  // Centrado no espaço que sobra, com um respiro mínimo da legenda acima.
  footer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 28,
    paddingBottom: 12,
  },
  counter: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  thumbs: {
    gap: 10,
    paddingHorizontal: PAGE_SIDE,
    flexGrow: 1,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE + 6,
    height: THUMB_SIZE + 6,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  // Borda na ativa e as outras esmaecidas: a marcação não depende só da cor.
  thumbActive: {
    borderColor: theme.colors.primary,
  },
  thumbInactive: {
    opacity: 0.6,
  },
  thumbPhoto: {
    flex: 1,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
});
