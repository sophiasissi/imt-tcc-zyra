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
          <Text onPress={() => navigation.navigate('RegisterColorBlindness')} style={styles.skip}>
            Prefiro não dizer
          </Text>
          <ZyraButton
            title="Continuar"
            disabled={selected === null}
            onPress={() => navigation.navigate('RegisterColorBlindness')}
          />
        </View>
      }
    >
      <Text style={styles.question}>Como você se identifica?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>
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
    marginTop: 200,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
  },
  helper: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 15,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
