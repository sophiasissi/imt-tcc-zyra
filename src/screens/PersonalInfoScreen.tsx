import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { ApiError, apiRequest } from '../services/api';
import { EscalaDificuldade } from '../components/EscalaDificuldade';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { ConsentimentoSaude } from '../components/ConsentimentoSaude';
import { UserProfile, useAuth } from '../contexts/AuthContext';
import {
  DALTONISMO_PREFIRO_NAO_DIZER,
  exigeConsentimentoSaude,
  DALTONISMO_OPCOES,
  DIFICULDADE_PREFIRO_NAO_DIZER,
  GENERO_OPCOES,
  GENERO_PREFIRO_NAO_DIZER,
  daltonismoLabel,
  generoLabel,
} from '../constants/perfil';

import BackIcon from '../../assets/icons/backArrow.svg';
import ArrowRightIcon from '../../assets/icons/right-arrow-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInfo'>;

/**
 * Nome, e-mail e data de nascimento são só leitura: o e-mail é o login, e o
 * nome e a data não mudam (decisão de 08/10/2026).
 */
type EditableField = 'genero' | 'tipoDaltonismo' | 'nivelDificuldadeLooks';

/**
 * Opção do editor. `chave` identifica a opção na tela; `valor` é o que vai
 * para o back (null no "Prefiro não dizer" da dificuldade, que no cadastro
 * também deixa o campo vazio).
 */
type Opcao = {
  chave: string;
  label: string;
  valor: string | number | null;
};

const CHAVE_VAZIO = 'VAZIO';

const OPCOES: Record<EditableField, Opcao[]> = {
  genero: [
    ...GENERO_OPCOES.map(({ label, value }) => ({
      chave: value,
      label,
      valor: value,
    })),
    {
      chave: 'PREFIRO_NAO_DIZER',
      label: GENERO_PREFIRO_NAO_DIZER,
      valor: 'PREFIRO_NAO_DIZER',
    },
  ],
  tipoDaltonismo: [
    ...DALTONISMO_OPCOES.map(({ label, value }) => ({
      chave: value,
      label,
      valor: value,
    })),
    {
      chave: 'PREFIRO_NAO_DIZER',
      label: DALTONISMO_PREFIRO_NAO_DIZER,
      valor: 'PREFIRO_NAO_DIZER',
    },
  ],
  // Os números ficam na escala; aqui só a opção de não responder.
  nivelDificuldadeLooks: [
    { chave: CHAVE_VAZIO, label: DIFICULDADE_PREFIRO_NAO_DIZER, valor: null },
  ],
};

const EDITOR_TITULO: Record<EditableField, string> = {
  genero: 'Como você se identifica?',
  tipoDaltonismo: 'Qual tipo de daltonismo você tem?',
  nivelDificuldadeLooks: 'Quanta dificuldade você sente ao combinar roupas?',
};

/**
 * O cadastro só termina depois da data de nascimento, que é obrigatória.
 * Com ela salva, a dificuldade vazia é a resposta "Prefiro não dizer"; sem
 * ela, a pessoa ainda não respondeu.
 */
function cadastroConcluido(profile: UserProfile | null) {
  return Boolean(profile?.dataNascimento);
}

/** Chave da opção que corresponde ao valor salvo. */
function chaveAtual(field: EditableField, profile: UserProfile | null) {
  const valor = profile?.[field];

  if (valor !== null && valor !== undefined) {
    return String(valor);
  }

  return field === 'nivelDificuldadeLooks' && cadastroConcluido(profile)
    ? CHAVE_VAZIO
    : null;
}

function valorExibido(field: EditableField, profile: UserProfile | null) {
  if (field === 'genero') {
    return generoLabel(profile?.genero) ?? 'Não informado';
  }

  if (field === 'tipoDaltonismo') {
    return daltonismoLabel(profile?.tipoDaltonismo) ?? 'Não informado';
  }

  const nivel = profile?.nivelDificuldadeLooks;

  if (nivel !== null && nivel !== undefined) {
    return `${nivel} de 5`;
  }

  return cadastroConcluido(profile)
    ? DIFICULDADE_PREFIRO_NAO_DIZER
    : 'Não informado';
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

type InfoRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
  /** E-mail longo: corta no meio, mantendo o começo e o domínio. */
  umaLinha?: boolean;
};

