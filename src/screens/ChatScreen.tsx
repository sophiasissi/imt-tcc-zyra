/* eslint-disable react-hooks/refs, react-hooks/immutability --
 * Esta tela é toda feita de animações (Animated) e gestos (PanResponder) que
 * são criados uma vez só e leem refs dentro dos callbacks de gesto e de
 * animação, nunca no render. As regras do React Compiler não conseguem ver
 * essa diferença e acusam o padrão inteiro da tela, que já existia antes.
 */
import React from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { ClosetItemCard } from '../components/ClosetItemCard';
import { ZyraPopup } from '../components/ZyraPopup';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ApiError } from '../services/api';
import {
  MensagemHistorico,
  PecaDoLook,
  salvarLook,
  sugerirLook,
} from '../services/looksApi';
import { Ocasiao } from '../services/pecasApi';
import { theme } from '../styles/theme';
import CameraSvg from '../../assets/icons/camera.svg';
import ZyraAvatar from '../../assets/images/zyrabola.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  author: 'user' | 'zyra';
  text: string;
};

const COLLAPSED_PANEL_HEIGHT = 320;

// Painel do chat: duração fixa e desaceleração suave. A mola anterior parecia
// travar no começo e disparar no fim.
const PANEL_ANIMATION_MS = 260;
const PANEL_EASING = Easing.out(Easing.cubic);

// Curva aproximada do teclado do iOS, para o campo de texto subir junto com ele.
const KEYBOARD_EASING = Easing.bezier(0.38, 0.7, 0.125, 1);

// Margens laterais da caixa de texto: na Home ela é mais estreita; no chat,
// alarga com a mesma animação do painel (e volta ao sair).
const HOME_INPUT_INSET = 52;
const CHAT_INPUT_INSET = 24;

// Quantas peças dos últimos looks o back evita repetir.
const PECAS_RECENTES = 12;

// Área das fotos do look: abaixo do cabeçalho e acima do chat recolhido.
const HEADER_HEIGHT = 104;
// Barra do look (voltar + título): afastada do logo da Home e das fotos.
const LOOK_HEADER_TOP = 14;
const BACK_BUTTON_SIZE = 36;
const LOOK_AREA_TOP = HEADER_HEIGHT + LOOK_HEADER_TOP + BACK_BUTTON_SIZE + 16;
const LOOK_AREA_SIDE = 16;
const LOOK_GRID_GAP = 10;

// Altura da barra de arraste e distância do campo de texto até o fim da tela.
const DRAG_HANDLE_HEIGHT = 64;
const INPUT_BOTTOM_GAP = 54;
const EXPANDED_PANEL_TOP = 115;

// Quantas mensagens anteriores vão junto, para o back entender respostas curtas.
const MENSAGENS_DE_CONTEXTO = 6;

// O back aceita nomes de look com até 60 caracteres.
const TITULO_MAX = 60;

/**
 * Título do look na Galeria: primeira letra maiúscula e cortado no limite.
 * Serve também para o título provisório (o próprio pedido da pessoa), usado
 * enquanto o back não manda o `titulo` gerado pela IA.
 */
function formatarTitulo(texto: string) {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  const cortado =
    limpo.length > TITULO_MAX
      ? `${limpo.slice(0, TITULO_MAX - 1).trimEnd()}…`
      : limpo;

  return cortado.charAt(0).toUpperCase() + cortado.slice(1);
}

type DialogoSalvar =
  | { tipo: 'pergunta' }
  /**
   * podeTentarDeNovo: false quando repetir não adianta (404: uma peça do look
   * foi excluída enquanto o chat estava aberto). Aí só resta sair.
   */
  | { tipo: 'erro'; mensagem: string; podeTentarDeNovo: boolean };

const ERRO_PADRAO =
  'Não consegui montar o look agora. Tente de novo em instantes.';

