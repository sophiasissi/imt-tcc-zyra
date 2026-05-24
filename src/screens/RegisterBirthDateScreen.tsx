import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBirthDate'>;

export function RegisterBirthDateScreen({ navigation }: Props) {
  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterGender')} />}
    >
      <Text style={styles.question}>Qual sua data de nascimento?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} style={styles.dateButton}>
        <Text style={styles.dateText}>1 de Abril de 2004</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingBottom: 113,
  },
  question: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
  },
  helper: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  dateButton: {
    height: 56,
    borderRadius: 10,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dateText: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
});
