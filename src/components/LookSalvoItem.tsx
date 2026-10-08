import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { LookSalvo } from '../services/looksApi';
import { theme } from '../styles/theme';
import { formatarDataPorExtenso } from '../utils/formatarData';
import { SelectionCircle } from './SelectionCircle';

type Props = {
  look: LookSalvo;
  onPress: () => void;
  /** Modo de seleção da galeria: mostra a bolinha e o toque marca o look. */
  selecionavel?: boolean;
  selecionado?: boolean;
};

/**
 * Peça que representa o look na lista: a de cima, ou o vestido. É a que mais
 * ajuda a reconhecer o look sem abri-lo.
 */
export function pecaPrincipal(look: LookSalvo) {
  return (
    look.pecas.find(
      (peca) => peca.papel === 'SUPERIOR' || peca.papel === 'PECA_UNICA',
    ) ?? look.pecas[0]
  );
}

/** Título do look, com um texto padrão para looks salvos sem nome. */
export function tituloDoLook(look: LookSalvo) {
  return look.nome ?? 'Look salvo';
}

/** Item da Galeria de Looks: foto da peça principal, título e data. */
export function LookSalvoItem({
  look,
  onPress,
  selecionavel = false,
  selecionado = false,
}: Props) {
  const peca = pecaPrincipal(look);
  const titulo = tituloDoLook(look);
  const data = formatarDataPorExtenso(look.criadoEm);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.item, selecionado && styles.itemSelected]}
      onPress={onPress}
      accessibilityRole={selecionavel ? 'checkbox' : 'button'}
      accessibilityState={selecionavel ? { checked: selecionado } : undefined}
      accessibilityLabel={data ? `${titulo}, salvo em ${data}` : titulo}
      accessibilityHint={selecionavel ? undefined : 'Abre as peças do look'}
    >
      {peca ? (
        <Image source={{ uri: peca.imagemUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photo} />
      )}

      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {titulo}
        </Text>

        {data ? <Text style={styles.date}>{data}</Text> : null}
      </View>

      {selecionavel ? (
        <SelectionCircle selected={selecionado} />
      ) : (
        // Seta: indica que o item abre.
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M9 5l7 7-7 7"
            stroke={theme.colors.cinzaClaro}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    paddingRight: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  // Além da bolinha, a borda marca o item selecionado.
  itemSelected: {
    borderColor: theme.colors.shadow,
    backgroundColor: 'rgba(222,0,81,0.14)',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  texts: {
    flex: 1,
  },
  title: {
    color: theme.colors.white,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  date: {
    marginTop: 2,
    color: theme.colors.cinzaClaro,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
});
