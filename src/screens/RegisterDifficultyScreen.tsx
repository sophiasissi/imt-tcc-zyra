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
        <View>
          <Text style={styles.skip}>Prefiro não dizer</Text>
          <ZyraButton title="Continuar" onPress={() => navigation.navigate('Login')} />
        </View>
      }
    >
      <Text style={styles.question}>Quanta dificuldade você sente ao combinar roupas?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor nosso público!</Text>
      <View style={styles.scale}>
        {numbers.map((number) => (
          <TouchableOpacity
            key={number}
            activeOpacity={0.85}
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
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    color: theme.colors.text,
    paddingHorizontal: 10,
  },
  helper: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.text,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 9,
    color: theme.colors.text,
    fontWeight: '700',
  },
  skip: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18,
  },
});
