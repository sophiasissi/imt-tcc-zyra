import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterPassword'>;

export function RegisterPasswordScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Crie uma conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={<ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterVerification')} />}
    >
      <View style={styles.view}>
        <ZyraInput style={styles.input} label="Senha" secureTextEntry />
        <ZyraInput label="Confirmar Senha" secureTextEntry />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 102,
  },
  input: {
    marginBottom: 4,
  },
  view: {
    marginTop: 40,
  },
});
