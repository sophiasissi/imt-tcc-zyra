import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Path,
} from 'react-native-svg';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { listarPecas, Peca, removerPeca } from '../services/pecasApi';
import { listarLooks, LookSalvo, removerLook } from '../services/looksApi';
import { ClosetItemCard } from '../components/ClosetItemCard';
import { GradientPillButton } from '../components/GradientPillButton';
import { LookSalvoItem } from '../components/LookSalvoItem';
import { ZyraPopup } from '../components/ZyraPopup';

import CameraSvg from '../../assets/icons/camera.svg';
import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';
import ClothesHome from '../../assets/images/clothes_home.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const COLLAPSED_PANEL_HEIGHT = 320;
const EXPANDED_PANEL_TOP = 115;

// Tempo que o aviso de "look salvo" fica na tela.
const AVISO_LOOK_SALVO_MS = 3000;
const AVISO_LOOK_SALVO = 'Look salvo na Galeria de Looks';

/** O painel de baixo mostra as peças do armário ou os looks salvos. */
type ModoPainel = 'armario' | 'galeria';

type DialogoExclusao =
  | { tipo: 'confirmar' }
  | { tipo: 'erro'; mensagem: string };

/** "1 peça", "3 peças", "1 look", "2 looks". */
function contarItens(quantidade: number, modo: ModoPainel) {
  if (modo === 'galeria') {
    return `${quantidade} ${quantidade === 1 ? 'look' : 'looks'}`;
  }

  return `${quantidade} ${quantidade === 1 ? 'peça' : 'peças'}`;
}

/** Título do painel durante a seleção: "2 peças selecionadas". */
function tituloDaSelecao(quantidade: number, modo: ModoPainel) {
  if (quantidade === 0) {
    return modo === 'galeria' ? 'Selecione os looks' : 'Selecione as peças';
  }

  const plural = quantidade === 1 ? '' : 's';
  const genero = modo === 'galeria' ? 'o' : 'a';

  return `${contarItens(quantidade, modo)} selecionad${genero}${plural}`;
}

/** Marcador: o símbolo de "salvo" que acompanha a Galeria de Looks. */
function BookmarkIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M6 3h12v18l-6-4.5L6 21V3z"
        stroke={theme.colors.white}
        strokeWidth={2.4}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Cabide: volta da galeria para as peças do armário. */
