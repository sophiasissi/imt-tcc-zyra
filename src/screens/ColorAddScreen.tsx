import React, { ReactNode } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ColorAddLoading } from '../components/ColorAddLoading';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import {
  getColorAddSymbol,
  logoColorAddVertical,
  sinteseColorAdd,
} from '../utils/colorAddSymbols';

type Props = NativeStackScreenProps<RootStackParamList, 'ColorAdd'>;

const SITE_COLORADD = 'https://www.coloradd.net/pt';

/**
 * Cor da barra embaixo de cada símbolo, tirada da tabela oficial do ColorADD
 * (assets/coloradd/sobre_nos/04A3 Codigo ColorADD B.png). A barra é a
 * referência de orientação que o manual de normas gráficas pede (item 2.6).
 */
type Simbolo = {
  codigo: string;
  nome: string;
  barra: string;
};

const CORES: Simbolo[] = [
  { codigo: 'AZUL', nome: 'Azul', barra: '#024299' },
  { codigo: 'VERDE', nome: 'Verde', barra: '#01A87C' },
  { codigo: 'AMARELO', nome: 'Amarelo', barra: '#FDDE05' },
  { codigo: 'LARANJA', nome: 'Laranja', barra: '#FF5913' },
  { codigo: 'VERMELHO', nome: 'Vermelho', barra: '#FD062F' },
  { codigo: 'ROXO', nome: 'Roxo', barra: '#9A017F' },
  { codigo: 'CASTANHO', nome: 'Castanho', barra: '#B96003' },
];

const NEUTROS: Simbolo[] = [
  { codigo: 'BRANCO', nome: 'Branco', barra: '#FFFFFF' },
  { codigo: 'PRETO', nome: 'Preto', barra: '#000000' },
  { codigo: 'CINZA_CLARO', nome: 'Cinza claro', barra: '#B0B1B6' },
  { codigo: 'CINZA_ESCURO', nome: 'Cinza escuro', barra: '#45454D' },
];

const METALIZADOS: Simbolo[] = [
  { codigo: 'DOURADO', nome: 'Dourado', barra: '#B08842' },
  { codigo: 'PRATEADO', nome: 'Prateado', barra: '#7B7A76' },
];

const CLAROS: Simbolo[] = [
  { codigo: 'AZUL_CLARO', nome: 'Azul claro', barra: '#039CED' },
  { codigo: 'VERDE_CLARO', nome: 'Verde claro', barra: '#7CC64D' },
  { codigo: 'AMARELO_CLARO', nome: 'Amarelo claro', barra: '#FEF97A' },
  { codigo: 'LARANJA_CLARO', nome: 'Laranja claro', barra: '#FBCA69' },
  { codigo: 'VERMELHO_CLARO', nome: 'Vermelho claro', barra: '#FFB8BC' },
  { codigo: 'ROXO_CLARO', nome: 'Roxo claro', barra: '#EF6EB0' },
  { codigo: 'CASTANHO_CLARO', nome: 'Castanho claro', barra: '#FFC675' },
];

const ESCUROS: Simbolo[] = [
  { codigo: 'AZUL_ESCURO', nome: 'Azul escuro', barra: '#0A013B' },
  { codigo: 'VERDE_ESCURO', nome: 'Verde escuro', barra: '#005311' },
  { codigo: 'AMARELO_ESCURO', nome: 'Amarelo escuro', barra: '#FDB800' },
  { codigo: 'LARANJA_ESCURO', nome: 'Laranja escuro', barra: '#F36609' },
  { codigo: 'VERMELHO_ESCURO', nome: 'Vermelho escuro', barra: '#910009' },
  { codigo: 'ROXO_ESCURO', nome: 'Roxo escuro', barra: '#50003E' },
  { codigo: 'CASTANHO_ESCURO', nome: 'Castanho escuro', barra: '#5E2403' },
];

function simbolo(codigo: string): Simbolo {
  const todos = [...CORES, ...NEUTROS, ...METALIZADOS, ...CLAROS, ...ESCUROS];
  const encontrado = todos.find((item) => item.codigo === codigo);

  if (!encontrado) {
    throw new Error(`Símbolo ColorADD desconhecido: ${codigo}`);
  }

  return encontrado;
}

/** As cinco bases do código: as três primárias, o branco e o preto. */
const BASE = ['AZUL', 'AMARELO', 'VERMELHO', 'BRANCO', 'PRETO'].map(simbolo);

