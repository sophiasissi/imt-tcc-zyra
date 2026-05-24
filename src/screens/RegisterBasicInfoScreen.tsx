import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraInput } from '../components/ZyraInput';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBasicInfo'>;

export function RegisterBasicInfoScreen({ navigation }: Props) {
  return (
    <AuthLayout
      title="Crie uma conta"
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footerButtonTitle="Continuar"
      onFooterButtonPress={() => navigation.navigate('RegisterPassword')}
    >
      <View style={styles.view}>
        <ZyraInput style={styles.input} label="Nome" autoCapitalize="words" />
        <ZyraInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
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
