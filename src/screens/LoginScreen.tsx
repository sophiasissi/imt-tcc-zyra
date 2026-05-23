import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Entrar"
      onBack={() => navigation.goBack()}
      footer={<ZyraButton title="Entrar" onPress={() => {}} />}
    >
      <Text style={styles.logo}>ZYRA</Text>
      <TouchableOpacity activeOpacity={0.85} style={styles.googleButton}>
        <Text style={styles.googleText}>Entrar com Google</Text>
      </TouchableOpacity>
      <View style={styles.form}>
        <ZyraInput label="Email" keyboardType="email-address" />
        <ZyraInput label="Senha" secureTextEntry />
        <Text style={styles.forgot}>Esqueci minha senha</Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  logo: {
    textAlign: 'center',
    fontSize: 48,
    fontWeight: '900',
    color: '#000',
    marginBottom: 30,
  },
  googleButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  googleText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  form: {
    width: '100%',
  },
  forgot: {
    textAlign: 'right',
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