/** Somas do manual (item 1.2, Teoria da Adição de Cores). */
const SOMAS = [
  ['AMARELO', 'AZUL', 'VERDE'],
  ['VERMELHO', 'AZUL', 'ROXO'],
  ['VERMELHO', 'AMARELO', 'LARANJA'],
  ['VERMELHO', 'VERDE', 'CASTANHO'],
].map((soma) => soma.map(simbolo));

const TONS = ['AZUL_CLARO', 'AZUL', 'AZUL_ESCURO'].map(simbolo);

/**
 * Quantas imagens a página desenha: o logo, a ilustração da soma e cada
 * símbolo. O loading só sai quando cada uma tiver terminado de carregar (com
 * sucesso ou erro).
 */
const TOTAL_IMAGENS =
  2 +
  BASE.length +
  SOMAS.length * 3 +
  TONS.length +
  [CORES, NEUTROS, METALIZADOS, CLAROS, ESCUROS].reduce(
    (total, grupo) => total + grupo.length,
    0,
  );

/** Com cache tudo carrega na hora: o loading fica um mínimo para não piscar. */
const LOADING_MINIMO_MS = 900;

/** Altura da barra de status dos iPhones com notch: o X nunca fica acima disso. */
const MARGEM_TOPO_MINIMA = 47;
/**
 * Rede de segurança: se alguma imagem nunca responder, a página abre mesmo
 * assim. Fica longe do tempo normal (no Expo Go cada imagem vem do Metro pela
 * rede) para não soltar a página com símbolos faltando.
 */
const LOADING_MAXIMO_MS = 15000;

/**
 * Cada imagem chama isto com o próprio id ao terminar de carregar. Conta
 * imagens, e não avisos: na arquitetura nova do React Native, uma imagem que
 * muda de tamanho no layout carrega de novo e avisa duas vezes, e a contagem
 * de avisos chegava ao total com imagens ainda carregando.
 */
const AoCarregarImagem = React.createContext<(id: string) => void>(() => {});

/**
 * Explica o código ColorADD para quem ainda não o conhece. Abre por cima da
 * Home, com a tela escurecida, como a seção "Sobre" do app do ColorADD.
 *
 * Segue o manual de normas gráficas do ColorADD
 * (assets/coloradd/00 ColorADD_Manual Normas Graficas_1225.pdf): símbolos
 * pretos sobre fundo claro (2.2), sempre com a barra de cor embaixo (2.6) e
 * sem girar ou distorcer os desenhos (2.4 e 2.5).
 */
