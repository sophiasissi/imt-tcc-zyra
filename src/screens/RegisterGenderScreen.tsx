import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthLayout } from '../components/AuthLayout';
import { OptionPill } from '../components/OptionPill';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterGender'>;
type Gender = 'Masculino' | 'Feminino' | 'Não Binário' | undefined;

export function RegisterGenderScreen({ navigation }: Props) {
  const [gender, setGender] = useState<Gender>();

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <View>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RegisterColorBlindness')}
          >
            <Text style={styles.skip}>Prefiro não dizer</Text>
          </TouchableOpacity>
          <ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterColorBlindness')} />
        </View>
      }
    >
      <Text style={styles.question}>Como você se identifica?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>
      <View style={styles.row}>
        <OptionPill style={styles.option} label="Masculino" selected={gender === 'Masculino'} onPress={() => setGender('Masculino')} />
        <OptionPill style={styles.option} label="Feminino" selected={gender === 'Feminino'} onPress={() => setGender('Feminino')} />
      </View>
      <OptionPill style={styles.option} label="Não Binário" selected={gender === 'Não Binário'} onPress={() => setGender('Não Binário')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 70,
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
  row: {
    flexDirection: 'row',
    gap: 34,
    marginBottom: 20,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  option: {
      shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
