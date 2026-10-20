import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import type { SvgProps } from 'react-native-svg';

import ClothesHome from '../../assets/images/clothes_home.svg';
import Look2Calca from '../../assets/images/looks-home/look2-calca.svg';
import Look2Camiseta from '../../assets/images/looks-home/look2-camiseta.svg';
import Look2Tenis from '../../assets/images/looks-home/look2-tenis.svg';

/**
 * Carrossel da Home: looks ilustrados com estéticas diferentes, trocando de
 * tempos em tempos. Cada peça é um vetor solto, posicionado e um pouco
 * inclinado, como a ilustração original da Home.
 *
 * Para acrescentar um look: salvar os vetores em assets/images/looks-home (sem
 * <style> nem class: o react-native-svg não entende CSS, e a peça sairia
 * preta) e incluir um item em LOOKS.
 */

type Peca = {
  Desenho: React.FC<SvgProps>;
  /** Caixa da peça em fração da área (0 a 1). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Inclinação, em graus. */
  rotacao: number;
};

const LOOKS: Peca[][] = [
  // O look original da Home, já montado num único vetor.
  [{ Desenho: ClothesHome, x: 0, y: 0, w: 1, h: 1, rotacao: 0 }],
  [
    { Desenho: Look2Calca, x: 0.38, y: 0.24, w: 0.58, h: 0.7, rotacao: 7 },
    { Desenho: Look2Camiseta, x: 0, y: 0.02, w: 0.66, h: 0.46, rotacao: -10 },
    { Desenho: Look2Tenis, x: 0.02, y: 0.62, w: 0.46, h: 0.36, rotacao: -8 },
  ],
];

// Tempo de cada look na tela e duração da troca.
const TEMPO_POR_LOOK_MS = 4500;
const TRANSICAO_MS = 700;

type Props = { largura: number; altura: number };

export function CarrosselDeLooks({ largura, altura }: Props) {
  const [atual, setAtual] = useState(0);
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  const telaEmFoco = useIsFocused();
  // Visibilidade de cada look (0 a 1): só o atual fica em 1.
  const [visivel] = useState(() =>
    LOOKS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  );

  // "Reduzir movimento" do celular: o look fica parado (WCAG 2.3.3).
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduzirMovimento);
    const assinatura = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduzirMovimento,
    );
    return () => assinatura.remove();
  }, []);

  useEffect(() => {
    // Fora da tela ou com movimento reduzido, não troca (nem gasta bateria).
    if (!telaEmFoco || reduzirMovimento || LOOKS.length < 2) return;

    const timer = setTimeout(() => {
      const proximo = (atual + 1) % LOOKS.length;
      Animated.parallel([
        Animated.timing(visivel[atual], {
          toValue: 0,
          duration: TRANSICAO_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(visivel[proximo], {
          toValue: 1,
          duration: TRANSICAO_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setAtual(proximo));
    }, TEMPO_POR_LOOK_MS);

    return () => clearTimeout(timer);
  }, [atual, telaEmFoco, reduzirMovimento, visivel]);

  return (
    // Ilustração decorativa: o leitor de tela pula.
    <View
      style={{ width: largura, height: altura }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {LOOKS.map((pecas, indice) => (
        <Animated.View
          key={indice}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: visivel[indice],
              // O look que entra sobe um pouco enquanto aparece.
              transform: [
                {
                  translateY: visivel[indice].interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
                {
                  scale: visivel[indice].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {pecas.map(({ Desenho, x, y, w, h, rotacao }, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x * largura,
                top: y * altura,
                width: w * largura,
                height: h * altura,
                transform: [{ rotate: `${rotacao}deg` }],
              }}
            >
              <Desenho width="100%" height="100%" />
            </View>
          ))}
        </Animated.View>
      ))}
    </View>
  );
}
