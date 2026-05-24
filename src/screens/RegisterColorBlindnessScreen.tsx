import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'RegisterColorBlindness'
>;
const options = [
  'Protanomalia',
  'Protanopia',
  'Deuteranomalia',
  'Deuteranopia',
  'Tritanomalia',
  'Tritanopia',
  'Acromatopsia',
  'Não sei',
];

export function RegisterColorBlindnessScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function choose(option: string) {
    setSelected(option);
    setOpen(false);
  }

  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={
        <View>
          <Text
            onPress={() => navigation.navigate('RegisterDifficulty')}
            style={styles.skip}
          >
            Não tenho!
          </Text>
          <ZyraButton
            title="Continuar"
            disabled={selected === null}
            onPress={() => navigation.navigate('RegisterDifficulty')}
          />
        </View>
      }
    >
      <Text style={styles.question}>Qual tipo de daltonismo você tem?</Text>
      <Text style={styles.helper}>
        Isso permitirá entender melhor{`\n`}nosso público!
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.select}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectText}>
          {selected ?? 'Selecione uma opção'}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => choose(option)}
              >
                <Text style={styles.modalText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  select: {
    height: 54,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    textAlign: 'center',
  },
  selectText: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
  skip: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
   chevron: { fontSize: 24, color: theme.colors.text, marginTop: -8 },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
  },
  modalText: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
});
