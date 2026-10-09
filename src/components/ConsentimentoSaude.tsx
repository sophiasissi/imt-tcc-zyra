import { StyleSheet, Text, View } from 'react-native';

import { CaixaMarcacao } from './CaixaMarcacao';

import { theme } from '../styles/theme';

type Props = {
  aceito: boolean;
  onChange: (aceito: boolean) => void;
  /** Abre a Política de privacidade. */
  onVerPolitica: () => void;
};

/**
 * Autorização para guardar o tipo de daltonismo, que é dado de saúde (dado
 * pessoal sensível, LGPD art. 5º, II). A lei pede consentimento específico e
 * destacado, para uma finalidade definida (art. 11, I): por isso a caixa
 * separada, o texto dizendo para que o dado serve e a marcação explícita, que
 * nunca vem marcada.
 *
 * Se mudar a finalidade aqui, mude também a Política de privacidade.
 */
export function ConsentimentoSaude({ aceito, onChange, onVerPolitica }: Props) {
  return (
    <View style={styles.caixa}>
      <Text style={styles.titulo}>Autorização para dado de saúde</Text>

      <Text style={styles.texto}>
        O tipo de daltonismo é um dado de saúde. Ele fica guardado no seu perfil
        e é usado só para entendermos melhor quem usa o ZYRA. Você pode mudar ou
        apagar essa resposta quando quiser, em Configurações {'>'} Informações
        pessoais.
      </Text>

      <View style={styles.marcacao}>
        <CaixaMarcacao
          marcada={aceito}
          onChange={onChange}
          accessibilityLabel="Autorizo o ZYRA a guardar meu tipo de daltonismo para essa finalidade"
        >
          <Text style={styles.rotulo} onPress={() => onChange(!aceito)}>
            Autorizo o ZYRA a guardar meu tipo de daltonismo para essa
            finalidade.
          </Text>
        </CaixaMarcacao>
      </View>

      <Text
        accessibilityRole="link"
        style={styles.link}
        onPress={onVerPolitica}
      >
        Ler a Política de privacidade
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    padding: 14,
  },
  titulo: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    marginBottom: 6,
  },
  texto: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  marcacao: {
    marginTop: 12,
  },
  rotulo: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  link: {
    color: theme.colors.link,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    textDecorationLine: 'underline',
    marginTop: 6,
  },
});
