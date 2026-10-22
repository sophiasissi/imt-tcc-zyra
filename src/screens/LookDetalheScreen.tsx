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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ClosetItemCard } from '../components/ClosetItemCard';
import { FotoDaPeca } from '../components/FotoDaPeca';
import { cabeNaColagem, LookColagem } from '../components/LookColagem';
import { tituloDoLook } from '../components/LookSalvoItem';
import { PecaExpandida } from '../components/PecaExpandida';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PapelNoLook, PecaDoLook } from '../services/looksApi';
import { nomeDaPeca } from '../services/pecasApi';
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
const GRID_GAP = 10;
// Altura da legenda embaixo da foto (margem + faixa branca).
const LEGENDA_ALTURA = 84;
// Look montado: margem dos lados, altura máxima em relação à largura (mais
// alto que isso, as peças se afastam demais) e quanto as peças crescem em
// relação ao molde do chat. Ajuste estes três para mudar o tamanho do look.
const LOOK_SIDE = 12;
const LOOK_PROPORCAO_MAXIMA = 1.3;
const ESCALA_DAS_PECAS = 1.12;

/** Primeira página: o look montado; as outras, uma peça cada. */
type Pagina = { tipo: 'look' } | { tipo: 'peca'; peca: PecaDoLook };

function descreverPeca(peca: PecaDoLook) {
  const symbol = getColorAddSymbol(peca.colorAddSymbol);

  return {
    symbol,
    categoria: nomeDaPeca(peca),
    cor: symbol?.label ?? peca.corNome,
    papel: PAPEL_LABEL[peca.papel],
  };
}

/**
 * Look salvo em tela cheia. A primeira página é o look montado igual ao do
 * chat (tocar numa peça abre ela ampliada); deslizando, uma peça por página,
 * grande, com a cor escrita e o símbolo ColorADD. Embaixo, as miniaturas para
 * pular direto para o look ou para uma peça.
 */
