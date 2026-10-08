import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { CATEGORIA_LABEL, Peca } from '../services/pecasApi';
import { theme } from '../styles/theme';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { SelectionCircle } from './SelectionCircle';

type Props = {
  peca: Peca;
  /** Tamanho do card. Sem ele, usa o tamanho da grade do armário na Home. */
  style?: StyleProp<ViewStyle>;
  /** Modo de seleção do armário: mostra a bolinha e o toque marca a peça. */
  selecionavel?: boolean;
  selecionado?: boolean;
  onPress?: () => void;
};

/**
 * Peça do closet: foto, símbolo ColorADD e nome da cor.
 *
 * A cor nunca aparece só pela foto — sempre com o nome escrito e o símbolo,
 * para quem não distingue a tonalidade na imagem.
 */
export function ClosetItemCard({
  peca,
  style,
  selecionavel = false,
  selecionado = false,
  onPress,
}: Props) {
  const symbol = getColorAddSymbol(peca.colorAddSymbol);
  const nomeCor = symbol?.label ?? peca.corNome;
  const categoria = CATEGORIA_LABEL[peca.categoria];
  const descricao = [categoria, nomeCor].filter(Boolean).join(', ');

  const conteudo = (
    <>
      <Image source={{ uri: peca.imagemUrl }} style={styles.photo} />

      {nomeCor ? (
        <View style={styles.colorTag}>
          {symbol ? (
            <Image source={symbol.image} style={styles.symbol} />
          ) : null}

          <Text style={styles.colorText} numberOfLines={1}>
            {nomeCor}
          </Text>
        </View>
      ) : null}

      {/* Véu claro sobre a peça marcada, como nas Fotos do iPhone. */}
      {selecionado ? <View style={styles.selectedVeil} /> : null}

      {selecionavel ? (
        <SelectionCircle selected={selecionado} style={styles.circle} />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[styles.card, style]}
        accessible
        accessibilityLabel={descricao || 'Peça do seu armário'}
      >
        {conteudo}
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, style]}
      onPress={onPress}
      accessibilityRole={selecionavel ? 'checkbox' : 'button'}
      accessibilityState={selecionavel ? { checked: selecionado } : undefined}
      accessibilityLabel={descricao || 'Peça do seu armário'}
    >
      {conteudo}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '32%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#F8F6F4',
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  symbol: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    marginRight: 4,
  },
  colorText: {
    flex: 1,
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    textTransform: 'lowercase',
  },
  selectedVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  circle: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
