import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import Look2Calca from '../../assets/images/looks-home/look2-calca.svg';
import Look2Camiseta from '../../assets/images/looks-home/look2-camiseta.svg';
import Look2Tenis from '../../assets/images/looks-home/look2-tenis.svg';
import Look3Bermuda from '../../assets/images/looks-home/look3-bermuda.svg';
import Look3Camisa from '../../assets/images/looks-home/look3-camisa.svg';
import Look3Tenis from '../../assets/images/looks-home/look3-tenis.svg';
import Look4Bota from '../../assets/images/looks-home/look4-bota.svg';
import Look4Calca from '../../assets/images/looks-home/look4-calca.svg';
import Look4Sueter from '../../assets/images/looks-home/look4-sueter.svg';
import Look5Calca from '../../assets/images/looks-home/look5-calca.svg';
import Look5Camiseta from '../../assets/images/looks-home/look5-camiseta.svg';
import Look5Tenis from '../../assets/images/looks-home/look5-tenis.svg';

/**
 * Carrossel da Home: looks ilustrados com estéticas diferentes, trocados de
 * tempos em tempos como um baralho: as peças se juntam no centro e o próximo
 * look se espalha a partir dali. Cada peça é um vetor solto, posicionado e um
 * pouco inclinado.
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
  [
    { Desenho: Look5Camiseta, x: 0, y: 0.02, w: 0.7, h: 0.56, rotacao: -8 },
    { Desenho: Look5Calca, x: 0.38, y: 0.3, w: 0.7, h: 0.52, rotacao: 35 },
    { Desenho: Look5Tenis, x: 0.1, y: 0.66, w: 0.48, h: 0.25, rotacao: -4 },
  ],
  [
    { Desenho: Look2Calca, x: 0.38, y: 0.2, w: 0.58, h: 0.7, rotacao: 7 },
    { Desenho: Look2Camiseta, x: 0, y: 0.02, w: 0.66, h: 0.46, rotacao: -10 },
    { Desenho: Look2Tenis, x: 0.02, y: 0.62, w: 0.46, h: 0.36, rotacao: -8 },
  ],
  [
    { Desenho: Look3Camisa, x: 0.1, y: 0.02, w: 0.65, h: 0.66, rotacao: -8 },
    { Desenho: Look3Bermuda, x: 0.4, y: 0.3, w: 0.58, h: 0.66, rotacao: 6 },
    { Desenho: Look3Tenis, x: 0.08, y: 0.64, w: 0.43, h: 0.3, rotacao: -6 },
  ],
];

// Tempo de cada look na tela e duração do "juntar" (o espalhar é uma mola).
const TEMPO_POR_LOOK_MS = 4500;
const JUNTAR_MS = 450;
// Na pilha do centro: tamanho das peças e abertura do leque entre elas.
const ESCALA_NA_PILHA = 0.6;
const LEQUE_GRAUS = 14;

type Props = { largura: number; altura: number };

export function CarrosselDeLooks({ largura, altura }: Props) {
  const [atual, setAtual] = useState(0);
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  const telaEmFoco = useIsFocused();
  // 0 = peças espalhadas no lugar delas; 1 = juntas no centro, como um maço de
  // cartas. Na troca, o look atual junta, vira o próximo e ele se espalha.
  const [junto] = useState(() => new Animated.Value(0));

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
    if (!telaEmFoco || reduzirMovimento || LOOKS.length < 2) {
      junto.setValue(0);
      return;
    }

    // Look que acabou de entrar (ainda na pilha) se espalha com um quique. Na
    // primeira vez já está espalhado, e a mola não faz nada.
    Animated.spring(junto, {
      toValue: 0,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(junto, {
        toValue: 1,
        duration: JUNTAR_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setAtual((a) => (a + 1) % LOOKS.length);
      });
    }, TEMPO_POR_LOOK_MS);

    return () => {
      clearTimeout(timer);
      junto.stopAnimation();
    };
  }, [atual, telaEmFoco, reduzirMovimento, junto]);

  return (
    // Ilustração decorativa: o leitor de tela pula.
    <View
      style={{ width: largura, height: altura }}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {LOOKS[atual].map(({ Desenho, x, y, w, h, rotacao }, i, pecas) => {
        // Quanto falta para o centro da peça chegar ao centro da área.
        const ateCentroX = largura / 2 - (x + w / 2) * largura;
        const ateCentroY = altura / 2 - (y + h / 2) * altura;
        // Na pilha, as peças abrem em leque em torno do meio.
        const giroNaPilha = (i - (pecas.length - 1) / 2) * LEQUE_GRAUS;
        return (
          <Animated.View
            // A key muda com o look para as peças novas não herdarem nada das
            // anteriores.
            key={`${atual}-${i}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: x * largura,
              top: y * altura,
              width: w * largura,
              height: h * altura,
              transform: [
                {
                  translateX: junto.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, ateCentroX],
                  }),
                },
                {
                  translateY: junto.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, ateCentroY],
                  }),
                },
                {
                  rotate: junto.interpolate({
                    inputRange: [0, 1],
                    outputRange: [`${rotacao}deg`, `${giroNaPilha}deg`],
                  }),
                },
                {
                  scale: junto.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, ESCALA_NA_PILHA],
                  }),
                },
              ],
            }}
          >
            <Desenho width="100%" height="100%" />
          </Animated.View>
        );
      })}
    </View>
  );
}