export function LookDetalheScreen({ navigation, route }: Props) {
  const { look } = route.params;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const listRef = React.useRef<FlatList<Pagina>>(null);
  const [paginaAtual, setPaginaAtual] = React.useState(0);
  // Altura livre entre o cabeçalho e as miniaturas, medida na tela.
  const [alturaLivre, setAlturaLivre] = React.useState(0);
  const [pecaAberta, setPecaAberta] = React.useState<PecaDoLook | null>(null);

  const titulo = tituloDoLook(look);
  const data = formatarDataPorExtenso(look.criadoEm);
  const total = look.pecas.length;
  const paginas: Pagina[] = [
    { tipo: 'look' },
    ...look.pecas.map((peca) => ({ tipo: 'peca' as const, peca })),
  ];

  // Foto da peça do maior tamanho que cabe com a legenda. Antes da medição,
  // uma estimativa, para a primeira renderização não piscar vazia.
  const alturaDaPagina = alturaLivre || screenHeight * 0.5;
  const fotoLargura = screenWidth - PAGE_SIDE * 2;
  const fotoAltura = Math.max(
    Math.min(fotoLargura * 1.4, alturaDaPagina - LEGENDA_ALTURA),
    120,
  );

  // Look montado com os mesmos moldes do chat, numa área mais alta e com as
  // peças aumentadas: a disposição é a mesma, só que maior.
  const areaDoLook = {
    largura: screenWidth - LOOK_SIDE * 2,
    altura: Math.min(
      alturaDaPagina,
      (screenWidth - LOOK_SIDE * 2) * LOOK_PROPORCAO_MAXIMA,
    ),
  };
  const colagem = cabeNaColagem(look.pecas);

  // Cards (look com alguma peça com fundo) em duas colunas, do maior tamanho
  // que cabe na página.
  const colunas = total > 1 ? 2 : 1;
  const linhas = Math.max(Math.ceil(total / colunas), 1);
  const cardLargura = (fotoLargura - GRID_GAP * (colunas - 1)) / colunas;
  const cardAltura = Math.min(
    (alturaDaPagina - GRID_GAP * (linhas - 1)) / linhas,
    cardLargura * 1.35,
  );
  const cardTamanho = {
    width: Math.min(cardLargura, cardAltura),
    height: cardAltura,
  };

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const pagina = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setPaginaAtual(Math.max(0, Math.min(pagina, paginas.length - 1)));
  }

  function irParaPagina(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true });
    setPaginaAtual(index);
  }

  function renderLook() {
    return (
      <View
        style={[styles.page, { width: screenWidth, height: alturaDaPagina }]}
        accessibilityLabel="Look completo"
      >
        {colagem ? (
          <LookColagem
            pecas={look.pecas}
            largura={areaDoLook.largura}
            altura={areaDoLook.altura}
            onPressPeca={setPecaAberta}
            escalaDasPecas={ESCALA_DAS_PECAS}
          />
        ) : (
          <View style={[styles.grid, { width: fotoLargura }]}>
            {look.pecas.map((peca) => (
              <ClosetItemCard
                key={peca.id}
                peca={peca}
                style={[cardTamanho, styles.card]}
                onPress={() => setPecaAberta(peca)}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderPeca(peca: PecaDoLook) {
    const { symbol, categoria, cor, papel } = descreverPeca(peca);

    return (
      <View
        style={[styles.page, { width: screenWidth, height: alturaDaPagina }]}
        accessible
        accessibilityLabel={`${papel}: ${categoria}, ${cor}`}
      >
        <View>
          <FotoDaPeca
            uri={peca.imagemUrl}
            style={{ width: fotoLargura, height: fotoAltura }}
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
  }

  return (
    <View style={styles.screen}>
      {/* O vermelho da marca só no cabeçalho; as peças, sem fundo, ficam sobre
          o off-white do app, que não altera como a cor delas é percebida. */}
      <SafeAreaView style={styles.headerFundo} edges={['top']}>
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
      </SafeAreaView>

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* O espaço entre o cabeçalho e as miniaturas é todo das páginas. */}
        <View
          style={styles.pagerArea}
          onLayout={(event) => setAlturaLivre(event.nativeEvent.layout.height)}
        >
          <FlatList
            ref={listRef}
            data={paginas}
            keyExtractor={(pagina) =>
              pagina.tipo === 'look' ? 'look' : pagina.peca.id
            }
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
            renderItem={({ item: pagina }) =>
              pagina.tipo === 'look' ? renderLook() : renderPeca(pagina.peca)
            }
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.counter} accessibilityLiveRegion="polite">
            {paginaAtual === 0
              ? 'Look completo · toque numa peça para ver os detalhes'
              : `Peça ${paginaAtual} de ${total}`}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ver o look completo"
              accessibilityState={{ selected: paginaAtual === 0 }}
              activeOpacity={0.8}
              style={[
                styles.thumb,
                styles.thumbLook,
                paginaAtual === 0 ? styles.thumbActive : styles.thumbInactive,
              ]}
              onPress={() => irParaPagina(0)}
            >
              <Text style={styles.thumbLookText}>Look</Text>
            </TouchableOpacity>

            {look.pecas.map((peca, index) => {
              const { categoria, cor } = descreverPeca(peca);
              const ativa = index + 1 === paginaAtual;

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
                  onPress={() => irParaPagina(index + 1)}
                >
                  <FotoDaPeca
                    uri={peca.imagemMiniUrl}
                    style={styles.thumbPhoto}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <PecaExpandida peca={pecaAberta} onClose={() => setPecaAberta(null)} />
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
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: PAGE_SIDE,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: HEADER_GAP,
  },
  // Branco sobre o cabeçalho vermelho, com a seta na cor do app.
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
  pagerArea: {
    flex: 1,
    marginTop: 16,
  },
  pager: {
    flexGrow: 0,
  },
  // Conteúdo centrado na altura livre: a sobra fica dividida em cima e embaixo.
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: GRID_GAP,
  },
  // Véu escuro leve, como no chat: sem ele, as peças brancas sem fundo
  // sumiriam no off-white.
  card: {
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
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
  // Miniatura do look montado: texto em vez de foto.
  thumbLook: {
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLookText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  // Borda na ativa e as outras esmaecidas: a marcação não depende só da cor.
  thumbActive: {
    borderColor: theme.colors.primary,
  },
  thumbInactive: {
    opacity: 0.6,
  },
  // Véu escuro bem leve: sem ele, a miniatura de peça branca some no off-white.
  thumbPhoto: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
