import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import GoogleIcon from '../../assets/icons/googleColor.svg';
import LoginLogo from '../../assets/images/login_logo.svg';
import EmailIcon from '../../assets/icons/email.svg';
import { AuthLayout } from '../components/AuthLayout';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterStart'>;

export function RegisterStartScreen({ navigation }: Props) {
  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
    >
      <LoginLogo style={styles.hero} />
      <Text style={styles.welcome}>Bem vindo(a) ao</Text>
      <Text style={styles.brand}>ZYRA</Text>
      <Text style={styles.legal}>
        Ao criar uma conta, você declara que concorda com os{`\n`}
        nossos <Text style={styles.underline}>Termos</Text> e que leu a nossa{' '}
        <Text style={styles.underline}>Política de Privacidade</Text>
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.84}
        style={styles.secondaryButton}
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
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('RegisterBasicInfo')}
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
    marginBottom: 30,
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
  legal: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 29,
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
