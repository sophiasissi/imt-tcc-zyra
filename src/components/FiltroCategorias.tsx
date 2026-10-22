import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Categoria, CATEGORIA_LABEL, Peca } from '../services/pecasApi';
import { theme } from '../styles/theme';

// Categorias do banco, na ordem da taxonomia (de cima para baixo no corpo:
// partes de cima, de baixo, vestido e calçados). Só aparecem as que a pessoa
// tem no armário.
const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[];

type Props = {
  pecas: Peca[];
  selecionadas: Categoria[];
  onChange: (categorias: Categoria[]) => void;
};

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Faixa de categorias do armário, rolando para o lado. Dá para marcar várias;
 * "Todas" limpa o filtro. Cada opção mostra quantas peças a pessoa tem dela.
 */
export function FiltroCategorias({ pecas, selecionadas, onChange }: Props) {
  function alternar(categoria: Categoria) {
    onChange(
      selecionadas.includes(categoria)
        ? selecionadas.filter((c) => c !== categoria)
        : [...selecionadas, categoria],
    );
  }

  const opcoes = [
    {
      chave: 'TODAS',
      texto: 'Todas',
      quantidade: pecas.length,
      marcada: selecionadas.length === 0,
      onPress: () => onChange([]),
    },
    ...CATEGORIAS.map((categoria) => ({
      chave: categoria,
      texto: capitalizar(CATEGORIA_LABEL[categoria]),
      quantidade: pecas.filter((peca) => peca.categoria === categoria).length,
      marcada: selecionadas.includes(categoria),
      onPress: () => alternar(categoria),
    })).filter(({ quantidade }) => quantidade > 0),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.lista}
      style={styles.faixa}
    >
      {opcoes.map(({ chave, texto, quantidade, marcada, onPress }) => (
        <TouchableOpacity
          key={chave}
          accessibilityRole="button"
          accessibilityState={{ selected: marcada }}
          accessibilityLabel={`${texto}, ${quantidade} ${quantidade === 1 ? 'peça' : 'peças'}`}
          activeOpacity={0.84}
          onPress={onPress}
          style={[styles.opcao, marcada && styles.opcaoMarcada]}
        >
          <Text style={[styles.texto, marcada && styles.textoMarcado]}>
            {texto} ({quantidade})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Sem flexShrink: 0, a faixa encolhia para dar espaço à grade de peças (com
  // o painel recolhido) e cortava a parte de baixo das opções.
  faixa: {
    flexGrow: 0,
    flexShrink: 0,
    marginTop: -12,
    marginBottom: 16,
  },
  lista: {
    gap: 8,
    paddingVertical: 1,
  },
  opcao: {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoMarcada: {
    backgroundColor: theme.colors.white,
  },
  texto: {
    color: theme.colors.white,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
  textoMarcado: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
  },
});
