import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterWelcome'>;

export function RegisterWelcomeScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title=""
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterBirthDate')} />}
    >
      <View style={styles.center}>
        <Text style={styles.logo}>ZYRA</Text>
        <View style={styles.person}>
          <View style={styles.hair} />
          <View style={styles.shirt} />
          <View style={styles.pants} />
          <View style={styles.shoes} />
        </View>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.welcome}>Bem vindo(a), {'<username>'}</Text>
        <Text style={styles.description}>Textinho legal. Que tal me contar um pouco sobre você?</Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
    marginBottom: 18,
  },
  person: {
    width: 150,
    height: 245,
    alignItems: 'center',
  },
  hair: {
    width: 82,
    height: 58,
    borderRadius: 32,
    backgroundColor: '#779600',
    transform: [{ rotate: '-16deg' }],
  },
  shirt: {
    width: 140,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#DD982D',
    marginTop: -3,
  },
  pants: {
    width: 92,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#C62B68',
    marginTop: -2,
  },
  shoes: {
    width: 130,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#18145C',
    marginTop: 8,
  },
  textBlock: {
    position: 'absolute',
    left: theme.spacing.screen,
    right: theme.spacing.screen,
    bottom: 92,
  },
  welcome: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
  },
});
