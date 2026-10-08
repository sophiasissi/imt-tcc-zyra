import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import LittleGuy from '../../assets/images/littleguy.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterWelcome'>;

export function RegisterWelcomeScreen({ navigation, route }: Props) {
  const firstName = route.params.firstName?.trim() || 'usuário';

  function handleContinue() {
    console.log('[Onboarding] Saindo das boas-vindas.');

    navigation.navigate('RegisterBirthDate');
  }

  return (
    <AuthLayout
      rolavel={false}
      showHeader={false}
      contentStyle={styles.content}
      footer={<ZyraButton title="Continuar" onPress={handleContinue} />}
    >
      <Text style={styles.logo}>ZYRA</Text>
      {/* O boneco ocupa o espaço que sobra e encolhe em celular menor. */}
      <View style={styles.character}>
        <LittleGuy width="100%" height="100%" />
      </View>
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
    // Em celular grande, a sobra fica dividida em cima e embaixo.
    justifyContent: 'center',
  },
  logo: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.title,
    fontSize: 128,
    marginTop: 30,
  },
  character: {
    flex: 1,
    width: '100%',
    // Tamanho original do desenho (242 x 463).
    maxHeight: 463,
    minHeight: 140,
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
    // Distância até o botão Continuar.
    marginBottom: 24,
  },
});
