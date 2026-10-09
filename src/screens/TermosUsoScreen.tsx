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
import { VERSAO_TERMOS_POR_EXTENSO } from '../constants/termos';

type Props = NativeStackScreenProps<RootStackParamList, 'TermosUso'>;

/**
 * Termos de uso. Rascunho escrito em 09/10/2026; precisa da revisão da Sophia
 * e do Gustavo. O cadastro (RegisterStartScreen) diz que a pessoa concorda
 * com eles.
 */
export function TermosUsoScreen({ navigation }: Props) {
  return (
    <PaginaConfiguracoes
      title="Termos de uso"
      onBack={() => navigation.goBack()}
    >
      <SecaoPagina titulo="O que é o ZYRA">
        <ParagrafoPagina>
          O ZYRA é um aplicativo gratuito que ajuda pessoas com daltonismo a
          identificar cores e combinar roupas. É um Trabalho de Conclusão de
          Curso de Ciência da Computação do Instituto Mauá de Tecnologia,
          desenvolvido por Gustavo Coutinho Arruda e Sophia Sissi Curcio Guedes.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Sua conta">
        <ItemPagina>Use informações verdadeiras no cadastro.</ItemPagina>
        <ItemPagina>
          Guarde sua senha com cuidado: o que for feito com ela é de sua
          responsabilidade.
        </ItemPagina>
        <ItemPagina>
          Você pode excluir sua conta quando quiser, em Configurações {'>'}{' '}
          Excluir conta.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="O que você pode enviar">
        <ItemPagina>
          Fotos de roupas e calçados, para montar seu armário.
        </ItemPagina>
        <ItemPagina>
          Não envie fotos de pessoas nem conteúdo ofensivo, ilegal ou que não
          seja seu.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Cores e sugestões são estimativas">
        <ParagrafoPagina>
          A cor identificada pela câmera e os looks sugeridos são calculados
          pelo app e podem errar, principalmente com pouca luz ou luz amarelada.
          Na dúvida, confira a cor com outra luz. O ZYRA não faz diagnóstico de
          daltonismo nem substitui uma avaliação médica.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="ColorADD">
        <ParagrafoPagina>
          Os símbolos de cor são do código ColorADD, criado por Miguel Neiva e
          usado no ZYRA com autorização do autor. Os direitos sobre o código são
          do ColorADD.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Disponibilidade">
        <ParagrafoPagina>
          Por ser um projeto acadêmico, o ZYRA pode mudar, ficar fora do ar ou
          ser encerrado. Se for encerrado, os dados guardados serão apagados.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Privacidade">
        <ParagrafoPagina>
          Como tratamos seus dados está na Política de privacidade, em
          Configurações {'>'} Política de privacidade.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Mudanças nestes termos">
        <ParagrafoPagina>
          Se estes termos mudarem, a nova versão aparece aqui, com a data
          atualizada.
        </ParagrafoPagina>
      </SecaoPagina>

      <Text style={styles.rodape}>Versão de {VERSAO_TERMOS_POR_EXTENSO}</Text>
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