export function ColorAddScreen({ navigation }: Props) {
  // Margens da barra de status e da barra inferior. Pelo hook, e não pelo
  // SafeAreaView: aberta como transparentModal (vinda das Configurações), o
  // SafeAreaView chegou a calcular margem zero, e o X ficou embaixo da barra
  // de status, impossível de tocar. O mínimo cobre um zero que ainda escape.
  const insets = useSafeAreaInsets();
  const margemTopo = Math.max(insets.top, MARGEM_TOPO_MINIMA);
  const margemBaixo = Math.max(insets.bottom, 12);

  const [pronto, setPronto] = React.useState(false);
  const [loadingVisivel, setLoadingVisivel] = React.useState(true);
  const [revelar] = React.useState(() => new Animated.Value(0));
  const imagensCarregadas = React.useRef(new Set<string>());
  const [imagensProntas, setImagensProntas] = React.useState(false);
  const [tempoMinimoPassou, setTempoMinimoPassou] = React.useState(false);

  const aoCarregarImagem = React.useCallback((id: string) => {
    imagensCarregadas.current.add(id);

    if (imagensCarregadas.current.size >= TOTAL_IMAGENS) {
      setImagensProntas(true);
    }
  }, []);

  React.useEffect(() => {
    const minimo = setTimeout(
      () => setTempoMinimoPassou(true),
      LOADING_MINIMO_MS,
    );
    const maximo = setTimeout(() => {
      console.warn(
        `[ColorADD] Loading liberado pelo tempo máximo: ${imagensCarregadas.current.size} de ${TOTAL_IMAGENS} imagens carregadas.`,
      );
      setImagensProntas(true);
    }, LOADING_MAXIMO_MS);

    return () => {
      clearTimeout(minimo);
      clearTimeout(maximo);
    };
  }, []);

  if (imagensProntas && tempoMinimoPassou && !pronto) {
    setPronto(true);
  }

  React.useEffect(() => {
    if (!pronto) return;

    Animated.timing(revelar, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setLoadingVisivel(false));
  }, [pronto, revelar]);

  async function abrirSite() {
    try {
      await Linking.openURL(SITE_COLORADD);
    } catch (error) {
      console.error('[ColorADD] Falha ao abrir o site:', error);
    }
  }

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" />

      <View
        style={[
          styles.safeArea,
          { paddingTop: margemTopo, paddingBottom: margemBaixo },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            activeOpacity={0.8}
            hitSlop={10}
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M6 6l12 12M18 6L6 18"
                stroke={theme.colors.white}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        <AoCarregarImagem.Provider value={aoCarregarImagem}>
          {/* A página fica montada por baixo do loading, invisível, para as
            imagens já irem carregando. */}
          <Animated.View
            style={[styles.pagina, { opacity: revelar }]}
            accessibilityElementsHidden={!pronto}
            importantForAccessibility={pronto ? 'auto' : 'no-hide-descendants'}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={logoColorAddVertical}
                fadeDuration={0}
                onLoadEnd={() => aoCarregarImagem('logo')}
                style={styles.logo}
                accessible
                accessibilityRole="image"
                accessibilityLabel="Logo ColorADD: A Cor é para Todos"
              />

              <Text style={styles.title} accessibilityRole="header">
                O alfabeto das cores
              </Text>

              <Text style={styles.paragraph}>
                O ColorADD é um código que identifica as cores por símbolos. Foi
                criado pelo designer português Miguel Neiva e é uma linguagem
                universal, inclusiva e não discriminatória: ajuda quem é
                daltônico sem deixar ninguém de fora.
              </Text>

              <Text style={styles.paragraph}>
                Segundo o ColorADD, cerca de 350 milhões de pessoas no mundo são
                daltônicas, de 8% a 12% dos homens.
              </Text>

              <Secao titulo="Três cores, três símbolos">
                <Text style={styles.paragraph}>
                  Tudo começa pelas três cores primárias: azul, amarelo e
                  vermelho. Cada uma tem um símbolo simples. O branco e o preto
                  completam a base.
                </Text>

                <Cartao>
                  <View style={styles.row}>
                    {BASE.map((item) => (
                      <SimboloComBarra key={item.codigo} item={item} />
                    ))}
                  </View>
                </Cartao>
              </Secao>

              <Secao titulo="Somar símbolos é somar cores">
                <Text style={styles.paragraph}>
                  Como na mistura de tintas, juntar dois símbolos forma uma nova
                  cor. Quem sabe as primárias consegue ler a paleta inteira.
                </Text>

                <Image
                  source={sinteseColorAdd}
                  fadeDuration={0}
                  onLoadEnd={() => aoCarregarImagem('sintese')}
                  style={styles.sintese}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel="As cores primárias somadas aos símbolos formam o logo do ColorADD, com o símbolo de cada cor dentro dela"
                />

                <Cartao>
                  {SOMAS.map(([a, b, resultado]) => (
                    <View
                      key={resultado.codigo}
                      style={styles.soma}
                      accessible
                      accessibilityLabel={`${a.nome} mais ${b.nome} é igual a ${resultado.nome}`}
                    >
                      <SimboloComBarra item={a} />
                      <Text style={styles.operador}>+</Text>
                      <SimboloComBarra item={b} />
                      <Text style={styles.operador}>=</Text>
                      <SimboloComBarra item={resultado} />
                    </View>
                  ))}
                </Cartao>
              </Secao>

              <Secao titulo="Claro e escuro">
                <Text style={styles.paragraph}>
                  O branco e o preto indicam o tom. O símbolo dentro do quadrado
                  vazado (o branco) é a versão clara da cor. Dentro do quadrado
                  cheio (o preto), é a versão escura.
                </Text>

                <Cartao>
                  <View style={styles.row}>
                    {TONS.map((item) => (
                      <SimboloComBarra key={item.codigo} item={item} />
                    ))}
                  </View>
                </Cartao>

                <Text style={styles.paragraph}>
                  Os cinzas misturam os dois: o cinza claro é o branco com um
                  pouco de preto, e o cinza escuro é o preto com um pouco de
                  branco. O dourado e o prateado, tons metalizados, ganham uma
                  borda dupla.
                </Text>
              </Secao>

              <Secao titulo="Todos os símbolos">
                <Cartao>
                  <Grupo titulo="Cores" itens={CORES} />
                  <Grupo titulo="Branco, preto e cinzas" itens={NEUTROS} />
                  <Grupo titulo="Tons metalizados" itens={METALIZADOS} />
                  <Grupo titulo="Tons claros" itens={CLAROS} />
                  <Grupo titulo="Tons escuros" itens={ESCUROS} ultimo />
                </Cartao>
              </Secao>

              <Secao titulo="O ColorADD no ZYRA">
                <Text style={styles.paragraph}>
                  Na câmera, no armário e nos looks, toda cor aparece com o nome
                  escrito e o símbolo ColorADD ao lado. Com o tempo, você
                  reconhece a cor só de olhar o símbolo.
                </Text>
              </Secao>

              <Text style={styles.slogan}>A COR É PARA TODOS!</Text>

              <TouchableOpacity
                accessibilityRole="link"
                accessibilityLabel="Saiba mais no site do ColorADD"
                activeOpacity={0.8}
                onPress={abrirSite}
              >
                <Text style={styles.linkText}>
                  Saiba mais em{' '}
                  <Text style={styles.linkUnderline}>www.coloradd.net</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.credit}>
                ColorADD © Miguel Neiva. Usado no ZYRA com autorização do autor.
              </Text>
            </ScrollView>
          </Animated.View>
        </AoCarregarImagem.Provider>
      </View>

      {loadingVisivel ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.loading,
            {
              opacity: revelar.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  scale: revelar.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15],
                  }),
                },
              ],
            },
          ]}
        >
          <ColorAddLoading />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

