import { StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LittleGuy from '../../assets/images/littleguy.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterWelcome'>;

export function RegisterWelcomeScreen({ navigation, route }: Props) {
  const firstName = route.params.firstName.trim() || 'usuário';

  return (
    <AuthLayout
      showHeader={false}
      contentStyle={styles.content}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterBirthDate')} />}
    >
      <Text style={styles.logo}>ZYRA</Text>
      <LittleGuy style={styles.character} />
      <Text style={styles.welcomeText}>Bem vindo(a), {firstName}</Text>
      <Text style={styles.description}>
        Que tal me contar um pouco sobre você?
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  logo: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.title,
    fontSize: 128,
    marginTop: 30,
  },
  character: {
    marginBottom: 26,
  },
  welcomeText: {
    alignSelf: 'flex-start',
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    alignSelf: 'flex-start',
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    lineHeight: 23,
  },
});
