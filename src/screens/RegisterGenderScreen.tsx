import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { GeneroCadastro, RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { OptionPill } from '../components/OptionPill';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterGender'>;

type GenderOption = {
  label: string;
  value: GeneroCadastro;
};

const options: GenderOption[] = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Não Binário', value: 'NAO_BINARIO' },
];

export function RegisterGenderScreen({ navigation, route }: Props) {
  const { dataNascimento } = route.params;

  const [selected, setSelected] = useState<GeneroCadastro | null>(null);

  function handleContinue() {
    if (!selected) {
      return;
    }

    console.log('[Onboarding] Gênero selecionado:', selected);

    navigation.navigate('RegisterColorBlindness', {
      dataNascimento,
      genero: selected,
    });
  }

  function handleSkip() {
    console.log('[Onboarding] Usuário preferiu não informar gênero.');

    navigation.navigate('RegisterColorBlindness', {
      dataNascimento,
      genero: 'PREFIRO_NAO_DIZER',
    });
  }

  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={
        <View>
          <Text onPress={handleSkip} style={styles.skip}>
            Prefiro não dizer
          </Text>

          <ZyraButton
            title="Continuar"
            disabled={selected === null}
            onPress={handleContinue}
          />
        </View>
      }
    >
      <Text style={styles.question}>Como você se identifica?</Text>

      <Text style={styles.helper}>
        Isso permitirá entender melhor{`\n`}nosso público!
      </Text>

      <View style={styles.options}>
        {options.map((option) => (
          <OptionPill
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            onPress={() => setSelected(option.value)}
          />
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