export function ChatScreen({ navigation, route }: Props) {
  // Armário aberto na Home: o painel já está no topo. O chat nasce ali mesmo e
  // só troca o conteúdo, sem a barra branca subir ou descer.
  const startsExpanded = route.params?.armarioAberto ?? false;

  // Mantém a altura original da tela para o painel não mudar de posição
  // quando o teclado aparecer. Apenas o input sobe com o teclado.
  const screenHeight = React.useRef(Dimensions.get('window').height).current;
  const screenWidth = React.useRef(Dimensions.get('window').width).current;
  const expandedPanelHeight = screenHeight - EXPANDED_PANEL_TOP;
  const collapsedTranslateY = expandedPanelHeight - COLLAPSED_PANEL_HEIGHT;

  const panelTranslateY = React.useRef(
    new Animated.Value(startsExpanded ? 0 : collapsedTranslateY),
  ).current;
  const inputBottom = React.useRef(new Animated.Value(30)).current;
  const inputInset = React.useRef(new Animated.Value(HOME_INPUT_INSET)).current;
  const conversationOpacity = React.useRef(new Animated.Value(0)).current;
  const resultOpacity = React.useRef(new Animated.Value(0)).current;

  const homePanelPosition = startsExpanded ? 0 : collapsedTranslateY;
  const currentPanelPosition = React.useRef(homePanelPosition);
  const dragStartPosition = React.useRef(homePanelPosition);
  const wasDragged = React.useRef(false);
  const exitGestureTriggered = React.useRef(false);
  const expandedState = React.useRef(false);
  // Lido dentro do PanResponder, que é criado uma vez só e não vê o estado novo.
  const isLookReadyRef = React.useRef(false);
  const messagesScrollRef = React.useRef<ScrollView>(null);
  const inputRef = React.useRef<TextInput>(null);
  const recentPecaIds = React.useRef<string[]>([]);
  const messagesScrollY = React.useRef(0);
  const messagesViewportHeight = React.useRef(0);
  const messagesContentHeight = React.useRef(0);
  const isKeyboardVisible = React.useRef(false);
  const isClosing = React.useRef(false);
  const isMounted = React.useRef(true);
  // Título e ocasião do look na tela, guardados para o momento de salvar.
  const lookTitulo = React.useRef<string | null>(null);
  const lookOcasiao = React.useRef<Ocasiao | null>(null);

  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const [inputText, setInputText] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isLookReady, setIsLookReady] = React.useState(false);
  const [lookPecas, setLookPecas] = React.useState<PecaDoLook[]>([]);
  const [dialogoSalvar, setDialogoSalvar] =
    React.useState<DialogoSalvar | null>(null);
  const [isSalvando, setIsSalvando] = React.useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = React.useState(true);
  // O campo de texto cresce com o texto; a lista de mensagens abre espaço para ele.
  const [inputHeight, setInputHeight] = React.useState(56);
  // Com o teclado aberto, a conversa ganha esse espaço a mais no fim, para
  // as últimas mensagens subirem junto com a caixa de texto.
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  // A conversa só rola quando não cabe na tela. Rolagem ligada à toa faz o
  // iPhone tomar o gesto para si, e o painel não recolhe nem abre.
  const [isConversationScrollable, setIsConversationScrollable] =
    React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'initial-question',
      author: 'zyra',
      text: 'Qual a ocasião para hoje?',
    },
  ]);

  React.useEffect(() => {
    const listenerId = panelTranslateY.addListener(({ value }) => {
      currentPanelPosition.current = value;
    });

    return () => {
      panelTranslateY.removeListener(listenerId);
    };
  }, [panelTranslateY]);

  React.useEffect(() => {
    function moveInputAboveKeyboard(event: KeyboardEvent) {
      isKeyboardVisible.current = true;
      setKeyboardHeight(event.endCoordinates.height);
      Animated.timing(inputBottom, {
        toValue: event.endCoordinates.height + 16,
        duration: event.duration || 250,
        easing: KEYBOARD_EASING,
        useNativeDriver: false,
      }).start();
    }

    function resetInputPosition(event?: KeyboardEvent) {
      isKeyboardVisible.current = false;
      setKeyboardHeight(0);
      Animated.timing(inputBottom, {
        toValue: 30,
        duration: event?.duration || 250,
        easing: KEYBOARD_EASING,
        useNativeDriver: false,
      }).start();
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(
      showEvent,
      moveInputAboveKeyboard,
    );
    const keyboardHideListener = Keyboard.addListener(
      hideEvent,
      resetInputPosition,
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [inputBottom]);

  React.useEffect(() => {
    isMounted.current = true;

    const frameId = requestAnimationFrame(() => {
      openChatPanel();

      // Quem tocou na caixa de texto da Home quer escrever: o teclado já abre
      // junto com o chat, sem precisar tocar de novo.
      inputRef.current?.focus();

      Animated.timing(inputInset, {
        toValue: CHAT_INPUT_INSET,
        duration: PANEL_ANIMATION_MS,
        easing: PANEL_EASING,
        useNativeDriver: false,
      }).start();

      Animated.timing(conversationOpacity, {
        toValue: 1,
        duration: 210,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      cancelAnimationFrame(frameId);
      panelTranslateY.stopAnimation();
      inputBottom.stopAnimation();

      isMounted.current = false;
    };
    // A animação inicial só deve executar quando a tela abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const id = setTimeout(
      () => messagesScrollRef.current?.scrollToEnd({ animated: false }),
      50,
    );
    return () => clearTimeout(id);
  }, [isPanelExpanded]);

  function openChatPanel() {
    expandedState.current = true;
    setIsPanelExpanded(true);

    Animated.timing(panelTranslateY, {
      toValue: 0,
      duration: PANEL_ANIMATION_MS,
      easing: PANEL_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = 0;
      }
    });
  }

  function collapseChatPanel() {
    expandedState.current = false;
    Keyboard.dismiss();

    Animated.timing(panelTranslateY, {
      toValue: collapsedTranslateY,
      duration: PANEL_ANIMATION_MS,
      easing: PANEL_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = collapsedTranslateY;
        setIsPanelExpanded(false);
      }
    });
  }

  /**
   * Com um look na tela, a barra do chat só abre e fecha a conversa: sair e
   * apagar o look fica só com a seta de voltar. Antes do primeiro look, o
   * gesto continua voltando para a Home, como antes.
   */
  function toggleChatPanel() {
    if (expandedState.current) {
      collapseChatPanel();
    } else {
      openChatPanel();
    }
  }

  function showLookWithCollapsedChat() {
    isLookReadyRef.current = true;
    setIsLookReady(true);
    setIsPanelExpanded(false);
    setIsGenerating(false);
    expandedState.current = false;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(panelTranslateY, {
        toValue: collapsedTranslateY,
        duration: PANEL_ANIMATION_MS,
        easing: PANEL_EASING,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = collapsedTranslateY;
      }
    });
  }

  /**
   * Seta de voltar (e botão voltar do Android). Com um look na tela, pergunta
   * antes se a pessoa quer guardá-lo na Galeria de Looks; sem look, só sai.
   */
  function handleVoltar() {
    if (isClosing.current) {
      return;
    }

    if (isLookReadyRef.current && lookPecas.length > 0) {
      Keyboard.dismiss();
      setDialogoSalvar({ tipo: 'pergunta' });
      return;
    }

    returnToHome();
  }

  async function handleSalvarLook() {
    if (!accessToken || isSalvando) {
      return;
    }

    setIsSalvando(true);

    try {
      await salvarLook(
        {
          pecaIds: lookPecas.map((peca) => peca.id),
          nome: lookTitulo.current ?? undefined,
          ocasiao: lookOcasiao.current ?? undefined,
        },
        accessToken,
      );

      if (!isMounted.current) {
        return;
      }

      setDialogoSalvar(null);
      returnToHome({ lookSalvo: true });
    } catch (error) {
      console.error('[Chat] Falha ao salvar o look:', error);

      if (isMounted.current) {
        // Sem sair da tela: a pessoa decide entre tentar de novo e sair sem
        // salvar, em vez de perder o look sem perceber.
        const pecaSumiu = error instanceof ApiError && error.isNotFound;

        setDialogoSalvar({
          tipo: 'erro',
          mensagem:
            error instanceof ApiError
              ? error.message
              : 'Não foi possível salvar o look agora.',
          podeTentarDeNovo: !pecaSumiu,
        });
      }
    } finally {
      if (isMounted.current) {
        setIsSalvando(false);
      }
    }
  }

  function handleNaoSalvar() {
    setDialogoSalvar(null);
    returnToHome();
  }

  // Lida pelo BackHandler, registrado uma vez só: aponta sempre para a versão
  // atual, que enxerga as peças do look na tela.
  const handleVoltarRef = React.useRef(handleVoltar);
  handleVoltarRef.current = handleVoltar;

  React.useEffect(() => {
    // Sem isto, o voltar do Android fechava o chat direto, sem animação e
    // sem oferecer salvar o look.
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Com a câmera aberta por cima do chat, o voltar é dela.
        if (!navigation.isFocused()) {
          return false;
        }

        handleVoltarRef.current();
        return true;
      },
    );

    return () => subscription.remove();
  }, [navigation]);

  function returnToHome({ lookSalvo = false } = {}) {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    expandedState.current = false;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(inputInset, {
        toValue: HOME_INPUT_INSET,
        duration: PANEL_ANIMATION_MS,
        easing: PANEL_EASING,
        useNativeDriver: false,
      }),
      Animated.timing(panelTranslateY, {
        toValue: homePanelPosition,
        duration: PANEL_ANIMATION_MS,
        easing: PANEL_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(conversationOpacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(resultOpacity, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        if (lookSalvo) {
          // A Home mostra o aviso de "look salvo" ao receber este parâmetro.
          navigation.popTo('Home', { lookSalvoEm: Date.now() });
        } else {
          navigation.goBack();
        }
        return;
      }

      isClosing.current = false;
    });
  }

  // A lista rola até o fim sozinha; guarda a posição e se a conversa cabe na
  // área visível (que muda quando o painel abre ou recolhe). O onScroll nem
  // sempre dispara no scrollToEnd, então a posição é calculada aqui.
  function atualizarRolagemDaConversa() {
    const sobra =
      messagesContentHeight.current - messagesViewportHeight.current;
    messagesScrollY.current = Math.max(sobra, 0);
    setIsConversationScrollable(sobra > 1);
  }

  function podeAbrirArrastando() {
    const fimDaLista =
      messagesContentHeight.current - messagesViewportHeight.current;
    return (
      isLookReadyRef.current &&
      !expandedState.current &&
      messagesScrollY.current >= fimDaLista - 1
    );
  }

  // Chamada só durante o gesto: lê o estado atual do painel e da rolagem.
  function podeRecolherArrastando() {
    return expandedState.current && messagesScrollY.current <= 0;
  }

  // Mesmo comportamento para a barra de arraste e para o resto do painel.
  const panelGestures: Parameters<typeof PanResponder.create>[0] = {
    onPanResponderTerminationRequest: () => false,

    onPanResponderGrant: () => {
      wasDragged.current = false;
      exitGestureTriggered.current = false;
      panelTranslateY.stopAnimation();
      dragStartPosition.current = currentPanelPosition.current;
    },

    onPanResponderMove: (_, gestureState) => {
      if (isClosing.current || exitGestureTriggered.current) {
        return;
      }

      if (Math.abs(gestureState.dy) > 4) {
        wasDragged.current = true;
      }

      // Fecha o teclado assim que o gesto para baixo começa: se esperasse o
      // dedo soltar, o painel já teria descido e a caixa de texto ficava para trás.
      if (gestureState.dy > 12 && isKeyboardVisible.current) {
        Keyboard.dismiss();
      }

      const nextPosition = dragStartPosition.current + gestureState.dy;
      const limitedPosition = Math.max(
        0,
        Math.min(collapsedTranslateY, nextPosition),
      );

      // Antes do primeiro look, com o armário aberto na Home, o painel fica
      // parado: o gesto só fecha o chat e o conteúdo troca de volta.
      if (!(startsExpanded && !isLookReadyRef.current)) {
        panelTranslateY.setValue(limitedPosition);
      }

      // Sem look na tela, um gesto claro para baixo já volta para a Home.
      if (!isLookReadyRef.current && gestureState.dy > 18) {
        exitGestureTriggered.current = true;
        returnToHome();
      }
    },

    onPanResponderRelease: (_, gestureState) => {
      if (exitGestureTriggered.current || isClosing.current) {
        return;
      }

      const puxouParaBaixo = gestureState.dy > 0 || gestureState.vy > 0.25;

      if (isLookReadyRef.current) {
        if (!wasDragged.current) {
          toggleChatPanel();
        } else if (puxouParaBaixo) {
          collapseChatPanel();
        } else {
          openChatPanel();
        }
        return;
      }

      if (!wasDragged.current || puxouParaBaixo) {
        returnToHome();
        return;
      }

      openChatPanel();
    },

    onPanResponderTerminate: () => {
      if (isClosing.current) {
        return;
      }
      // Volta para onde estava: com look na tela, o painel pode estar recolhido.
      if (isLookReadyRef.current && !expandedState.current) {
        collapseChatPanel();
      } else {
        openChatPanel();
      }
    },
  };

  // Barra de arraste: qualquer toque ou arraste vale.
  const panelPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2,
      ...panelGestures,
    }),
  ).current;

  // Resto do painel (área das mensagens): só assume o gesto quando ele é
  // claramente vertical e não serve para rolar a conversa — puxar para baixo
  // com a conversa no topo, ou puxar para cima com o chat recolhido.
  const panelBodyPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const vertical =
          Math.abs(gestureState.dy) > 10 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.5;

        if (!vertical) {
          return false;
        }

        // Puxar para baixo recolhe o chat só se ele estiver aberto e a conversa
        // no topo; recolhido, o gesto rola o histórico.
        if (gestureState.dy > 0) {
          return podeRecolherArrastando();
        }

        // Para cima com o chat recolhido: primeiro a lista volta até a última
        // mensagem; só no fim dela o gesto abre o chat inteiro.
        return podeAbrirArrastando();
      },
      ...panelGestures,
    }),
  ).current;

  function handleCamera() {
    navigation.navigate('CameraColorDetection');
  }

  function replaceLoadingMessage(loadingId: string, text: string) {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === loadingId ? { ...message, text } : message,
      ),
    );
  }

  // Cards do look em duas colunas, do maior tamanho que cabe acima do chat.
  const lookCardSize = React.useMemo(() => {
    const colunas = lookPecas.length > 1 ? 2 : 1;
    const linhas = Math.max(Math.ceil(lookPecas.length / colunas), 1);
    const largura =
      (screenWidth - LOOK_AREA_SIDE * 2 - LOOK_GRID_GAP * (colunas - 1)) /
      colunas;
    const alturaLivre =
      screenHeight -
      LOOK_AREA_TOP -
      COLLAPSED_PANEL_HEIGHT -
      10 -
      LOOK_GRID_GAP * (linhas - 1);
    const altura = Math.min(alturaLivre / linhas, largura * 1.35);

    return { width: Math.min(largura, altura), height: altura };
  }, [lookPecas.length, screenHeight, screenWidth]);

  async function handleSend() {
    const normalizedText = inputText.trim();

    if (!normalizedText || isGenerating || !accessToken) {
      return;
    }

    // Contexto da conversa antes desta mensagem (sem as mensagens de "Gerando...").
    const historico: MensagemHistorico[] = messages
      .filter((message) => !message.id.startsWith('loading-'))
      .slice(-MENSAGENS_DE_CONTEXTO)
      .map((message) => ({
        autor: message.author === 'user' ? 'usuario' : 'zyra',
        texto: message.text,
      }));

    const loadingId = `loading-${Date.now()}`;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        author: 'user',
        text: normalizedText,
      },
      {
        id: loadingId,
        author: 'zyra',
        text: 'Gerando um look...',
      },
    ]);

    // No iOS, um TextInput multilinha controlado às vezes reaparece com o texto
    // depois do envio; o clear() direto no campo garante que ele esvazie.
    setInputText('');
    inputRef.current?.clear();
    setIsGenerating(true);
    Keyboard.dismiss();

    try {
      const resposta = await sugerirLook(
        {
          mensagem: normalizedText,
          historico,
          pecasAnteriores: lookPecas.map((peca) => peca.id),
          pecasRecentes: recentPecaIds.current,
        },
        accessToken,
      );

      if (!isMounted.current) {
        return;
      }

      const avisos =
        resposta.tipo === 'LOOK' || resposta.tipo === 'SEM_LOOK'
          ? resposta.avisos
          : [];
      replaceLoadingMessage(
        loadingId,
        [resposta.mensagem, ...avisos].join('\n\n'),
      );

      if (resposta.tipo === 'LOOK') {
        // Sem título da IA, um pedido de ajuste ("quero outro", "troca a
        // calça") mantém o título do look que ele modificou.
        const tituloDaIa = resposta.titulo?.trim();

        lookTitulo.current = tituloDaIa
          ? formatarTitulo(tituloDaIa)
          : ((lookPecas.length > 0 ? lookTitulo.current : null) ??
            formatarTitulo(normalizedText));
        lookOcasiao.current = resposta.ocasiao ?? null;

        recentPecaIds.current = [
          ...recentPecaIds.current,
          ...resposta.pecas.map((peca) => peca.id),
        ].slice(-PECAS_RECENTES);
        setLookPecas(resposta.pecas);
        showLookWithCollapsedChat();
        return;
      }
    } catch (error) {
      console.error('[Chat] Falha ao sugerir look:', error);

      if (isMounted.current) {
        replaceLoadingMessage(
          loadingId,
          error instanceof ApiError ? error.message : ERRO_PADRAO,
        );
      }
    }

    if (isMounted.current) {
      setIsGenerating(false);
    }
  }

  // Sem um Touchable em volta da tela para fechar o teclado: ele virava o
  // responsável por todo toque, e no iOS a lista de mensagens não rola
  // enquanto um elemento acima dela é o responsável. Tocar na conversa já
  // fecha o teclado (keyboardShouldPersistTaps="handled"); na área do look,
  // o onTouchStart faz o mesmo sem disputar o toque.
  return (
    <View style={styles.screen}>
      {isLookReady ? (
        <Animated.View
          style={[styles.lookResultLayer, { opacity: resultOpacity }]}
          onTouchStart={Keyboard.dismiss}
        >
          <View style={styles.lookHeader}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para a tela inicial"
              activeOpacity={0.82}
              // Bolinha de 36 px; com a folga, o toque continua com 44 px.
              hitSlop={4}
              style={styles.backButton}
              onPress={handleVoltar}
            >
              {/* Desenhada aqui, com a caixa da seta centrada no viewBox: o
                    SVG baixado tinha margens irregulares e ficava torto. */}
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M15.5 5l-7 7 7 7"
                  stroke={theme.colors.white}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.lookHeaderTitle} accessibilityRole="header">
              Seu look
            </Text>
          </View>

          <ScrollView
            style={styles.lookScroll}
            contentContainerStyle={styles.lookGrid}
            accessibilityLabel="Peças do look sugerido"
          >
            {lookPecas.map((peca) => (
              <ClosetItemCard key={peca.id} peca={peca} style={lookCardSize} />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.chatPanel,
          {
            height: expandedPanelHeight,
            transform: [{ translateY: panelTranslateY }],
          },
        ]}
        {...panelBodyPanResponder.panHandlers}
      >
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            isLookReady
              ? 'Abrir ou recolher a conversa'
              : 'Fechar conversa e voltar para a tela inicial'
          }
          accessibilityHint="Toque ou arraste para baixo"
          style={styles.dragHandle}
          {...panelPanResponder.panHandlers}
        >
          <View style={styles.dragIndicator} />
        </View>

        <Animated.View
          style={[
            styles.messagesContainer,
            // Recolhido, só o topo do painel aparece: a lista cabe entre a
            // barra de arraste e o campo de texto.
            !isPanelExpanded && {
              flex: 0,
              height:
                COLLAPSED_PANEL_HEIGHT -
                DRAG_HANDLE_HEIGHT -
                inputHeight -
                INPUT_BOTTOM_GAP,
            },
            { opacity: conversationOpacity },
          ]}
        >
          <ScrollView
            ref={messagesScrollRef}
            contentContainerStyle={[
              styles.messagesContent,
              {
                // A caixa de texto sobe de 30 px do fundo para o teclado +
                // 16; a diferença entra aqui para nada ficar escondido.
                paddingBottom: isPanelExpanded
                  ? inputHeight +
                    INPUT_BOTTOM_GAP +
                    20 +
                    Math.max(keyboardHeight - 14, 0)
                  : 8,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={(event) => {
              messagesScrollY.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEnabled={isConversationScrollable}
            bounces={false}
            onLayout={(event) => {
              messagesViewportHeight.current = event.nativeEvent.layout.height;
              atualizarRolagemDaConversa();
            }}
            onContentSizeChange={(_, altura) => {
              messagesContentHeight.current = altura;
              messagesScrollRef.current?.scrollToEnd({ animated: true });
              atualizarRolagemDaConversa();
            }}
          >
            {messages.map((message) =>
              message.author === 'zyra' ? (
                <View key={message.id} style={styles.zyraMessageRow}>
                  {/* Oval do ZYRA: a borda branca do degradê destaca o avatar
                      no painel escuro (o vinho sozinho, ~1,9:1, quase sumia). */}
                  <View
                    style={styles.zyraAvatar}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {/* Proporção do SVG (146 × 190). */}
                    <ZyraAvatar width={31} height={40} />
                  </View>

                  <Text style={styles.zyraMessageText}>{message.text}</Text>
                </View>
              ) : (
                <View key={message.id} style={styles.userMessage}>
                  <Text style={styles.userMessageText}>{message.text}</Text>
                </View>
              ),
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.chatContainer,
          { bottom: inputBottom, left: inputInset, right: inputInset },
        ]}
        onLayout={(event) => setInputHeight(event.nativeEvent.layout.height)}
      >
        <View pointerEvents="none" style={styles.chatInputGlow} />

        <View style={styles.chatInput}>
          <TextInput
            ref={inputRef}
            accessibilityLabel="Mensagem para o ZYRA"
            placeholder="Fale com o ZYRA..."
            placeholderTextColor={theme.colors.titleZyra}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            multiline
            // Enter envia; o texto longo quebra a linha sozinho.
            submitBehavior="submit"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            onFocus={() => {
              if (isLookReadyRef.current && !expandedState.current) {
                openChatPanel();
              }
            }}
            editable={!isGenerating}
            maxLength={250}
          />

          {inputText.trim().length > 0 && !isGenerating ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
              activeOpacity={0.8}
              style={styles.sendButton}
              onPress={handleSend}
            >
              <LinearGradient
                colors={['#DE0051', '#AB003E', '#78002C']}
                locations={[0.3, 0.67, 1]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M12 19V5M5 12l7-7 7 7"
                    stroke="#FFFFFF"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abrir câmera"
              activeOpacity={0.8}
              style={styles.cameraButton}
              onPress={handleCamera}
              disabled={isGenerating}
            >
              {/* O SVG tem ~25% de margem em volta do desenho: em 27 px a câmera
                  aparece com ~20 px. Mesmo tamanho na Home e no chat, que trocam
                  de lugar na transição. */}
              <CameraSvg width={27} height={27} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Um popup só, que troca de conteúdo: no iOS, um Modal abrindo
            enquanto outro fecha às vezes não aparece. */}
      <ZyraPopup
        visible={Boolean(dialogoSalvar)}
        variant={dialogoSalvar?.tipo === 'erro' ? 'error' : 'info'}
        title={
          dialogoSalvar?.tipo === 'erro'
            ? 'Não foi possível salvar'
            : 'Salvar este look?'
        }
        message={
          dialogoSalvar?.tipo === 'erro'
            ? dialogoSalvar.mensagem
            : 'Deseja guardar este look na sua Galeria de Looks?'
        }
        buttonText={
          isSalvando
            ? 'Salvando...'
            : dialogoSalvar?.tipo === 'erro'
              ? dialogoSalvar.podeTentarDeNovo
                ? 'Tentar de novo'
                : 'Voltar para o início'
              : 'Sim'
        }
        confirmDisabled={isSalvando}
        onConfirm={
          dialogoSalvar?.tipo === 'erro' && !dialogoSalvar.podeTentarDeNovo
            ? handleNaoSalvar
            : handleSalvarLook
        }
        secondaryButtonText={
          dialogoSalvar?.tipo === 'erro'
            ? dialogoSalvar.podeTentarDeNovo
              ? 'Sair sem salvar'
              : undefined
            : 'Não'
        }
        onSecondaryPress={handleNaoSalvar}
        secondaryVariant="botao"
        // Voltar do Android com o popup aberto: fica no look, sem decidir.
        onClose={() => {
          if (!isSalvando) setDialogoSalvar(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Começa abaixo do cabeçalho da Home (ZYRA e ícones) e cobre o resto da tela:
  // a tela do chat é transparente, e sem isso o painel do armário da Home
  // aparecia por trás do chat recolhido.
  lookResultLayer: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingTop: LOOK_AREA_TOP - HEADER_HEIGHT,
    paddingHorizontal: LOOK_AREA_SIDE,
    paddingBottom: COLLAPSED_PANEL_HEIGHT + 10,
  },
  // Barra do look: voltar e título lado a lado, numa faixa própria entre o
  // logo da Home e as fotos.
  lookHeader: {
    position: 'absolute',
    top: LOOK_HEADER_TOP,
    left: LOOK_AREA_SIDE + 4,
    right: LOOK_AREA_SIDE + 4,
    height: BACK_BUTTON_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 3,
  },
  // Vinho sobre o fundo claro, com seta branca: contraste alto (a anterior,
  // branca sobre creme, quase sumia).
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  lookHeaderTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
  },
  lookScroll: {
    width: '100%',
  },
  lookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: LOOK_GRID_GAP,
  },
  chatPanel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 26,
    overflow: 'hidden',
  },
  // Área de arraste: a faixa inteira do topo do painel, não só a linha branca.
  dragHandle: {
    height: DRAG_HANDLE_HEIGHT,
    marginHorizontal: -26,
    alignItems: 'center',
    justifyContent: 'flex-start',
    // Mesma altura da barra do armário na Home, para ela não "pular" na troca.
    paddingTop: 10,
  },
  dragIndicator: {
    width: 120,
    height: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    gap: 24,
  },
  zyraMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zyraAvatar: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zyraMessageText: {
    // Sem flex, o texto longo passava da borda do painel em vez de quebrar a linha.
    flex: 1,
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  userMessageText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  chatContainer: {
    position: 'absolute',
    zIndex: 20,
    elevation: 20,
  },
  chatInputGlow: {
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
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  // Cresce com o texto até ~5 linhas; depois rola por dentro.
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 112,
    paddingTop: 10,
    paddingBottom: 10,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  cameraButton: {
    width: 36,
    height: 36,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    marginBottom: 2,
    borderRadius: 18,
    shadowColor: '#AB003E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonGradient: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
