import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { theme } from '../styles/theme';

import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';

const TAMANHO = 220;
const CENTRO = TAMANHO / 2;
const RAIO_LUZ = 96;
const DISCO = 164;

// A luz é um arco com rastro: vários pedaços seguidos, do mais apagado (cauda)
// ao mais forte (cabeça). Um degradê no traço não serve, porque no SVG ele
// segue o eixo x da figura, e não o caminho do arco.
const PEDACOS = 14;
const GRAUS_POR_PEDACO = 9;

function pontoNoCirculo(graus: number) {
  const rad = (graus * Math.PI) / 180;
  return {
    x: CENTRO + RAIO_LUZ * Math.cos(rad),
    y: CENTRO + RAIO_LUZ * Math.sin(rad),
  };
}

const ARCOS = Array.from({ length: PEDACOS }, (_, i) => {
  const inicio = pontoNoCirculo(i * GRAUS_POR_PEDACO);
  // Pedaços levemente sobrepostos para não aparecer emenda entre eles.
  const fim = pontoNoCirculo((i + 1) * GRAUS_POR_PEDACO + 1);

  return {
    d: `M ${inicio.x} ${inicio.y} A ${RAIO_LUZ} ${RAIO_LUZ} 0 0 1 ${fim.x} ${fim.y}`,
    opacidade: ((i + 1) / PEDACOS) ** 1.6,
  };
});

/**
 * Tela de espera da página do ColorADD: o logo grande sobre um disco branco
 * (o logo tem contorno preto e o manual pede fundo claro para ele) e uma luz
 * girando em volta. O logo é SVG, então aparece na hora, sem esperar imagem.
 */
export function ColorAddLoading() {
  const [giro] = React.useState(() => new Animated.Value(0));
  const [pulso] = React.useState(() => new Animated.Value(0));

  React.useEffect(() => {
    const animacaoGiro = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const animacaoPulso = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animacaoGiro.start();
    animacaoPulso.start();

    return () => {
      animacaoGiro.stop();
      animacaoPulso.stop();
    };
  }, [giro, pulso]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando a página do ColorADD"
    >
      <View style={styles.palco}>
        {/* Trilho apagado por onde a luz passa. */}
        <Svg width={TAMANHO} height={TAMANHO} style={StyleSheet.absoluteFill}>
          <Circle
            cx={CENTRO}
            cy={CENTRO}
            r={RAIO_LUZ}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={3}
            fill="none"
          />
        </Svg>

        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  rotate: giro.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg width={TAMANHO} height={TAMANHO}>
            {/* Halo largo e fraco por baixo, para a luz parecer brilhar. */}
            {ARCOS.map((arco, i) => (
              <Path
                key={`halo-${i}`}
                d={arco.d}
                stroke={theme.colors.white}
                strokeOpacity={arco.opacidade * 0.18}
                strokeWidth={14}
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {ARCOS.map((arco, i) => (
              <Path
                key={`luz-${i}`}
                d={arco.d}
                stroke={theme.colors.white}
                strokeOpacity={arco.opacidade}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            styles.disco,
            {
              transform: [
                {
                  scale: pulso.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.04],
                  }),
                },
              ],
            },
          ]}
        >
          <LogoColorADD width={118} height={100} />
        </Animated.View>
      </View>

      <Text style={styles.assinatura}>A Cor é para Todos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  palco: {
    width: TAMANHO,
    height: TAMANHO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disco: {
    width: DISCO,
    height: DISCO,
    borderRadius: DISCO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  assinatura: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    marginTop: 18,
  },
});
