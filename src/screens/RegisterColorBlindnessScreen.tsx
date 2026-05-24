import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import DownArrow from '../../assets/icons/downArrow.svg';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterColorBlindness'>;

const options = [
  'Protanomalia',
  'Protanopia',
  'Deuteranomalia',
  'Deuteranopia',
  'Tritanomalia',
  'Tritanopia',
  'Acromatopsia',
  'Não Sei',
];

export function RegisterColorBlindnessScreen({ navigation }: Props) {
  const [selected, setSelected] = useState('Protanomalia');
  const [open, setOpen] = useState(false);

  const choose = (option: string) => {
    setSelected(option);
    setOpen(false);
  };

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      contentStyle={styles.content}
      footer={
        <View>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RegisterDifficulty')}
          >
            <Text style={styles.skip}>Não tenho!</Text>
          </TouchableOpacity>
          <ZyraButton title="Continuar" onPress={() => navigation.navigate('RegisterDifficulty')} />
        </View>
      }
    >
      <Text style={styles.question}>Qual tipo de daltonismo você tem?</Text>
      <Text style={styles.helper}>Isso permitirá entender melhor{`\n`}nosso público!</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Selecionar tipo de daltonismo"
        activeOpacity={0.85}
        style={styles.select}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectText}>{selected}</Text>
        <DownArrow width={30} height={30} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <View style={styles.selectedOption}>
              <Text style={styles.selectedOptionText}>{selected}</Text>
              <DownArrow width={30} height={30} />
            </View>
            {options.filter((option) => option !== selected).map((option) => (
              <TouchableOpacity key={option} activeOpacity={0.8} onPress={() => choose(option)} style={styles.modalOption}>
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
  content: {
    justifyContent: 'center',
    paddingBottom: 113,
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
  select: {
    height: 56,
    borderRadius: 10,
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  modalCard: {
    backgroundColor: theme.colors.input,
    borderRadius: 9,
    overflow: 'hidden',
  },
  selectedOption: {
    height: 53,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOptionText: {
    flex: 1,
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOption: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
  },
});
