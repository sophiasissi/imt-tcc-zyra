import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  ItemPagina,
  PaginaConfiguracoes,
  ParagrafoPagina,
  SecaoPagina,
  paginaStyles,
} from '../components/PaginaConfiguracoes';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { VERSAO_TERMOS_POR_EXTENSO } from '../constants/termos';

type Props = NativeStackScreenProps<RootStackParamList, 'PoliticaPrivacidade'>;

/**
 * Política de privacidade (LGPD). Rascunho escrito em 09/10/2026 a partir do
 * que o código faz de verdade; precisa da revisão da Sophia e do Gustavo.
 *
 * Cada frase descreve um fluxo real. Ao mudar um fluxo, mude a frase:
 *  - senha: só no Cognito (AWS), nunca no banco;
 *  - fotos das peças: S3 privado (AWS, us-east-2), exibidas por URL assinada;
 *    o tipo, o estilo e a estampa saem do gpt-4.1-mini (OpenAI), na visão;
 *  - câmera: o quadro vai para a API de visão e não é guardado;
 *  - chat: o texto vai para a OpenAI (back, interpretar-pedido) e não é
 *    guardado nem registrado em log; só os looks salvos ficam no banco;
 *  - tipo de daltonismo: só com consentimento (ConsentimentoSaude e
 *    UsersService.consentimentoParaSalvar).
 *
 * Falta o contato do encarregado (LGPD art. 41) para pedidos que o app ainda
 * não atende sozinho, como a portabilidade.
 */
export function PoliticaPrivacidadeScreen({ navigation }: Props) {
  return (
    <PaginaConfiguracoes
      title="Política de privacidade"
      onBack={() => navigation.goBack()}
    >
      <ParagrafoPagina>
        Esta política explica quais dados o ZYRA guarda, para quê e como você
        controla esses dados, conforme a Lei Geral de Proteção de Dados (LGPD,
        Lei nº 13.709/2018).
      </ParagrafoPagina>

      <SecaoPagina titulo="Quem cuida dos seus dados">
        <ParagrafoPagina>
          O ZYRA é um Trabalho de Conclusão de Curso de Ciência da Computação do
          Instituto Mauá de Tecnologia, desenvolvido por Gustavo Coutinho Arruda
          e Sophia Sissi Curcio Guedes, que são os responsáveis pelo tratamento
          dos seus dados.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Quais dados guardamos">
        <ItemPagina>
          <Text style={paginaStyles.destaque}>Cadastro:</Text> nome, e-mail,
          data de nascimento e gênero. A senha fica só no serviço de login da
          Amazon Web Services (AWS); nós nunca temos acesso a ela.
        </ItemPagina>
        <ItemPagina>
          <Text style={paginaStyles.destaque}>Tipo de daltonismo:</Text> é um
          dado de saúde, que a LGPD considera sensível. Só é guardado se você
          autorizar. Você também pode responder &quot;Prefiro não dizer&quot;.
        </ItemPagina>
        <ItemPagina>
          <Text style={paginaStyles.destaque}>
            Dificuldade para combinar roupas
          </Text>
          , de 0 a 5, se você responder.
        </ItemPagina>
        <ItemPagina>
          <Text style={paginaStyles.destaque}>Seu armário:</Text> as fotos das
          peças que você cadastra e o que o app identifica nelas (cor, tipo,
          estilo, estampa e ocasiões).
        </ItemPagina>
        <ItemPagina>
          <Text style={paginaStyles.destaque}>Looks salvos</Text> por você.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="O que não guardamos">
        <ItemPagina>
          As imagens da câmera de identificação de cor: são analisadas na hora e
          descartadas.
        </ItemPagina>
        <ItemPagina>
          As mensagens que você escreve para o assistente: são usadas só para
          montar o look pedido, sem ficar registradas.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Para que usamos">
        <ItemPagina>
          Fazer o app funcionar: entrar na sua conta, montar seu armário,
          identificar cores e sugerir looks com as suas peças.
        </ItemPagina>
        <ItemPagina>
          Entender melhor quem usa o ZYRA, na pesquisa do TCC: idade, gênero,
          tipo de daltonismo (se autorizado) e dificuldade para combinar roupas.
        </ItemPagina>
        <ItemPagina>Proteger sua conta.</ItemPagina>
        <ParagrafoPagina>Não vendemos seus dados.</ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Com quem compartilhamos">
        <ItemPagina>
          <Text style={paginaStyles.destaque}>Amazon Web Services (AWS):</Text>{' '}
          serviço de login e armazenamento das fotos das peças, em servidores
          nos Estados Unidos. As fotos ficam num armazenamento privado e só
          aparecem no app por links temporários.
        </ItemPagina>
        <ItemPagina>
          <Text style={paginaStyles.destaque}>OpenAI:</Text> recebe a foto de
          cada peça cadastrada, para identificar tipo, estilo e estampa, e o
          texto dos seus pedidos ao assistente. Os servidores ficam nos Estados
          Unidos. Segundo a política da OpenAI para esse tipo de uso, esses
          dados não são usados para treinar os modelos dela.
        </ItemPagina>
        <ParagrafoPagina>
          Como esses serviços ficam fora do Brasil, há transferência
          internacional de dados, permitida pela LGPD (art. 33) para a prestação
          do serviço que você pediu.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Por quanto tempo">
        <ParagrafoPagina>
          Enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil,
          suas peças com as fotos e seus looks salvos.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Seus direitos">
        <ParagrafoPagina>
          A LGPD (art. 18) garante que você pode, a qualquer momento:
        </ParagrafoPagina>
        <ItemPagina>
          Ver e corrigir seus dados, em Configurações {'>'} Informações pessoais
          e no seu armário.
        </ItemPagina>
        <ItemPagina>
          Retirar a autorização do dado de saúde: em Informações pessoais,
          escolha &quot;Prefiro não dizer&quot; no tipo de daltonismo. O dado e
          a autorização são apagados.
        </ItemPagina>
        <ItemPagina>
          Apagar tudo, em Configurações {'>'} Excluir conta.
        </ItemPagina>
        <ItemPagina>
          Saber com quem seus dados são compartilhados, nesta página.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Mudanças nesta política">
        <ParagrafoPagina>
          Se esta política mudar, a nova versão aparece aqui, com a data
          atualizada. Mudanças no uso do dado de saúde pedem uma nova
          autorização.
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
