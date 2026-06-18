import {
  Animated,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

import CameraSvg from '../../assets/icons/camera.svg';
import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';
import ClothesHome from '../../assets/images/clothes_home.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const COLLAPSED_PANEL_HEIGHT = 320;
const EXPANDED_PANEL_TOP = 115;

type ClothingCardProps = {
  type: 'shirt' | 'pants' | 'jacket' | 'skirt';
};

function ClothingCard({ type }: ClothingCardProps) {
  return (
    <View style={styles.clothingCard}>
      {type === 'shirt' ? (
        <View style={styles.miniShirt}>
          <View style={styles.miniShirtBody} />
          <View style={[styles.miniSleeve, styles.miniSleeveLeft]} />
          <View style={[styles.miniSleeve, styles.miniSleeveRight]} />
          <View style={styles.shirtStripeOne} />
          <View style={styles.shirtStripeTwo} />
          <View style={styles.shirtStripeThree} />
        </View>
      ) : null}

      {type === 'pants' ? (
        <View style={styles.miniPants}>
          <View style={styles.pantsWaist} />
          <View style={[styles.pantsLeg, styles.pantsLegLeft]} />
          <View style={[styles.pantsLeg, styles.pantsLegRight]} />
        </View>
      ) : null}

      {type === 'jacket' ? (
        <View style={styles.miniJacket}>
          <View style={styles.jacketBody} />
          <View style={[styles.jacketSleeve, styles.jacketSleeveLeft]} />
          <View style={[styles.jacketSleeve, styles.jacketSleeveRight]} />
          <View style={styles.jacketZip} />
        </View>
      ) : null}

      {type === 'skirt' ? (
        <View style={styles.miniSkirt}>
          <View style={styles.skirtWaist} />
          <View style={styles.skirtBody} />
        </View>
      ) : null}
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const nome = user?.nome ?? null;

  const { height: screenHeight } = useWindowDimensions();

  const expandedPanelHeight = screenHeight - EXPANDED_PANEL_TOP;
  const collapsedTranslateY = expandedPanelHeight - COLLAPSED_PANEL_HEIGHT;

  const panelTranslateY = React.useRef(
    new Animated.Value(collapsedTranslateY),
  ).current;
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

  const panelPanResponder = React.useRef(
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
  ).current;

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
    navigation.navigate('Chat', { nome });
  }

  function handleCamera() {
    console.log('[Home] Usuário acessou a câmera.');
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

        <View style={styles.clothingGrid}>
          <ClothingCard type="shirt" />
          <ClothingCard type="pants" />
          <ClothingCard type="jacket" />
          <ClothingCard type="skirt" />
        </View>
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
            onPress={handleCamera}
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
    ...StyleSheet.absoluteFillObject,
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
  },
  clothingCard: {
    width: '32%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#F8F6F4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniShirt: {
    width: 70,
    height: 72,
    position: 'relative',
  },
  miniShirtBody: {
    position: 'absolute',
    width: 44,
    height: 58,
    backgroundColor: '#E9E6DE',
    left: 13,
    top: 8,
  },
  miniSleeve: {
    position: 'absolute',
    width: 19,
    height: 28,
    backgroundColor: '#E9E6DE',
    top: 12,
  },
  miniSleeveLeft: {
    left: 1,
    transform: [{ rotate: '24deg' }],
  },
  miniSleeveRight: {
    right: 1,
    transform: [{ rotate: '-24deg' }],
  },
  shirtStripeOne: {
    position: 'absolute',
    width: 58,
    height: 3,
    backgroundColor: '#3D4A53',
    top: 26,
    left: 6,
  },
  shirtStripeTwo: {
    position: 'absolute',
    width: 56,
    height: 3,
    backgroundColor: '#3D4A53',
    top: 36,
    left: 7,
  },
  shirtStripeThree: {
    position: 'absolute',
    width: 50,
    height: 3,
    backgroundColor: '#3D4A53',
    top: 46,
    left: 10,
  },
  miniPants: {
    width: 54,
    height: 76,
    position: 'relative',
  },
  pantsWaist: {
    width: 48,
    height: 17,
    borderRadius: 3,
    backgroundColor: '#B29D87',
    position: 'absolute',
    left: 3,
    top: 4,
  },
  pantsLeg: {
    width: 21,
    height: 60,
    borderRadius: 3,
    backgroundColor: '#B29D87',
    position: 'absolute',
    top: 15,
  },
  pantsLegLeft: {
    left: 5,
    transform: [{ rotate: '3deg' }],
  },
  pantsLegRight: {
    right: 5,
    transform: [{ rotate: '-3deg' }],
  },
  miniJacket: {
    width: 70,
    height: 72,
    position: 'relative',
  },
  jacketBody: {
    width: 44,
    height: 58,
    borderRadius: 3,
    backgroundColor: '#32739C',
    position: 'absolute',
    left: 13,
    top: 8,
  },
  jacketSleeve: {
    width: 17,
    height: 42,
    borderRadius: 3,
    backgroundColor: '#32739C',
    position: 'absolute',
    top: 12,
  },
  jacketSleeveLeft: {
    left: 4,
    transform: [{ rotate: '18deg' }],
  },
  jacketSleeveRight: {
    right: 4,
    transform: [{ rotate: '-18deg' }],
  },
  jacketZip: {
    width: 2,
    height: 53,
    backgroundColor: '#ECECEC',
    position: 'absolute',
    left: 34,
    top: 11,
  },
  miniSkirt: {
    width: 58,
    height: 70,
    position: 'relative',
  },
  skirtWaist: {
    width: 35,
    height: 11,
    borderRadius: 3,
    backgroundColor: '#D482A0',
    position: 'absolute',
    top: 7,
    left: 12,
  },
  skirtBody: {
    width: 51,
    height: 51,
    borderRadius: 5,
    backgroundColor: '#D482A0',
    position: 'absolute',
    top: 16,
    left: 4,
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
