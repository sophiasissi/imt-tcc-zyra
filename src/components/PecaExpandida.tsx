import React from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CATEGORIA_LABEL, Peca } from '../services/pecasApi';
import { theme } from '../styles/theme';
import { getColorAddSymbol } from '../utils/colorAddSymbols';

type Props = {
  /** Peça aberta; null fecha. */
  peca: Peca | null;
  onClose: () => void;
};

const CARD_MAX_WIDTH = 360;

/**
 * Peça do closet ampliada: o mesmo card da grade (foto em cima, faixa branca
 * com o símbolo ColorADD e o nome da cor), só que grande e por cima da tela.
 * Toque fora ou no X para fechar.
 */
export function PecaExpandida({ peca, onClose }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [progress] = React.useState(() => new Animated.Value(0));

  // Guarda a última peça para o card não sumir no meio da animação de saída.
  // Atualizada durante a renderização (padrão do React para estado derivado
  // de props), e não num efeito.
  const [pecaVisivel, setPecaVisivel] = React.useState<Peca | null>(peca);

  if (peca && peca !== pecaVisivel) {
    setPecaVisivel(peca);
  }

  React.useEffect(() => {
    if (peca) {
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setPecaVisivel(null);
    });
  }, [peca, progress]);

  if (!pecaVisivel) return null;

  const symbol = getColorAddSymbol(pecaVisivel.colorAddSymbol);
  const nomeCor = symbol?.label ?? pecaVisivel.corNome;
  const categoria = CATEGORIA_LABEL[pecaVisivel.categoria];

  const symbolSecundario = getColorAddSymbol(
    pecaVisivel.colorAddSymbolSecundario,
  );
  const nomeCorSecundaria =
    symbolSecundario?.label ?? pecaVisivel.corSecundariaNome;

  const cardWidth = Math.min(screenWidth - 48, CARD_MAX_WIDTH);
  const descricao = [categoria, nomeCor, nomeCorSecundaria]
    .filter(Boolean)
    .join(', ');

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar peça"
        />
      </Animated.View>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              width: cardWidth,
              opacity: progress,
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: pecaVisivel.imagemUrl }}
            style={[styles.photo, { height: cardWidth * (4 / 3) }]}
            accessible
            accessibilityLabel={descricao || 'Peça do seu armário'}
          />

          {nomeCor ? (
            <View style={styles.colorTag}>
              {symbol ? (
                <Image source={symbol.image} style={styles.symbol} />
              ) : null}

              <View style={styles.colorTexts}>
                <Text style={styles.colorText} numberOfLines={1}>
                  {nomeCor}
                </Text>
                {categoria ? (
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {categoria}
                  </Text>
                ) : null}
              </View>

              {nomeCorSecundaria ? (
                <View style={styles.secondary}>
                  {symbolSecundario ? (
                    <Image
                      source={symbolSecundario.image}
                      style={styles.symbolSmall}
                    />
                  ) : null}
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {nomeCorSecundaria}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            activeOpacity={0.8}
            hitSlop={10}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path
                d="M6 6l12 12M18 6L6 18"
                stroke={theme.colors.title}
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    backgroundColor: '#F8F6F4',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  symbol: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginRight: 10,
  },
  colorTexts: {
    flex: 1,
  },
  colorText: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    textTransform: 'lowercase',
  },
  categoryText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    textTransform: 'lowercase',
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    maxWidth: '45%',
  },
  symbolSmall: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginRight: 6,
  },
  secondaryText: {
    flexShrink: 1,
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    textTransform: 'lowercase',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
});
