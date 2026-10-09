import { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { theme } from '../styles/theme';

type Props = {
  marcada: boolean;
  onChange: (marcada: boolean) => void;
  /** Texto que o leitor de tela anuncia (o rótulo visível pode ter links). */
  accessibilityLabel: string;
  children: ReactNode;
};

/**
 * Checkbox de aceite. Nunca vem marcado: o aceite só vale se a pessoa marcar
 * (LGPD, art. 8º; um checkbox já marcado pode ser invalidado).
 */
export function CaixaMarcacao({
  marcada,
  onChange,
  accessibilityLabel,
  children,
}: Props) {
  return (
    <View style={styles.linha}>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcada }}
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.8}
        hitSlop={10}
        style={[styles.marcador, marcada && styles.marcadorAtivo]}
        onPress={() => onChange(!marcada)}
      >
        {marcada ? (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke={theme.colors.white}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        ) : null}
      </TouchableOpacity>

      <View style={styles.rotulo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  marcador: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.title,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcadorAtivo: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  rotulo: {
    flex: 1,
  },
});
