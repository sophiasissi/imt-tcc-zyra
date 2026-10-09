import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import GoogleIcon from '../../assets/icons/googleColor.svg';
import LoginLogo from '../../assets/images/login_logo.svg';
import EmailIcon from '../../assets/icons/email.svg';
import { AuthLayout } from '../components/AuthLayout';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { CaixaMarcacao } from '../components/CaixaMarcacao';
import { VERSAO_TERMOS } from '../constants/termos';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterStart'>;

export function RegisterStartScreen({ navigation }: Props) {
  // Aceite dos Termos (clickwrap): a conta só é criada com ele, e o back
  // guarda quando e qual versão foi aceita. A Política é para ler: ela
  // informa (LGPD, art. 9º), não pede consentimento.
  const [aceitou, setAceitou] = useState(false);
  return (
    <AuthLayout
      rolavel={false}
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
    >
      {/* A ilustração ocupa o espaço que sobra e encolhe em celular menor:
          o resto da tela sempre cabe sem rolar. */}
      <View style={styles.hero}>
        <LoginLogo width="100%" height="100%" />
      </View>
      <Text style={styles.welcome}>Bem vindo(a) ao</Text>
      <Text style={styles.brand}>ZYRA</Text>
      <View style={styles.aceite}>
        <CaixaMarcacao
          marcada={aceitou}
          onChange={setAceitou}
          accessibilityLabel="Li e aceito os Termos de uso e a Política de privacidade"
        >
          <Text style={styles.legal} onPress={() => setAceitou(!aceitou)}>
            Li e aceito os{' '}
            <Text
              accessibilityRole="link"
              style={styles.underline}
              onPress={() => navigation.navigate('TermosUso')}
            >
              Termos de uso
            </Text>{' '}
            e a{' '}
            <Text
              accessibilityRole="link"
              style={styles.underline}
              onPress={() => navigation.navigate('PoliticaPrivacidade')}
            >
              Política de privacidade
            </Text>
          </Text>
        </CaixaMarcacao>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.84}
        accessibilityState={{ disabled: !aceitou }}
        style={[styles.secondaryButton, !aceitou && styles.desativado]}
        disabled={!aceitou}
        onPress={() =>
          navigation.navigate('RegisterWelcome', { firstName: 'username' })
        }
      >
        <GoogleIcon width={20} height={20} />
        <Text style={styles.secondaryText}>Começar com Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.84}
        accessibilityState={{ disabled: !aceitou }}
        style={[styles.secondaryButton, !aceitou && styles.desativado]}
        disabled={!aceitou}
        onPress={() =>
          navigation.navigate('RegisterBasicInfo', {
            versaoTermosAceita: VERSAO_TERMOS,
          })
        }
      >
        <EmailIcon width={20} height={20} />
        <Text style={styles.secondaryText}>Começar com Email</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 29,
  },
  hero: {
    flex: 1,
    width: '100%',
    // Tamanho original do desenho (293 x 381): não passa disso em celular grande.
    maxHeight: 381,
    minHeight: 120,
    marginTop: 12,
    marginBottom: 24,
  },
  welcome: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 24,
    lineHeight: 29,
  },
  brand: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    marginBottom: 20,
  },
  aceite: {
    width: '100%',
    marginBottom: 22,
  },
  legal: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  desativado: {
    opacity: 0.5,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  secondaryButton: {
    width: '100%',
    height: 54,
    marginBottom: 18,
    borderRadius: 10,
    backgroundColor: theme.colors.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
});
