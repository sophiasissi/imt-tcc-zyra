import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import BlueSkirt from '../../assets/images/blueSkirt.svg';
import PinkPants from '../../assets/images/pinkPants.svg';
import YellowTshirt from '../../assets/images/yellowTshirt.svg';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { ZyraButton } from '../components/ZyraButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

export function IntroScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <YellowTshirt style={styles.yellowTshirt} />
      <BlueSkirt style={styles.blueSkirt} />
      <PinkPants style={styles.pinkPants} />

      <Text style={styles.logo}>ZYRA</Text>

      <View style={styles.actions}>
        <Text style={styles.subtitle}>Monte looks com confiança, todos os dias</Text>
        <ZyraButton title="Começar agora" onPress={() => navigation.navigate('RegisterStart')} />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Entrar"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
          style={styles.loginButton}
        >
          <Text style={styles.loginText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  yellowTshirt: {
    position: 'absolute',
    top: 0,
    right: 120,
  },
  blueSkirt: {
    position: 'absolute',
    top: 350,
    left: 0,
  },
  pinkPants: {
    position: 'absolute',
    top: 420,
    right: 0,
  },
  logo: {
    position: 'absolute',
    top: '39%',
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.title,
    fontSize: 128,
    lineHeight: 112,
  },
  actions: {
    position: 'absolute',
    left: theme.spacing.screen,
    right: theme.spacing.screen,
    bottom: 40,
    alignItems: 'center',
  },
  subtitle: {
    marginBottom: 39,
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 18,
    lineHeight: 29,
    textAlign: 'center',
    width: 280,
  },
  loginButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  loginText: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    marginTop: 10,
  },
});
