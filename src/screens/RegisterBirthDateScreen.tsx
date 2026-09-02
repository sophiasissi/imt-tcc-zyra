import { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthLayout } from '../components/AuthLayout';
import { ZyraButton } from '../components/ZyraButton';
import { theme } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterBirthDate'>;

const INITIAL_DATE = new Date(2004, 3, 1);

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateForApi(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function RegisterBirthDateScreen({ navigation }: Props) {
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);

      console.log(
        '[Onboarding] Data de nascimento selecionada:',
        formatDateForApi(selectedDate),
      );
    }
  }

  function handleContinue() {
    if (!date) {
      return;
    }

    const dataNascimento = formatDateForApi(date);

    console.log('[Onboarding] Enviando data de nascimento para próxima etapa.');

    navigation.navigate('RegisterGender', {
      dataNascimento,
    });
  }

  return (
    <AuthLayout
      title=""
      onBack={() => navigation.goBack()}
      footer={
        <ZyraButton
          title="Continuar"
          disabled={!date}
          onPress={handleContinue}
        />
      }
    >
      <Text style={styles.question}>Qual sua data de Nascimento?</Text>

      <Text style={styles.helper}>
        Isso permitirá entender melhor{`\n`}nosso público!
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.dateButton,
          date ? styles.dateButtonSelected : undefined,
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[styles.dateText, date ? styles.dateTextSelected : undefined]}
        >
          {date ? formatDate(date) : 'Selecione sua data de nascimento'}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker ? (
        <DateTimePicker
          value={date ?? INITIAL_DATE}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={handleChange}
          positiveButton={{
            label: 'Concluir',
            textColor: theme.colors.primary,
          }}
          negativeButton={{
            label: 'Cancelar',
            textColor: theme.colors.primary,
          }}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <DateTimePicker
                value={date ?? INITIAL_DATE}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                onChange={handleChange}
                accentColor={theme.colors.primary}
                themeVariant="light"
                style={styles.iosPicker}
              />

              <TouchableOpacity
                style={styles.confirmDate}
                activeOpacity={0.85}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.confirmDateText}>Concluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
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
  dateButton: {
    height: 54,
    borderRadius: 10,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dateButtonSelected: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.label,
  },
  dateTextSelected: {
    color: theme.colors.primary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
  },
  iosPicker: {
    backgroundColor: theme.colors.background,
  },
  confirmDate: {
    height: 46,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmDateText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