function InfoRow({ label, value, onPress, umaLinha = false }: InfoRowProps) {
  const conteudo = (
    <>
      <Text style={styles.infoLabel}>{label}</Text>

      <View style={styles.infoValueArea}>
        <Text
          style={styles.infoValue}
          numberOfLines={umaLinha ? 1 : 2}
          ellipsizeMode={umaLinha ? 'middle' : 'tail'}
        >
          {value}
        </Text>
        {onPress ? <ArrowRightIcon width={14} height={14} /> : null}
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={styles.infoRow}
        accessible
        accessibilityLabel={`${label}: ${value}`}
      >
        {conteudo}
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint="Toque para alterar"
      activeOpacity={0.75}
      style={styles.infoRow}
      onPress={onPress}
    >
      {conteudo}
    </TouchableOpacity>
  );
}

/**
 * O destaque rosa é a escolha em edição; o ✓ marca a opção salva e só muda
 * depois de salvar. Assim a pessoa vê o que tinha antes enquanto escolhe.
 */
function OpcaoItem({
  label,
  selected,
  salva,
  onPress,
}: {
  label: string;
  selected: boolean;
  salva: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={salva ? `${label}, opção salva` : label}
      activeOpacity={0.8}
      style={[styles.optionItem, selected && styles.optionItemSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>

      {salva ? (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke={selected ? theme.colors.white : theme.colors.primary}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </TouchableOpacity>
  );
}

export function PersonalInfoScreen({ navigation }: Props) {
  const { tokens, user, updateUser } = useAuth();

  const accessToken = tokens?.accessToken ?? '';

  // Abre com o perfil que já está em memória e atualiza por trás; o
  // carregando só aparece se ainda não houver nada para mostrar.
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [isLoading, setIsLoading] = useState(!user);
  const [isSaving, setIsSaving] = useState(false);
  const [activeField, setActiveField] = useState<EditableField | null>(null);
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);
  const [consentiu, setConsentiu] = useState(false);

  const temPerfilEmMemoria = Boolean(user);

  useEffect(() => {
    let ativo = true;

    async function loadProfile() {
      if (!accessToken) {
        if (ativo && !temPerfilEmMemoria) {
          setPopup({
            variant: 'warning',
            title: 'Sessão não encontrada',
            message: 'Entre novamente para visualizar suas informações.',
            buttonText: 'Entendi',
          });
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await apiRequest<UserProfile>('/users/me', {
          method: 'GET',
          token: accessToken,
        });

        if (!ativo) return;

        setProfile(response);
        updateUser(response);
      } catch (error) {
        console.error('[Informações pessoais] Falha ao carregar:', error);

        // Com o perfil em memória na tela, a falha da atualização não
        // atrapalha: a pessoa continua vendo seus dados.
        if (ativo && !temPerfilEmMemoria) {
          setPopup({
            variant: 'error',
            title: 'Não foi possível carregar seus dados',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar suas informações.',
            buttonText: 'Entendi',
          });
        }
      } finally {
        if (ativo) setIsLoading(false);
      }
    }

    void loadProfile();

    return () => {
      ativo = false;
    };
  }, [accessToken, updateUser, temPerfilEmMemoria]);

  function closePopup() {
    setPopup(null);
  }

  function openEditor(field: EditableField) {
    setConsentiu(false);
    setActiveField(field);
    setDraftKey(chaveAtual(field, profile));
  }

  function closeEditor() {
    if (isSaving) return;

    setActiveField(null);
    setDraftKey(null);
  }

  async function handleSave() {
    if (!activeField || draftKey === null) {
      return;
    }

    // Nada mudou: fecha sem chamar o back.
    if (draftKey === chaveAtual(activeField, profile)) {
      closeEditor();
      return;
    }

    if (precisaConsentimento && !consentiu) {
      return;
    }

    const valor =
      activeField === 'nivelDificuldadeLooks' && draftKey !== CHAVE_VAZIO
        ? Number(draftKey)
        : (OPCOES[activeField].find((opcao) => opcao.chave === draftKey)
            ?.valor ?? null);

    try {
      setIsSaving(true);

      const response = await apiRequest<UserProfile>('/users/me', {
        method: 'PATCH',
        token: accessToken,
        // null limpa o campo no back (o DTO aceita, por ser opcional).
        body: JSON.stringify({
          [activeField]: valor,
          ...(precisaConsentimento ? { consentimentoDadosSaude: true } : {}),
        }),
      });

      setProfile(response);
      updateUser(response);
      setActiveField(null);
      setDraftKey(null);
    } catch (error) {
      console.error('[Informações pessoais] Falha ao salvar:', error);

      // 400 do validador do back vem em inglês (ex.: back sem a migration do
      // NAO_TENHO) e não serve para a pessoa. Os 400 escritos pelo back, em
      // português (ex.: falta de autorização), passam como vieram.
      const doValidador =
        error instanceof ApiError &&
        error.status === 400 &&
        /\b(must|should|property)\b/i.test(error.message);

      setPopup({
        variant: 'error',
        title: 'Não foi possível salvar',
        message:
          !doValidador && error instanceof Error
            ? error.message
            : 'Não foi possível salvar essa alteração agora. Tente novamente mais tarde.',
        buttonText: 'Entendi',
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Tipo de daltonismo é dado de saúde: sem autorização salva, a escolha de
  // qualquer tipo (menos "Prefiro não dizer") pede a autorização antes.
  const precisaConsentimento =
    activeField === 'tipoDaltonismo' &&
    !profile?.consentimentoSaudeEm &&
    draftKey !== chaveAtual('tipoDaltonismo', profile) &&
    exigeConsentimentoSaude(draftKey);

  const nivelSelecionado =
    activeField === 'nivelDificuldadeLooks' &&
    draftKey !== null &&
    draftKey !== CHAVE_VAZIO
      ? Number(draftKey)
      : null;

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

        <Text style={styles.title} accessibilityRole="header">
          Informações pessoais
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <InfoRow label="Nome" value={profile?.nome ?? 'Não informado'} />

          <InfoRow
            label="E-mail"
            value={profile?.email ?? 'Não informado'}
            umaLinha
          />

          <InfoRow
            label="Data de nascimento"
            value={formatDateToDisplay(profile?.dataNascimento)}
          />

          <InfoRow
            label="Gênero"
            value={valorExibido('genero', profile)}
            onPress={() => openEditor('genero')}
          />

          <InfoRow
            label="Tipo de daltonismo"
            value={valorExibido('tipoDaltonismo', profile)}
            onPress={() => openEditor('tipoDaltonismo')}
          />

          <InfoRow
            label="Dificuldade para combinar roupas"
            value={valorExibido('nivelDificuldadeLooks', profile)}
            onPress={() => openEditor('nivelDificuldadeLooks')}
          />
        </View>
      )}

      <Modal
        transparent
        visible={activeField !== null}
        animationType="fade"
        onRequestClose={closeEditor}
      >
        <View style={styles.editorOverlay}>
          <Pressable
            style={styles.editorBackdrop}
            onPress={closeEditor}
            accessibilityRole="button"
            accessibilityLabel="Fechar edição"
          />

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

            <Text style={styles.editorTitle} accessibilityRole="header">
              {activeField ? EDITOR_TITULO[activeField] : ''}
            </Text>

            {activeField === 'nivelDificuldadeLooks' ? (
              <View style={styles.scaleArea}>
                <EscalaDificuldade
                  selected={nivelSelecionado}
                  salvo={profile?.nivelDificuldadeLooks ?? null}
                  onSelect={(nivel) => setDraftKey(String(nivel))}
                  disabled={isSaving}
                />
              </View>
            ) : null}

            {activeField ? (
              <ScrollView
                style={styles.optionsList}
                accessibilityRole="radiogroup"
              >
                {OPCOES[activeField].map((opcao) => (
                  <OpcaoItem
                    key={opcao.chave}
                    label={opcao.label}
                    selected={draftKey === opcao.chave}
                    salva={
                      activeField !== null &&
                      chaveAtual(activeField, profile) === opcao.chave
                    }
                    onPress={() => setDraftKey(opcao.chave)}
                  />
                ))}
              </ScrollView>
            ) : null}

            {precisaConsentimento ? (
              <View style={styles.consentimento}>
                <ConsentimentoSaude
                  aceito={consentiu}
                  onChange={setConsentiu}
                  onVerPolitica={() => {
                    closeEditor();
                    navigation.navigate('PoliticaPrivacidade');
                  }}
                />
              </View>
            ) : null}

            <ZyraButton
              title={isSaving ? 'Salvando...' : 'Salvar'}
              disabled={
                isSaving ||
                draftKey === null ||
                (precisaConsentimento && !consentiu)
              }
              onPress={handleSave}
              style={styles.saveButton}
            />
          </View>

          {/* Erro ao salvar: desenhado dentro do Modal do editor, como
              camada, e não como um segundo Modal por cima dele. */}
          {popup && activeField ? (
            <ZyraPopup
              visible
              modal={false}
              {...popup}
              onConfirm={popup.onConfirm ?? closePopup}
              onClose={closePopup}
            />
          ) : null}
        </View>
      </Modal>

      {popup && !activeField ? (
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
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  infoLabel: {
    flexShrink: 1,
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
    flexShrink: 1,
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    textAlign: 'right',
  },
  editorOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editorBackdrop: {
    ...StyleSheet.absoluteFill,
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
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 28,
    marginBottom: 24,
  },
  scaleArea: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  consentimento: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
});
