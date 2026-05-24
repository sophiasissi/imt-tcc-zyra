import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterVerification'>;

export function RegisterVerificationScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Crie uma conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <ZyraButton
          title="Continuar"
          onPress={() => navigation.navigate('RegisterWelcome', { username: 'username' })}
        />
      }
    >
      <View>
        <Text style={styles.instructions}>Insira seu código</Text>
        <Text style={styles.helper}>Seu código foi enviado ao{`\n`}email do user</Text>
        <ZyraInput label="" keyboardType="number-pad" maxLength={4} />
        <TouchableOpacity accessibilityRole="button" activeOpacity={0.8}>
          <Text style={styles.resendText}>Você não recebeu nenhum código?</Text>
          <Text style={styles.resendAction}>Reenviar</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 84,
    // paddingLeft: 26, // Removed to inherit from AuthLayout
  },
  instructions: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    marginBottom: 6,
    marginTop: 70,
  },
  helper: {
    color: theme.colors.label,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 16,
  },
  resendText: {
    marginTop: 300,
    color: theme.colors.label,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  resendAction: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
});
