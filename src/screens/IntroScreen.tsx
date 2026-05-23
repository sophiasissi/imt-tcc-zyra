import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import YellowTshirt from '../../assets/images/yellowTshirt.svg';
import BlueSkirt from '../../assets/images/blueSkirt.svg';
import PinkPants from '../../assets/images/pinkPants.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

export function IntroScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <YellowTshirt style={styles.yellowTshirt} />
      <BlueSkirt style={styles.blueSkirt} />
      <PinkPants style={styles.pinkPants} />

      <Text style={styles.logo}>ZYRA</Text>

      <Text style={styles.subtitle}>
        Monte looks com confiança, todos os dias
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('RegisterStart')}
      >
        <Text style={styles.primaryButtonText}>Começar agora</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 56,
  },
  logo: {
    position: 'absolute',
    top: '38%',
    fontSize: 128,
    fontFamily: theme.fonts.title,
    color: '#000000',
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 42,
    width: 315,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#AB003E',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  loginText: {
    color: '#000000',
    fontFamily: theme.fonts.bold,
    fontSize: 18,
  },
  yellowTshirt: {
    position: 'absolute',
    top: 0,
  },
  blueSkirt: {
    position: 'absolute',
    left: 0,
    top: 320,
  },
  pinkPants: {
    position: 'absolute',
    right: 0,
    top: 380,
  },
});