/** Fundo claro: o manual pede símbolos pretos sobre fundo claro (2.2). */
function Cartao({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Grupo({
  titulo,
  itens,
  ultimo = false,
}: {
  titulo: string;
  itens: Simbolo[];
  ultimo?: boolean;
}) {
  return (
    <View style={!ultimo && styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {titulo}
      </Text>

      <View style={styles.grid}>
        {itens.map((item) => (
          <View key={item.codigo} style={styles.gridCell}>
            <SimboloComBarra item={item} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SimboloComBarra({ item }: { item: Simbolo }) {
  const aoCarregar = React.useContext(AoCarregarImagem);
  // Id desta instância: o mesmo símbolo aparece em mais de uma seção.
  const id = React.useId();
  const imagem: ImageSourcePropType | undefined = getColorAddSymbol(
    item.codigo,
  )?.image;

  return (
    <View
      style={styles.symbolItem}
      accessible
      accessibilityLabel={`Símbolo do ${item.nome.toLowerCase()}`}
    >
      {imagem ? (
        <Image
          source={imagem}
          fadeDuration={0}
          onLoadEnd={() => aoCarregar(id)}
          onError={({ nativeEvent }) =>
            console.error(
              `[ColorADD] Símbolo ${item.codigo} não carregou:`,
              nativeEvent.error,
            )
          }
          style={styles.symbolImage}
        />
      ) : null}

      <View
        style={[
          styles.bar,
          { backgroundColor: item.barra },
          item.codigo === 'BRANCO' && styles.barBranco,
        ]}
      />

      <Text style={styles.symbolLabel}>{item.nome}</Text>
    </View>
  );
}

const CARD_BACKGROUND = '#F2F1EE';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,12,12,0.93)',
  },
  safeArea: {
    flex: 1,
  },
  pagina: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // 44 px: o mínimo de área de toque recomendado pela Apple.
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logo: {
    width: 150,
    height: 146,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  paragraph: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    backgroundColor: CARD_BACKGROUND,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sintese: {
    width: '100%',
    height: undefined,
    aspectRatio: 3349 / 1008,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  soma: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginVertical: 6,
  },
  operador: {
    color: '#8A8A8A',
    fontFamily: theme.fonts.medium,
    fontSize: 22,
    marginTop: 8,
    marginHorizontal: 2,
  },
  group: {
    marginBottom: 18,
  },
  groupTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  gridCell: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 10,
  },
  symbolItem: {
    width: 58,
    alignItems: 'center',
  },
  // Os PNGs já têm a margem de segurança do manual (2.3) em volta do desenho.
  symbolImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  bar: {
    width: 40,
    height: 7,
    marginTop: 6,
  },
  barBranco: {
    borderWidth: 1,
    borderColor: '#9A9A9A',
  },
  symbolLabel: {
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  slogan: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 18,
  },
  linkText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  linkUnderline: {
    fontFamily: theme.fonts.semiBold,
    textDecorationLine: 'underline',
  },
  credit: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});
