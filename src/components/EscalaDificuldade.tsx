import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  DIFICULDADE_MAX_LABEL,
  DIFICULDADE_MIN_LABEL,
  DIFICULDADE_NIVEIS,
} from '../constants/perfil';
import { theme } from '../styles/theme';

type Props = {
  selected: number | null;
  /** Nível salvo: ganha um ✓ que só muda depois de salvar (Informações pessoais). */
  salvo?: number | null;
  onSelect: (nivel: number) => void;
  disabled?: boolean;
};

/**
 * Escala de 0 a 5 da dificuldade para combinar roupas, usada no cadastro e em
 * Informações pessoais.
 */
export function EscalaDificuldade({
  selected,
  salvo = null,
  onSelect,
  disabled = false,
}: Props) {
  return (
    <View accessibilityRole="radiogroup">
      <View style={styles.scale}>
        {DIFICULDADE_NIVEIS.map((nivel) => (
          <TouchableOpacity
            key={nivel}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === nivel, disabled }}
            accessibilityLabel={
              salvo === nivel ? `${nivel} de 5, opção salva` : `${nivel} de 5`
            }
            accessibilityHint={
              nivel === 0
                ? DIFICULDADE_MIN_LABEL
                : nivel === 5
                  ? DIFICULDADE_MAX_LABEL
                  : undefined
            }
            activeOpacity={0.82}
            disabled={disabled}
            onPress={() => onSelect(nivel)}
            style={[styles.circle, selected === nivel && styles.selectedCircle]}
          >
            <Text
              style={[
                styles.number,
                selected === nivel && styles.selectedNumber,
              ]}
            >
              {nivel}
            </Text>

            {salvo === nivel ? (
              <View style={styles.salvoBadge}>
                <Svg width={10} height={10} viewBox="0 0 24 24">
                  <Path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke={theme.colors.white}
                    strokeWidth={3.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.captionRow}>
        <Text style={styles.caption}>{DIFICULDADE_MIN_LABEL}</Text>
        <Text style={styles.caption}>{DIFICULDADE_MAX_LABEL}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    backgroundColor: theme.colors.primary,
  },
  number: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  // Fora do círculo, no canto: aparece igual com o círculo marcado ou não.
  salvoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.title,
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  selectedNumber: {
    color: theme.colors.white,
  },
  captionRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 11,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
  },
});
