import {
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
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { listarPecas, Peca } from '../services/pecasApi';
import { ClosetItemCard } from '../components/ClosetItemCard';

import CameraSvg from '../../assets/icons/camera.svg';
import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';
import ClothesHome from '../../assets/images/clothes_home.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const COLLAPSED_PANEL_HEIGHT = 320;
const EXPANDED_PANEL_TOP = 115;

export function HomeScreen({ navigation }: Props) {
  const { user, tokens } = useAuth();
  const nome = user?.nome ?? null;
  const accessToken = tokens?.accessToken ?? null;

  const [pecas, setPecas] = React.useState<Peca[]>([]);
  const [isLoadingPecas, setIsLoadingPecas] = React.useState(true);
  const [pecasError, setPecasError] = React.useState<string | null>(null);

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

  function handleSelectCloset() {
    console.log('[Home] Usuário selecionou o armário digital.');
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
            <Text style={styles.closetTitle}>Seu Armário Digital</Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Selecionar roupas"
              activeOpacity={0.84}
              style={styles.selectButton}
              onPress={handleSelectCloset}
            >
              <Text style={styles.selectButtonText}>Selecionar</Text>
            </TouchableOpacity>
          </View>

          {isLoadingPecas && pecas.length === 0 ? (
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
                <ClosetItemCard key={peca.id} peca={peca} />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>

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
            <CameraSvg width={24} height={24} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
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
    color: theme.colors.muted,
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
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
