import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPassword'>;

export function RegisterPasswordScreen({ navigation }: Props) {
  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterWelcome')} />}
    >
      <ZyraInput label="Senha" secureTextEntry />
      <ZyraInput label="Confirmar senha" secureTextEntry />
    </AuthLayout>
  );
}
