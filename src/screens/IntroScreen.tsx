import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';

export function IntroScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/yellowTshirt.png')}
        style={styles.yellowTshirt}
      />
      <Image
        source={require('../../assets/images/blueSkirt.png')}
        style={styles.blueSkirt}
      />
      <Image
        source={require('../../assets/images/pinkPants.png')}
        style={styles.pinkPants}
      />

      <Text style={styles.logo}>ZYRA</Text>

      <Text style={styles.subtitle}>Monte looks com confiança, todos os dias</Text>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Começar agora</Text>
      </TouchableOpacity>

      <TouchableOpacity>
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
    fontSize: 20,
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
    fontSize: 20,
  },
  loginText: {
    color: '#000000',
    fontFamily: theme.fonts.bold,
    fontSize: 20,
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