function HangerIcon() {
  return (
    <Svg width={16} height={14} viewBox="0 0 24 20">
      <Path
        d="M9.5 4.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V9l9.3 6.6c.8.6.4 1.9-.6 1.9H3.3c-1 0-1.4-1.3-.6-1.9L12 9"
        stroke={theme.colors.white}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function HomeScreen({ navigation, route }: Props) {
  const { user, tokens } = useAuth();
  const nome = user?.nome ?? null;
  const accessToken = tokens?.accessToken ?? null;

  const [pecas, setPecas] = React.useState<Peca[]>([]);
  const [isLoadingPecas, setIsLoadingPecas] = React.useState(true);
  const [pecasError, setPecasError] = React.useState<string | null>(null);

  const [modo, setModo] = React.useState<ModoPainel>('armario');
  const [looks, setLooks] = React.useState<LookSalvo[]>([]);
  const [isLoadingLooks, setIsLoadingLooks] = React.useState(true);
  const [looksError, setLooksError] = React.useState<string | null>(null);

  // Modo de seleção, como nas Fotos do iPhone: marca itens para excluir.
  const [isSelecionando, setIsSelecionando] = React.useState(false);
  const [selecionados, setSelecionados] = React.useState<string[]>([]);
  const [dialogoExclusao, setDialogoExclusao] =
    React.useState<DialogoExclusao | null>(null);
  const [isExcluindo, setIsExcluindo] = React.useState(false);

  // Sair da Home (chat, câmera, detalhe do look) encerra a seleção.
  useFocusEffect(
    React.useCallback(
      () => () => {
        setIsSelecionando(false);
        setSelecionados([]);
      },
      [],
    ),
  );

  // Recarrega ao abrir a galeria e sempre que a Home volta ao foco com ela
  // aberta: assim um look salvo agora no chat já aparece na lista.
  useFocusEffect(
    React.useCallback(() => {
      if (!accessToken || modo !== 'galeria') {
        return;
      }

      let ativo = true;

      listarLooks(accessToken)
        .then((lista) => {
          if (ativo) {
            setLooks(lista);
            setLooksError(null);
          }
        })
        .catch((error: unknown) => {
          console.error('[Home] Falha ao carregar a Galeria de Looks:', error);

          if (ativo) {
            setLooksError('Não foi possível carregar seus looks agora.');
          }
        })
        .finally(() => {
          if (ativo) {
            setIsLoadingLooks(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, [accessToken, modo]),
  );

  // Aviso de "look salvo", disparado pelo chat ao voltar para a Home.
  const lookSalvoEm = route.params?.lookSalvoEm;
  const [avisoOpacity] = React.useState(() => new Animated.Value(0));
  // Fora do efeito: limpar o parâmetro roda o efeito de novo, e um cleanup
  // ali cancelaria o timer e deixaria o aviso preso na tela.
  const avisoTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!lookSalvoEm) {
      return;
    }

    if (avisoTimer.current) clearTimeout(avisoTimer.current);

    // Quem usa leitor de tela também fica sabendo, sem precisar achar o aviso.
    AccessibilityInfo.announceForAccessibility(AVISO_LOOK_SALVO);

    Animated.timing(avisoOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    avisoTimer.current = setTimeout(() => {
      avisoTimer.current = null;

      Animated.timing(avisoOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, AVISO_LOOK_SALVO_MS);

    // Limpa o parâmetro: voltar de outra tela não repete o aviso.
    navigation.setParams({ lookSalvoEm: undefined });
  }, [lookSalvoEm, avisoOpacity, navigation]);

  // Recarrega sempre que a Home volta ao foco: é assim que a peça recém
  // cadastrada aparece no armário ao voltar do cadastro.
  useFocusEffect(
    React.useCallback(() => {
      if (!accessToken) {
        return;
      }

      let ativo = true;

      listarPecas(accessToken)
        .then((lista) => {
          if (ativo) {
            setPecas(lista);
            setPecasError(null);
          }
        })
        .catch((error: unknown) => {
          console.error('[Home] Falha ao carregar o armário:', error);

          if (ativo) {
            setPecasError('Não foi possível carregar suas peças agora.');
          }
        })
        .finally(() => {
          if (ativo) {
            setIsLoadingPecas(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, [accessToken]),
  );

  const { height: screenHeight } = useWindowDimensions();

  const expandedPanelHeight = screenHeight - EXPANDED_PANEL_TOP;
  const collapsedTranslateY = expandedPanelHeight - COLLAPSED_PANEL_HEIGHT;

  // useState com função de inicialização em vez de useRef(...).current: cria
  // uma vez só, igual antes, mas sem ler uma ref durante a renderização — o
  // que o React 19 passou a sinalizar (regra react-hooks/refs).
  const [panelTranslateY] = React.useState(
    () => new Animated.Value(collapsedTranslateY),
  );
  // Conteúdo do armário (título e roupas): some quando o chat abre por cima e
  // volta quando ele fecha, para a troca entre as telas não ser um corte seco.
  const [closetContent] = React.useState(() => new Animated.Value(1));
  const currentPanelPosition = React.useRef(collapsedTranslateY);
  const dragStartPosition = React.useRef(collapsedTranslateY);
  const collapsedPosition = React.useRef(collapsedTranslateY);
  const wasDragged = React.useRef(false);
  const expandedState = React.useRef(false);
  const [isClosetExpanded, setIsClosetExpanded] = React.useState(false);

  React.useEffect(() => {
    collapsedPosition.current = collapsedTranslateY;

    if (!expandedState.current) {
      currentPanelPosition.current = collapsedTranslateY;
      panelTranslateY.setValue(collapsedTranslateY);
    }
  }, [collapsedTranslateY, panelTranslateY]);

  React.useEffect(() => {
    const listenerId = panelTranslateY.addListener(({ value }) => {
      currentPanelPosition.current = value;
    });

    return () => panelTranslateY.removeListener(listenerId);
  }, [panelTranslateY]);

  function animateClosetPanel(expanded: boolean) {
    const destination = expanded ? 0 : collapsedPosition.current;

    expandedState.current = expanded;
    setIsClosetExpanded(expanded);

    Animated.spring(panelTranslateY, {
      toValue: destination,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.85,
    }).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = destination;
      }
    });
  }

  // Criado uma única vez, como antes. Os handlers abaixo leem refs, mas só
  // rodam durante o gesto do usuário — nunca durante a renderização. A regra
  // não consegue distinguir os dois casos e acusa falso positivo aqui.
  // eslint-disable-next-line react-hooks/refs
  const [panelPanResponder] = React.useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        wasDragged.current = false;
        panelTranslateY.stopAnimation();
        dragStartPosition.current = currentPanelPosition.current;
      },

      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 4) {
          wasDragged.current = true;
        }

        const nextPosition = dragStartPosition.current + gestureState.dy;
        const limitedPosition = Math.max(
          0,
          Math.min(collapsedPosition.current, nextPosition),
        );

        panelTranslateY.setValue(limitedPosition);
      },

      onPanResponderRelease: (_, gestureState) => {
        if (!wasDragged.current) {
          animateClosetPanel(!expandedState.current);
          return;
        }

        const shouldExpand =
          gestureState.vy < -0.25 ||
          (gestureState.vy <= 0.25 &&
            currentPanelPosition.current < collapsedPosition.current / 2);

        animateClosetPanel(shouldExpand);
      },

      onPanResponderTerminate: () => {
        animateClosetPanel(expandedState.current);
      },
    }),
  );

  function handleColorAdd() {
    console.log('[Home] Usuário acessou área ColorADD.');
  }

  function handleProfile() {
    console.log('[Home] Usuário acessou perfil/configurações.');

    navigation.navigate('Settings');
  }

  function iniciarSelecao() {
    setSelecionados([]);
    setIsSelecionando(true);
  }

  function encerrarSelecao() {
    setIsSelecionando(false);
    setSelecionados([]);
  }

  function alternarSelecao(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id],
    );
  }

  function handleAlternarGaleria() {
    encerrarSelecao();
    setModo((atual) => (atual === 'galeria' ? 'armario' : 'galeria'));
  }

  function handleAbrirLook(look: LookSalvo) {
    navigation.navigate('LookDetalhe', { look });
  }

  // Peças marcadas que estão em looks salvos: esses looks saem junto.
  const looksAfetados = pecas
    .filter((peca) => selecionados.includes(peca.id))
    .reduce((total, peca) => total + (peca.totalLooks ?? 0), 0);

  function mensagemConfirmacao() {
    if (modo === 'galeria') {
      return 'Eles saem da Galeria de Looks. As peças continuam no seu armário.';
    }

    const base = 'As fotos saem do seu armário e não dá para desfazer.';

    return looksAfetados > 0
      ? `${base} Os looks salvos que usam essas peças também saem da Galeria de Looks.`
      : base;
  }

  /**
   * Exclui um por um (o back não tem exclusão em lote) e tira da tela só o
   * que deu certo. Se algum falhar, ele continua marcado para tentar de novo.
   */
  async function handleExcluir() {
    if (!accessToken || isExcluindo || selecionados.length === 0) {
      return;
    }

    setIsExcluindo(true);

    const ids = [...selecionados];
    const remover = modo === 'galeria' ? removerLook : removerPeca;
    const resultados = await Promise.allSettled(
      ids.map((id) => remover(id, accessToken)),
    );

    // 404 conta como excluído: o item já não existe no servidor (excluído
    // em outro aparelho, ou numa tentativa anterior cuja resposta se perdeu).
    // Tratar como falha o deixaria marcado para sempre, sem ter o que apagar.
    const excluidos = ids.filter((_, index) => {
      const resultado = resultados[index];

      return (
        resultado.status === 'fulfilled' ||
        (resultado.reason instanceof ApiError && resultado.reason.isNotFound)
      );
    });
    const falhas = ids.filter((id) => !excluidos.includes(id));

    if (modo === 'galeria') {
      setLooks((atuais) =>
        atuais.filter((look) => !excluidos.includes(look.id)),
      );
    } else {
      setPecas((atuais) =>
        atuais.filter((peca) => !excluidos.includes(peca.id)),
      );
      // O back apagou os looks com essas peças; a galeria acompanha.
      setLooks((atuais) =>
        atuais.filter(
          (look) => !look.pecas.some((peca) => excluidos.includes(peca.id)),
        ),
      );
    }

    setIsExcluindo(false);

    if (falhas.length > 0) {
      console.error('[Home] Falha ao excluir:', resultados);

      setSelecionados(falhas);
      setDialogoExclusao({
        tipo: 'erro',
        mensagem:
          excluidos.length > 0
            ? `Excluímos ${contarItens(excluidos.length, modo)}, mas não foi possível excluir ${contarItens(falhas.length, modo)}. Continuam marcados para você tentar de novo.`
            : 'Não foi possível excluir agora. Verifique sua conexão e tente de novo.',
      });
      return;
    }

    setDialogoExclusao(null);
    encerrarSelecao();
    AccessibilityInfo.announceForAccessibility(
      `${contarItens(excluidos.length, modo)} excluídos`,
    );
  }

  function handleChat() {
    Animated.timing(closetContent, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    navigation.navigate('Chat', {
      nome,
      armarioAberto: expandedState.current,
    });
  }

  // Ao voltar do chat (ou de qualquer tela), o armário reaparece subindo de leve.
  useFocusEffect(
    React.useCallback(() => {
      Animated.timing(closetContent, {
        toValue: 1,
        duration: 260,
        delay: 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [closetContent]),
  );

  function handleCamera() {
    console.log('[Home] Usuário acessou a câmera.');

    navigation.navigate('CameraColorDetection');
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <View style={styles.header}>
        <Text style={styles.logo}>ZYRA</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir informações do ColorADD"
            activeOpacity={0.8}
            onPress={handleColorAdd}
          >
            <View style={styles.colorAddOuter}>
              <Svg width={56} height={56} style={styles.colorAddGlowSvg}>
                <Defs>
                  <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#DE0051" stopOpacity="0.22" />
                    <Stop offset="60%" stopColor="#DE0051" stopOpacity="0.08" />
                    <Stop offset="100%" stopColor="#DE0051" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="28" cy="28" r="28" fill="url(#g)" />
              </Svg>

              <View style={styles.colorAddWrapper}>
                <LogoColorADD width={42} height={42} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.profileShadow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${nome ?? 'usuário'}`}
              activeOpacity={0.8}
              style={styles.profileButton}
              onPress={handleProfile}
            >
              <LinearGradient
                colors={['#DE0051', '#AB003E', '#78002C']}
                locations={[0.3, 0.67, 1]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.profileGradient}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.heroViewport}>
        <View style={styles.hero}>
          <ClothesHome width={301} height={383} />
        </View>
      </View>

      <Animated.View
        style={[
          styles.closetPanel,
          {
            height: expandedPanelHeight,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
      >
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={
            isClosetExpanded
              ? 'Recolher armário digital'
              : 'Expandir armário digital'
          }
          accessibilityHint="Arraste para cima ou para baixo"
          accessibilityActions={[
            { name: 'increment', label: 'Expandir' },
            { name: 'decrement', label: 'Recolher' },
          ]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') {
              animateClosetPanel(true);
            }

            if (event.nativeEvent.actionName === 'decrement') {
              animateClosetPanel(false);
            }
          }}
          style={styles.dragHandle}
          {...panelPanResponder.panHandlers}
        >
          <View style={styles.dragIndicator} />
        </View>

        <Animated.View
          style={[
            styles.closetContent,
            {
              opacity: closetContent,
              transform: [
                {
                  translateY: closetContent.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.closetHeader}>
            <Text style={styles.closetTitle} accessibilityRole="header">
              {isSelecionando
                ? tituloDaSelecao(selecionados.length, modo)
                : modo === 'galeria'
                  ? 'Galeria de Looks'
                  : 'Seu Armário Digital'}
            </Text>

            <View style={styles.closetActions}>
              {/* Durante a seleção, só dá para cancelar: trocar de lista no
                  meio dela confundiria o que está marcado. */}
              {!isSelecionando ? (
                <GradientPillButton
                  title={modo === 'galeria' ? 'Armário' : 'Galeria'}
                  accessibilityLabel={
                    modo === 'galeria'
                      ? 'Voltar para o armário digital'
                      : 'Abrir Galeria de Looks'
                  }
                  icon={modo === 'galeria' ? <HangerIcon /> : <BookmarkIcon />}
                  onPress={handleAlternarGaleria}
                />
              ) : null}

              {/* Lista vazia não tem o que selecionar. */}
              {isSelecionando ||
              (modo === 'galeria' ? looks.length : pecas.length) > 0 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={
                    isSelecionando
                      ? 'Cancelar seleção'
                      : modo === 'galeria'
                        ? 'Selecionar looks para excluir'
                        : 'Selecionar peças para excluir'
                  }
                  activeOpacity={0.84}
                  style={styles.selectButton}
                  onPress={isSelecionando ? encerrarSelecao : iniciarSelecao}
                >
                  <Text style={styles.selectButtonText}>
                    {isSelecionando ? 'Cancelar' : 'Selecionar'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {modo === 'galeria' ? (
            isLoadingLooks && looks.length === 0 ? (
              <ActivityIndicator
                color={theme.colors.white}
                style={styles.closetFeedback}
              />
            ) : looks.length === 0 ? (
              <Text style={[styles.closetEmptyText, styles.closetFeedback]}>
                {looksError ??
                  'Você ainda não salvou nenhum look. Peça um look ao ZYRA e, ao voltar, escolha salvar.'}
              </Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.looksList}
                showsVerticalScrollIndicator={false}
              >
                {looks.map((look) => (
                  <LookSalvoItem
                    key={look.id}
                    look={look}
                    selecionavel={isSelecionando}
                    selecionado={selecionados.includes(look.id)}
                    onPress={() =>
                      isSelecionando
                        ? alternarSelecao(look.id)
                        : handleAbrirLook(look)
                    }
                  />
                ))}
              </ScrollView>
            )
          ) : isLoadingPecas && pecas.length === 0 ? (
            <ActivityIndicator
              color={theme.colors.primary}
              style={styles.closetFeedback}
            />
          ) : pecas.length === 0 ? (
            <Text style={[styles.closetEmptyText, styles.closetFeedback]}>
              {pecasError ??
                'Seu armário ainda está vazio. Toque na câmera, fotografe uma peça e cadastre.'}
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={styles.clothingGrid}
              showsVerticalScrollIndicator={false}
            >
              {pecas.map((peca) => (
                <ClosetItemCard
                  key={peca.id}
                  peca={peca}
                  selecionavel={isSelecionando}
                  selecionado={selecionados.includes(peca.id)}
                  onPress={
                    isSelecionando ? () => alternarSelecao(peca.id) : undefined
                  }
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>

      {/* Sempre montado, só a opacidade muda. Fica fora da árvore de
          acessibilidade porque o aviso já é anunciado ao aparecer — senão o
          leitor de tela acharia um elemento invisível. */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.aviso, { opacity: avisoOpacity }]}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke={theme.colors.white}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>

        <Text style={styles.avisoText}>{AVISO_LOOK_SALVO}</Text>
      </Animated.View>

      {isSelecionando ? (
        // No lugar da caixa do chat, como a barra de ações das Fotos do iPhone.
        <View style={styles.deleteContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              selecionados.length > 0
                ? `Excluir ${contarItens(selecionados.length, modo)}`
                : 'Excluir: nenhum item selecionado'
            }
            accessibilityState={{ disabled: selecionados.length === 0 }}
            activeOpacity={0.85}
            disabled={selecionados.length === 0}
            style={[
              styles.deleteButton,
              selecionados.length === 0 && styles.deleteButtonDisabled,
            ]}
            onPress={() => setDialogoExclusao({ tipo: 'confirmar' })}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"
                stroke={theme.colors.white}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>

            <Text style={styles.deleteButtonText}>
              {selecionados.length > 0
                ? `Excluir ${contarItens(selecionados.length, modo)}`
                : 'Excluir'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View pointerEvents="none" style={styles.chatGlow} />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Fale com o ZYRA"
            activeOpacity={0.9}
            style={styles.chatInput}
            onPress={handleChat}
          >
            <Text style={styles.chatPlaceholder}>Fale com o ZYRA...</Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abrir câmera"
              activeOpacity={0.8}
              style={styles.cameraButton}
              onPress={(event) => {
                event.stopPropagation();
                handleCamera();
              }}
            >
              {/* O SVG tem ~25% de margem em volta do desenho: em 27 px a câmera
              aparece com ~20 px. Mesmo tamanho na Home e no chat, que trocam
              de lugar na transição. */}
              <CameraSvg width={27} height={27} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Um popup só, que troca de conteúdo entre a confirmação e o erro. */}
      <ZyraPopup
        visible={Boolean(dialogoExclusao)}
        variant={dialogoExclusao?.tipo === 'erro' ? 'error' : 'warning'}
        title={
          dialogoExclusao?.tipo === 'erro'
            ? 'Não foi possível excluir'
            : `Excluir ${contarItens(selecionados.length, modo)}?`
        }
        message={
          dialogoExclusao?.tipo === 'erro'
            ? dialogoExclusao.mensagem
            : mensagemConfirmacao()
        }
        buttonText={
          isExcluindo
            ? 'Excluindo...'
            : dialogoExclusao?.tipo === 'erro'
              ? 'Tentar de novo'
              : 'Excluir'
        }
        confirmDisabled={isExcluindo}
        onConfirm={handleExcluir}
        secondaryButtonText="Cancelar"
        onSecondary={() => setDialogoExclusao(null)}
        onClose={() => {
          if (!isExcluindo) setDialogoExclusao(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.title,
    fontSize: 48,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  profileShadow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileGradient: {
    ...StyleSheet.absoluteFill,
  },
  colorAddOuter: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  colorAddGlowSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  colorAddWrapper: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroViewport: {
    flex: 1,
    marginBottom: COLLAPSED_PANEL_HEIGHT + 30,
    overflow: 'hidden',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closetPanel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 26,
    overflow: 'hidden',
  },
  dragHandle: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  dragIndicator: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
  },
  closetContent: {
    flex: 1,
  },
  closetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closetTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 30,
    paddingHorizontal: 12,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
  closetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteContainer: {
    position: 'absolute',
    left: 52,
    right: 52,
    bottom: 30,
    zIndex: 20,
    elevation: 20,
  },
  // Mesmo tamanho e lugar da caixa do chat, que ele substitui na seleção.
  deleteButton: {
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  looksList: {
    gap: 10,
    paddingBottom: 140,
  },
  // Aviso de "look salvo": abaixo do cabeçalho, longe do chat e do painel.
  aviso: {
    position: 'absolute',
    top: 118,
    left: 22,
    right: 22,
    zIndex: 30,
    elevation: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avisoText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  clothingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingBottom: 140,
  },
  closetFeedback: {
    marginTop: 32,
  },
  closetEmptyText: {
    // Cinza claro sobre o painel escuro: o cinza-escuro anterior tinha
    // contraste de ~1,5:1 e mal aparecia.
    color: theme.colors.cinzaClaro,
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  chatContainer: {
    position: 'absolute',
    left: 52,
    right: 52,
    bottom: 30,
    zIndex: 20,
    elevation: 20,
  },
  chatGlow: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -3,
    right: -3,
    borderRadius: 24,
    backgroundColor: '#DE0051',
    shadowColor: '#DE0051',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },
  chatInput: {
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    paddingLeft: 18,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  chatPlaceholder: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  cameraButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
