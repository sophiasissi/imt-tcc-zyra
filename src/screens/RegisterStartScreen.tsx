import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';
import LoginLogo from '../../assets/images/login_logo.svg';
import BackIcon from '../../assets/icons/back-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterStart'>;

export function RegisterStartScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        style={styles.backButton}
      >
        <BackIcon width={32} height={32} style={styles.backIcon} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.artwork}>
          <LoginLogo style={styles.logoSvg} />
        </View>
        <Text style={styles.title}>Bem vindo(a) ao</Text>
        <Text style={styles.titleAccent}>ZYRA</Text>
        <Text style={styles.description}>
          Ao criar uma conta, você declara que concorda com os nossos Termos e que leu nossa Política de Privacidade.
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.googleButton}>
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleText}>Começar com Google</Text>
        </TouchableOpacity>
        <ZyraButton
          title="Começar com Email/Telefone"
          onPress={() => navigation.navigate('RegisterBasicInfo')}
        />
        <Text onPress={() => navigation.navigate('Login')} style={styles.login}>Já tenho conta</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.screen,
    paddingTop: 12,
  },
  artwork: {
    width: 260,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  logoSvg: {
    width: 260,
    height: 340,
  },
  title: {
    marginTop: 50,
    color: '#000000',
    fontSize: 20,
    fontFamily: theme.fonts.regular,
  },
  titleAccent: {
    color: '#000000',
    fontSize: 20,
    fontFamily: theme.fonts.bold,
  },
  description: {
    marginTop: 20,
    color: theme.colors.gray,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 28,
    gap: 14,
  },
  googleButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
    gap: 10,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  googleIconText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  googleText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  login: {
    textAlign: 'center',
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
