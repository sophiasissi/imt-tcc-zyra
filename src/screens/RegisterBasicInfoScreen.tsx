import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBasicInfo'>;

export function RegisterBasicInfoScreen({ navigation }: Props) {
  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterPassword')} />}
    >
      <ZyraInput label="Nome" autoCapitalize="words" />
      <ZyraInput label="Email" keyboardType="email-address" />
    </AuthLayout>
  );
}
