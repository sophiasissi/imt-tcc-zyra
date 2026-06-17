import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { apiRequest } from '../services/api';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';

import BackIcon from '../../assets/icons/backArrow.svg';
import ArrowRightIcon from '../../assets/icons/right-arrow-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInfo'>;

type UserProfileResponse = {
  id: string;
  cognitoSub: string;
  nome: string | null;
  email: string | null;
  dataNascimento: string | null;
  genero: GeneroValue | null;
  tipoDaltonismo: TipoDaltonismoValue | null;
  nivelDificuldadeLooks: number | null;
};

type GeneroValue =
  | 'MASCULINO'
  | 'FEMININO'
  | 'NAO_BINARIO'
  | 'PREFIRO_NAO_DIZER'
  | 'OUTRO';

type TipoDaltonismoValue =
  | 'PROTANOMALIA'
  | 'PROTANOPIA'
  | 'DEUTERANOMALIA'
  | 'DEUTERANOPIA'
  | 'TRITANOMALIA'
  | 'TRITANOPIA'
  | 'ACROMATOPSIA'
  | 'NAO_SEI'
  | 'PREFIRO_NAO_DIZER';

type EditableField = 'dataNascimento' | 'genero' | 'tipoDaltonismo';

type InfoRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
};

const generoOptions: Array<{ label: string; value: GeneroValue }> = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Não binário', value: 'NAO_BINARIO' },
  { label: 'Outro', value: 'OUTRO' },
  { label: 'Prefiro não dizer', value: 'PREFIRO_NAO_DIZER' },
];

const daltonismoOptions: Array<{
  label: string;
  value: TipoDaltonismoValue;
}> = [
  { label: 'Protanomalia', value: 'PROTANOMALIA' },
  { label: 'Protanopia', value: 'PROTANOPIA' },
  { label: 'Deuteranomalia', value: 'DEUTERANOMALIA' },
  { label: 'Deuteranopia', value: 'DEUTERANOPIA' },
  { label: 'Tritanomalia', value: 'TRITANOMALIA' },
  { label: 'Tritanopia', value: 'TRITANOPIA' },
  { label: 'Acromatopsia', value: 'ACROMATOPSIA' },
  { label: 'Não sei', value: 'NAO_SEI' },
  { label: 'Prefiro não dizer', value: 'PREFIRO_NAO_DIZER' },
];

