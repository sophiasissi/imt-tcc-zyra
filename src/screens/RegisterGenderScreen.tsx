import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { OptionPill } from '../components/OptionPill';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterGender'>;

const options = ['Masculino', 'Feminino', 'Não Binário'];

export function RegisterGenderScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={
        <View>
          <Text onPress={() => navigation.navigate('RegisterColorBlindness')} style={styles.skip}>Prefiro não dizer</Text>
          <ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterColorBlindness')} />
        </View>
      }
    >
      <Text style={styles.question}>Como você se identifica?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor nosso público!</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <OptionPill key={option} label={option} selected={selected === option} onPress={() => setSelected(option)} />
        ))}
      </View>
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  skip: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18,
  },
});
