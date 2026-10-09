import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { LOGO_COLORADD_HORIZONTAL } from '../utils/logoColorAddHorizontal';

import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';
import ArrowRightIcon from '../../assets/icons/right-arrow-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'SobreColorAdd'>;

const SITE_COLORADD = 'https://www.coloradd.net/pt';
const EMAIL_COLORADD = 'info@coloradd.net';

async function abrir(url: string) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('[Sobre o ColorADD] Falha ao abrir:', url, error);
  }
}

/**
 * Página institucional do ColorADD, aberta em Configurações > Acessibilidade.
 *
 * Complementa a tela do botão da Home (ColorAddScreen), que ensina a ler os
 * símbolos: aqui fica quem criou o código, como o ZYRA o usa, o que o
 * ColorADD diz sobre si e os contatos. Os textos de responsabilidade social e
 * reconhecimento vêm da seção "Sobre" do app oficial (prints em assets/print),
 * adaptados para o português do Brasil.
 */
export function SobreColorAddScreen({ navigation }: Props) {
  return (
    <PaginaConfiguracoes
      title="Sobre o ColorADD"
      onBack={() => navigation.goBack()}
    >
      <Image
        source={LOGO_COLORADD_HORIZONTAL}
        fadeDuration={0}
        style={styles.logo}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Logo ColorADD: A Cor é para Todos"
      />

      <ParagrafoPagina>
        O ColorADD é o alfabeto das cores: um código de símbolos que permite a
        quem é daltônico identificar as cores. Foi criado pelo designer
        português Miguel Neiva e é uma linguagem universal, inclusiva e não
        discriminatória.
      </ParagrafoPagina>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Aprenda a ler os símbolos"
        accessibilityHint="Abre o guia dos símbolos ColorADD"
        activeOpacity={0.85}
        style={styles.guia}
        onPress={() => navigation.navigate('ColorAdd')}
      >
        <LogoColorADD width={44} height={38} />

        <View style={styles.guiaTextos}>
          <Text style={styles.guiaTitulo}>Aprenda a ler os símbolos</Text>
          <Text style={styles.guiaDescricao}>
            Como três símbolos formam toda a paleta de cores.
          </Text>
        </View>

        <ArrowRightIcon width={16} height={16} />
      </TouchableOpacity>

      <SecaoPagina titulo="O ColorADD no ZYRA">
        <ParagrafoPagina>
          Os autores do ZYRA conversaram com Miguel Neiva, criador do ColorADD,
          que autorizou o uso do código no aplicativo.
        </ParagrafoPagina>

        <ItemPagina>
          Na câmera, cada cor identificada aparece com o nome escrito e o
          símbolo.
        </ItemPagina>
        <ItemPagina>
          No armário e nos looks, toda peça mostra a cor por escrito, com o
          símbolo ao lado.
        </ItemPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Responsabilidade social">
        <ParagrafoPagina>
          Por meio de um modelo de licenciamento de baixo custo, o ColorADD foi
          testado e validado em diversas implementações, garantindo
          acessibilidade igual para todos. As implementações são pensadas para a
          população em geral, e não só para quem é daltônico:{' '}
          <Text style={paginaStyles.destaque}>incluir sem discriminar.</Text>
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Reconhecimento">
        <ParagrafoPagina>
          O código é usado em setores como materiais didáticos e jogos,
          transportes públicos e mobilidade, meio ambiente, espaços públicos,
          hospitais e serviços de saúde, comunicação digital e{' '}
          <Text style={paginaStyles.destaque}>têxtil e vestuário</Text>, o mesmo
          do ZYRA.
        </ParagrafoPagina>
        <ParagrafoPagina>
          O ColorADD é reconhecido pelas comunidades científica, acadêmica,
          corporativa e institucional, e foi notícia no mundo todo.
        </ParagrafoPagina>
      </SecaoPagina>

      <SecaoPagina titulo="Contato do ColorADD">
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Site do ColorADD: www.coloradd.net"
          activeOpacity={0.8}
          style={styles.contato}
          onPress={() => abrir(SITE_COLORADD)}
        >
          <Text style={styles.contatoRotulo}>Site</Text>
          <Text style={styles.contatoValor}>www.coloradd.net</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel={`E-mail do ColorADD: ${EMAIL_COLORADD}`}
          activeOpacity={0.8}
          style={styles.contato}
          onPress={() => abrir(`mailto:${EMAIL_COLORADD}`)}
        >
          <Text style={styles.contatoRotulo}>E-mail</Text>
          <Text style={styles.contatoValor}>{EMAIL_COLORADD}</Text>
        </TouchableOpacity>
      </SecaoPagina>

      <Text style={styles.slogan}>A COR É PARA TODOS!</Text>

      <Text style={styles.credito}>
        ColorADD © Miguel Neiva. Usado no ZYRA com autorização do autor.
      </Text>
    </PaginaConfiguracoes>
  );
}

const styles = StyleSheet.create({
  // Margem em volta do logo (o PNG foi recortado rente ao desenho).
  logo: {
    width: 240,
    height: 240 * (273 / 720),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 26,
  },
  guia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  guiaTextos: {
    flex: 1,
  },
  guiaTitulo: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  guiaDescricao: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  contato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  contatoRotulo: {
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  contatoValor: {
    color: theme.colors.link,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  slogan: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 34,
  },
  credito: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