function InfoRow({ label, value, onPress }: InfoRowProps) {
  return (
    <TouchableOpacity
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
      activeOpacity={onPress ? 0.75 : 1}
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.infoValueArea}>
        <Text style={styles.infoValue}>{value}</Text>
        {onPress ? <ArrowRightIcon width={14} height={14} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function formatDateToDisplay(value?: string | null) {
  if (!value) {
    return 'Não informado';
  }

  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateToApi(value: string) {
  const cleanValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return cleanValue;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanValue)) {
    const [day, month, year] = cleanValue.split('/');
    return `${year}-${month}-${day}`;
  }

  return cleanValue;
}

function getGeneroLabel(value?: GeneroValue | null) {
  return (
    generoOptions.find((option) => option.value === value)?.label ??
    'Não informado'
  );
}

function getDaltonismoLabel(value?: TipoDaltonismoValue | null) {
  return (
    daltonismoOptions.find((option) => option.value === value)?.label ??
    'Não informado'
  );
}

export function PersonalInfoScreen({ navigation, route }: Props) {
  const { accessToken, nome } = route.params;

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const displayName = profile?.nome ?? nome ?? 'Nome do Usuário';

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);

        const response = await apiRequest<UserProfileResponse>('/users/me', {
          method: 'GET',
          token: accessToken,
        });

        setProfile(response);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar suas informações.';

        setPopup({
          variant: 'error',
          title: 'Não foi possível carregar seus dados',
          message,
          buttonText: 'Entendi',
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, [accessToken]);

  function closePopup() {
    setPopup(null);
  }

  function openEditor(field: EditableField) {
    setActiveField(field);

    if (field === 'dataNascimento') {
      setDraftValue(formatDateToDisplay(profile?.dataNascimento));
      return;
    }

    if (field === 'genero') {
      setDraftValue(profile?.genero ?? '');
      return;
    }

    if (field === 'tipoDaltonismo') {
      setDraftValue(profile?.tipoDaltonismo ?? '');
    }
  }

  function closeEditor() {
    setActiveField(null);
    setDraftValue('');
  }

  async function updateProfile(
    payload: Partial<Pick<UserProfileResponse, 'dataNascimento' | 'genero' | 'tipoDaltonismo'>>,
  ) {
    const response = await apiRequest<UserProfileResponse>('/users/me', {
      method: 'PATCH',
      token: accessToken,
      body: JSON.stringify(payload),
    });

    setProfile(response);
  }

  async function handleSave() {
    if (!activeField) {
      return;
    }

    try {
      setIsSaving(true);

      if (activeField === 'dataNascimento') {
        const formattedDate = formatDateToApi(draftValue);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
          setPopup({
            variant: 'warning',
            title: 'Data inválida',
            message: 'Digite a data no formato DD/MM/AAAA.',
            buttonText: 'Entendi',
          });

          return;
        }

        await updateProfile({
          dataNascimento: formattedDate,
        });

        closeEditor();
        return;
      }

      if (activeField === 'genero') {
        await updateProfile({
          genero: draftValue as GeneroValue,
        });

        closeEditor();
        return;
      }

      if (activeField === 'tipoDaltonismo') {
        await updateProfile({
          tipoDaltonismo: draftValue as TipoDaltonismoValue,
        });

        closeEditor();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a alteração.';

      setPopup({
        variant: 'error',
        title: 'Não foi possível salvar',
        message,
        buttonText: 'Entendi',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function getEditorTitle() {
    if (activeField === 'dataNascimento') return 'Alterar data de nascimento';
    if (activeField === 'genero') return 'Alterar gênero';
    if (activeField === 'tipoDaltonismo') return 'Alterar tipo de daltonismo';

    return '';
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          activeOpacity={0.75}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon width={26} height={26} />
        </TouchableOpacity>

        <Text style={styles.title}>Informações Pessoais</Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <InfoRow label="Nome" value={displayName} />

          <InfoRow label="E-mail" value={profile?.email ?? 'Não informado'} />

          <InfoRow
            label="Data de nascimento"
            value={formatDateToDisplay(profile?.dataNascimento)}
            onPress={() => openEditor('dataNascimento')}
          />

          <InfoRow
            label="Gênero"
            value={getGeneroLabel(profile?.genero)}
            onPress={() => openEditor('genero')}
          />

          <InfoRow
            label="Tipo de daltonismo"
            value={getDaltonismoLabel(profile?.tipoDaltonismo)}
            onPress={() => openEditor('tipoDaltonismo')}
          />
        </View>
      )}

      <Modal
        transparent
        visible={activeField !== null}
        animationType="fade"
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          style={styles.editorKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editorOverlay}>
            <Pressable style={styles.editorBackdrop} onPress={closeEditor} />

            <View style={styles.editorSheet}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar edição"
                activeOpacity={0.8}
                style={styles.editorCloseButton}
                onPress={closeEditor}
              >
                <Text style={styles.editorCloseText}>×</Text>
              </TouchableOpacity>

              <Text style={styles.editorTitle}>{getEditorTitle()}</Text>

              {activeField === 'dataNascimento' ? (
                <>
                  <TextInput
                    accessibilityLabel={getEditorTitle()}
                    value={draftValue}
                    onChangeText={setDraftValue}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={theme.colors.muted2}
                    keyboardType="number-pad"
                    style={styles.editorInput}
                  />

                  <Text style={styles.editorHint}>Use o formato DD/MM/AAAA.</Text>
                </>
              ) : null}

              {activeField === 'genero' ? (
                <ScrollView style={styles.optionsList}>
                  {generoOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      activeOpacity={0.8}
                      style={[
                        styles.optionItem,
                        draftValue === option.value && styles.optionItemSelected,
                      ]}
                      onPress={() => setDraftValue(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          draftValue === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}

              {activeField === 'tipoDaltonismo' ? (
                <ScrollView style={styles.optionsList}>
                  {daltonismoOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      activeOpacity={0.8}
                      style={[
                        styles.optionItem,
                        draftValue === option.value && styles.optionItemSelected,
                      ]}
                      onPress={() => setDraftValue(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          draftValue === option.value &&
                            styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}

              <ZyraButton
                title={isSaving ? 'Salvando...' : 'Continuar'}
                disabled={isSaving || draftValue.trim().length === 0}
                onPress={handleSave}
                style={styles.saveButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {popup ? (
        <ZyraPopup
          visible
          {...popup}
          onConfirm={popup.onConfirm ?? closePopup}
          onClose={closePopup}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    height: 112,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  infoRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  infoValueArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '56%',
  },
  infoValue: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    textAlign: 'right',
  },
  editorKeyboardView: {
    flex: 1,
  },
  editorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editorBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  editorSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 34,
    maxHeight: '76%',
  },
  editorCloseButton: {
    position: 'absolute',
    right: 22,
    top: 16,
    zIndex: 2,
  },
  editorCloseText: {
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 30,
  },
  editorTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  editorInput: {
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  editorHint: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  optionsList: {
    maxHeight: 310,
    marginBottom: 18,
  },
  optionItem: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: theme.colors.input,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  optionTextSelected: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
  },
  saveButton: {
    marginTop: 8,
  },
});