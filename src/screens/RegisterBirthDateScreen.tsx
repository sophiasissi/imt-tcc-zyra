import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBirthDate'>;

export function RegisterBirthDateScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterGender')} />}
    >
      <Text style={styles.question}>Qual sua data de Nascimento?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor nosso público!</Text>
      <TouchableOpacity activeOpacity={0.85} style={styles.dateButton}>
        <Text style={styles.dateText}>1 de Abril de 2004</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  question: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.text,
  },
  helper: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.text,
  },
  dateButton: {
    height: 54,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
});
