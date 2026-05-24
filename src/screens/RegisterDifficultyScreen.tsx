import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterDifficulty'>;
const scores = [0, 1, 2, 3, 4, 5];

export function RegisterDifficultyScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<number>();

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <View>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.8}>
            <Text style={styles.skip}>Prefiro não dizer</Text>
          </TouchableOpacity>
          <ZyraButton title="Continuar" onPress={() => {}} />
        </View>
      }
    >
      <Text style={styles.question}>Quanta dificuldade você{`\n`}sente ao combinar roupas?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>
      <View style={styles.scale}>
        {scores.map((score) => (
          <TouchableOpacity
            key={score}
            accessibilityRole="button"
            accessibilityState={{ selected: selected === score }}
            activeOpacity={0.8}
            onPress={() => setSelected(score)}
            style={[styles.circle, selected === score && styles.selectedCircle]}
          >
            <Text style={[styles.circleText, selected === score && styles.selectedCircleText]}>{score}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Nenhuma dificuldade</Text>
        <Text style={styles.legendText}>-</Text>
        <Text style={styles.legendText}>Muita dificuldade</Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingBottom: 100,
  },
  question: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    lineHeight: 29,
    textAlign: 'center',
  },
  helper: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 11,
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
  circleText: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
  selectedCircleText: {
    color: theme.colors.white,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
    marginHorizontal: 7,
  },
  legendText: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.regular,
    fontSize: 11,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
