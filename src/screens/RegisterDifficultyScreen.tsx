import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterDifficulty'>;

const numbers = [0, 1, 2, 3, 4, 5];

export function RegisterDifficultyScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={
        <>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Intro')}
          >
            <Text style={styles.skip}>Prefiro não dizer</Text>
          </TouchableOpacity>
          <ZyraButton
            title="Continuar"
            disabled={selected === null}
            onPress={() => navigation.navigate('Intro')}
          />
        </>
      }
    >
      <Text style={styles.question}>Quanta dificuldade você sente ao combinar roupas?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>

      <View style={styles.scale}>
        {numbers.map((number) => (
          <TouchableOpacity
            key={number}
            accessibilityRole="button"
            activeOpacity={0.82}
            onPress={() => setSelected(number)}
            style={[styles.circle, selected === number && styles.selectedCircle]}
          >
            <Text style={[styles.number, selected === number && styles.selectedNumber]}>{number}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.captionRow}>
        <Text style={styles.caption}>Nenhuma dificuldade</Text>
        <Text style={styles.caption}>Muita dificuldade</Text>
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
    lineHeight: 29,
    textAlign: 'center',
  },
  helper: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    backgroundColor: theme.colors.primary,
  },
  number: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  selectedNumber: {
    color: theme.colors.white,
  },
  captionRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 11,
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
