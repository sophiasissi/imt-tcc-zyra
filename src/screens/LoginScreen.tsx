import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import GoogleIcon from '../../assets/icons/googleColor.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Entrar na conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={<ZyraButton title="Entrar" onPress={() => {}} />}
    >
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} style={styles.googleButton}>
        <GoogleIcon width={20} height={20} />
        <Text style={styles.googleText}>Entrar com Google</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.or}>ou</Text>
        <View style={styles.divider} />
      </View>

      <ZyraInput label="Email" autoCapitalize="none" keyboardType="email-address" />
      <ZyraInput label="Senha" secureTextEntry />

      <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.forgotButton}>
        <Text style={styles.forgot}>esqueceu sua senha?</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 34,
  },
  googleButton: {
    height: 58,
    borderRadius: theme.radius.input,
    backgroundColor: theme.colors.input,
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 27,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  googleText: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 19,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  or: {
    color: theme.colors.muted2,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -10,
  },
  forgot: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
});
