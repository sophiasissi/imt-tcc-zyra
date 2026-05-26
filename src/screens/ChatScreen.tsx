import React from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import CameraSvg from '../../assets/icons/camera.svg';
import LookCompleto from '../../assets/images/look_completo.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

type Message = {
  id: string;
  author: 'user' | 'zyra';
  text: string;
};

const COLLAPSED_PANEL_HEIGHT = 320;
const EXPANDED_PANEL_TOP = 115;

// Tempo provisório usado somente na apresentação, até a integração da API.
const DEMO_LOOK_GENERATION_DELAY_MS = 2800;

export function ChatScreen({ navigation }: Props) {
  // Mantém a altura original da tela para o painel não mudar de posição
  // quando o teclado aparecer. Apenas o input sobe com o teclado.
  const screenHeight = React.useRef(Dimensions.get('window').height).current;
  const expandedPanelHeight = screenHeight - EXPANDED_PANEL_TOP;
  const collapsedTranslateY = expandedPanelHeight - COLLAPSED_PANEL_HEIGHT;

  const panelTranslateY = React.useRef(
    new Animated.Value(collapsedTranslateY),
  ).current;
  const inputBottom = React.useRef(new Animated.Value(30)).current;
  const conversationOpacity = React.useRef(new Animated.Value(0)).current;
  const resultOpacity = React.useRef(new Animated.Value(0)).current;

  const currentPanelPosition = React.useRef(collapsedTranslateY);
  const dragStartPosition = React.useRef(collapsedTranslateY);
  const wasDragged = React.useRef(false);
  const exitGestureTriggered = React.useRef(false);
  const expandedState = React.useRef(false);
  const isClosing = React.useRef(false);
  const isLookReadyRef = React.useRef(false);
  const generationTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [inputText, setInputText] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isLookReady, setIsLookReady] = React.useState(false);
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
      Animated.timing(inputBottom, {
        toValue: event.endCoordinates.height + 16,
        duration: event.duration ?? 220,
        useNativeDriver: false,
      }).start();
    }

    function resetInputPosition(event?: KeyboardEvent) {
      Animated.timing(inputBottom, {
        toValue: 30,
        duration: event?.duration ?? 180,
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
    const frameId = requestAnimationFrame(() => {
      openChatPanel();

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

      if (generationTimer.current) {
        clearTimeout(generationTimer.current);
      }
    };
    // A animação inicial só deve executar quando a tela abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openChatPanel() {
    expandedState.current = true;

    Animated.spring(panelTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.85,
    }).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = 0;
      }
    });
  }

  function showLookWithCollapsedChat() {
    isLookReadyRef.current = true;
    setIsLookReady(true);
    setIsGenerating(false);
    expandedState.current = false;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(resultOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(panelTranslateY, {
        toValue: collapsedTranslateY,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
        mass: 0.85,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        currentPanelPosition.current = collapsedTranslateY;
      }
    });
  }

  function returnToHome() {
    if (isClosing.current) {
      return;
    }

    isClosing.current = true;
    expandedState.current = false;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.spring(panelTranslateY, {
        toValue: collapsedTranslateY,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
        mass: 0.85,
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
        navigation.goBack();
        return;
      }

      isClosing.current = false;
    });
  }

  const panelPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2,
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

        const nextPosition = dragStartPosition.current + gestureState.dy;
        const limitedPosition = Math.max(
          0,
          Math.min(collapsedTranslateY, nextPosition),
        );

        panelTranslateY.setValue(limitedPosition);

        // No chat, iniciar um gesto claro para baixo já faz a saída acontecer.
        if (gestureState.dy > 18) {
          exitGestureTriggered.current = true;
          returnToHome();
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (exitGestureTriggered.current || isClosing.current) {
          return;
        }

        if (!wasDragged.current) {
          returnToHome();
          return;
        }

        if (gestureState.dy > 0 || gestureState.vy > 0.25) {
          returnToHome();
          return;
        }

        openChatPanel();
      },

      onPanResponderTerminate: () => {
        if (!isClosing.current) {
          openChatPanel();
        }
      },
    }),
  ).current;

  function handleCamera() {
    console.log('[Chat] Usuário acessou a câmera.');
  }

  function handleSend() {
    const normalizedText = inputText.trim();

    if (!normalizedText || isGenerating || isLookReadyRef.current) {
      return;
    }

    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        author: 'user',
        text: normalizedText,
      },
      {
        id: `loading-${Date.now()}`,
        author: 'zyra',
        text: 'Gerando um look...',
      },
    ]);

    setInputText('');
    setIsGenerating(true);
    Keyboard.dismiss();

    generationTimer.current = setTimeout(() => {
      showLookWithCollapsedChat();
    }, DEMO_LOOK_GENERATION_DELAY_MS);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        {isLookReady ? (
          <Animated.View
            style={[styles.lookResultLayer, { opacity: resultOpacity }]}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para o armário digital"
              activeOpacity={0.82}
              style={styles.backButton}
              onPress={returnToHome}
            >
              <Text style={styles.backButtonIcon}>←</Text>
            </TouchableOpacity>

            <View pointerEvents="none" style={styles.lookImageContainer}>
              <LookCompleto style={styles.lookImage} />
            </View>
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
        >
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel="Fechar conversa e voltar para a tela inicial"
            accessibilityHint="Toque ou arraste para baixo"
            style={styles.dragHandle}
            {...panelPanResponder.panHandlers}
          >
            <View style={styles.dragIndicator} />
          </View>

          <Animated.View
            style={[
              styles.messagesContainer,
              { opacity: conversationOpacity },
            ]}
          >
            {messages.map(message =>
              message.author === 'zyra' ? (
                <View key={message.id} style={styles.zyraMessageRow}>
                  <View style={styles.messageIndicatorShadow}>
                    <LinearGradient
                      colors={['#DE0051', '#AB003E', '#78002C']}
                      locations={[0.3, 0.67, 1]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.messageIndicator}
                    />
                  </View>

                  <Text style={styles.zyraMessageText}>{message.text}</Text>
                </View>
              ) : (
                <View key={message.id} style={styles.userMessage}>
                  <Text style={styles.userMessageText}>{message.text}</Text>
                </View>
              ),
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.chatContainer, { bottom: inputBottom }]}>
          <View pointerEvents="none" style={styles.chatInputGlow} />

          <View style={styles.chatInput}>
            <TextInput
              accessibilityLabel="Mensagem para o ZYRA"
              placeholder="Fale com o ZYRA..."
              placeholderTextColor={theme.colors.titleZyra}
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!isGenerating && !isLookReady}
              maxLength={250}
            />

            {inputText.trim().length > 0 && !isGenerating && !isLookReady ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                activeOpacity={0.8}
                style={styles.sendButton}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>↑</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Abrir câmera"
                activeOpacity={0.8}
                style={styles.cameraButton}
                onPress={handleCamera}
                disabled={isGenerating || isLookReady}
              >
                <CameraSvg width={24} height={24} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  lookResultLayer: {
    position: 'absolute',
    top: 104,
    left: 0,
    right: 0,
    bottom: COLLAPSED_PANEL_HEIGHT,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    paddingTop: 38,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 3,
  },
  backButtonIcon: {
    color: theme.colors.titleZyra,
    fontSize: 22,
    lineHeight: 24,
    fontFamily: theme.fonts.semiBold,
  },
  lookImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookImage: {
    alignSelf: 'center',
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
  messagesContainer: {
    flex: 1,
    gap: 24,
  },
  zyraMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageIndicatorShadow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  zyraMessageText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
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
    left: 52,
    right: 52,
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
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    paddingLeft: 18,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  textInput: {
    flex: 1,
    height: 56,
    paddingVertical: 0,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  cameraButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 23,
    lineHeight: 25,
    marginTop: -2,
  },
});
