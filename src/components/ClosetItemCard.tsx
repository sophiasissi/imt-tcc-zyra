import { Image, StyleSheet, Text, View } from 'react-native';

import { CATEGORIA_LABEL, Peca } from '../services/pecasApi';
import { theme } from '../styles/theme';
import { getColorAddSymbol } from '../utils/colorAddSymbols';

type Props = {
  peca: Peca;
};

/**
 * Peça do closet: foto, símbolo ColorADD e nome da cor.
 *
 * A cor nunca aparece só pela foto — sempre com o nome escrito e o símbolo,
 * para quem não distingue a tonalidade na imagem.
 */
export function ClosetItemCard({ peca }: Props) {
  const symbol = getColorAddSymbol(peca.colorAddSymbol);
  const nomeCor = symbol?.label ?? peca.corNome;
  const categoria = CATEGORIA_LABEL[peca.categoria];
  const descricao = [categoria, nomeCor].filter(Boolean).join(', ');

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={descricao || 'Peça do seu armário'}
    >
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
    </View>
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
});
