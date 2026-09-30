import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../styles/theme';

type Props = {
  visible: boolean;
  title?: string;
  /**
   * Etapas mostradas em sequência enquanto se espera.
   *
   * Devem ser as etapas reais do que está acontecendo, na ordem. O tempo de
   * cada uma é aproximado — a resposta chega de uma vez só — mas o que a
   * pessoa lê corresponde ao que está sendo feito.
   */
  steps: string[];
  stepDurationMs?: number;
};

const DEFAULT_STEP_MS = 2200;

export function ZyraLoadingPopup({
  visible,
  title = 'Analisando sua peça',
  steps,
  stepDurationMs = DEFAULT_STEP_MS,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);

  // O índice não é zerado aqui de propósito: quem usa este componente monta e
  // desmonta ele, então o estado nasce limpo a cada abertura. Zerar dentro do
  // efeito seria escrever estado durante o efeito, o que o React 19 sinaliza.
  useEffect(() => {
    if (!visible || steps.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      // Para na última etapa em vez de voltar ao começo: reiniciar a lista
      // passaria a impressão de que travou e recomeçou.
      setStepIndex((atual) => Math.min(atual + 1, steps.length - 1));
    }, stepDurationMs);

    return () => clearInterval(timer);
  }, [visible, steps.length, stepDurationMs]);

  const currentStep = steps[stepIndex] ?? steps[0];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#AB003E', '#D66A92']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`${title}. ${currentStep}.`}
          accessibilityLiveRegion="polite"
        >
          <ActivityIndicator color="#FFFFFF" size="large" />

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.step}>{currentStep}</Text>

          <View style={styles.dots}>
            {steps.map((step, index) => (
              <View
                key={step}
                style={[styles.dot, index <= stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Text style={styles.hint}>Isso leva alguns segundos.</Text>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 19,
    textAlign: 'center',
    marginTop: 18,
  },
  step: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    minHeight: 42,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 4,
    marginBottom: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: theme.colors.white,
  },
  hint: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
});
