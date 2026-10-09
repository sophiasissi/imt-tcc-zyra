import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  ItemPagina,
  PaginaConfiguracoes,
  ParagrafoPagina,
  SecaoPagina,
} from '../components/PaginaConfiguracoes';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { expo } from '../../app.json';

type Props = NativeStackScreenProps<RootStackParamList, 'Acessibilidade'>;

/** Atualize ao revisar o conteúdo desta página. */
const REVISADO_EM = 'outubro de 2026';

/**
 * Declaração de acessibilidade do ZYRA, no formato recomendado pelo W3C
 * (https://www.w3.org/WAI/planning/statements/): compromisso, recursos,
 * padrão de referência, limitações conhecidas, versão e data. Só o que
 * interessa a quem usa o app (revisão da Sophia em 09/10/2026).
 *
 * Falta o contato para relatar problemas, que o W3C pede: a Sophia vai
 * definir o e-mail depois (08/10/2026).
 *
 * As limitações vêm das avaliações reais da câmera (ver CLAUDE.md da visão).
 * Ao corrigir uma delas, tire-a daqui.
 */
export function AcessibilidadeScreen({ navigation }: Props) {
  return (
    <PaginaConfiguracoes
      title="Acessibilidade no ZYRA"
      onBack={() => navigation.goBack()}
    >
      <ParagrafoPagina>
        O ZYRA foi feito para pessoas com daltonismo. Nosso compromisso é que
        ninguém precise enxergar uma cor para saber qual ela é ou para usar o
        aplicativo.
      </ParagrafoPagina>

      <SecaoPagina titulo="O que o ZYRA faz">
        <ItemPagina>
          A cor nunca aparece só como cor: vem sempre com o nome escrito e o
          símbolo ColorADD.
        </ItemPagina>
        <ItemPagina>
          Botões, peças e símbolos têm descrição para leitores de tela, como o
          VoiceOver (iPhone) e o TalkBack (Android).
        </ItemPagina>
        <ItemPagina>
          Textos e símbolos usam alto contraste, para serem fáceis de ler.
        </ItemPagina>
        <ItemPagina>
          Para cadastrar uma peça, basta fotografá-la: o app identifica a cor e
          o tipo de roupa.
        </ItemPagina>
        <ItemPagina>
          A câmera avisa quando a luz está fraca ou forte demais para ler a cor
          com segurança.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Padrões que seguimos">
        <ParagrafoPagina>
          Seguimos as diretrizes internacionais de acessibilidade (WCAG 2.2).
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Limitações conhecidas">
        <ItemPagina>
          Luz amarelada ou fraca pode mudar a cor que a câmera lê (por exemplo,
          azul-marinho lido como cinza). Prefira luz natural.
        </ItemPagina>
        <ItemPagina>
          Tons muito escuros, como azul-marinho e verde-oliva, podem aparecer
          como preto ou cinza.
        </ItemPagina>
        <ItemPagina>
          Em peças estampadas ou de duas cores, o app mostra só a cor principal.
        </ItemPagina>
        <ItemPagina>
          A cor identificada é uma estimativa. Na dúvida, confira com outra luz.
        </ItemPagina>
      </SecaoPagina>

      <Text style={styles.rodape}>
        Versão {expo.version} · Revisado em {REVISADO_EM}
      </Text>
    </PaginaConfiguracoes>
  );
}

const styles = StyleSheet.create({
  rodape: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
});
