import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { FotoPerfil } from '../components/FotoPerfil';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { atualizarFotoPerfil, removerFotoPerfil } from '../services/perfilApi';

import BackIcon from '../../assets/icons/backArrow.svg';
import LogoColorADD from '../../assets/icons/logo_ColorADD.svg';
import UserIcon from '../../assets/icons/user-people-account-svgrepo-com.svg';
import InfoIcon from '../../assets/icons/info-svgrepo-com.svg';
import LockIcon from '../../assets/icons/padlock-lock-svgrepo-com.svg';
import ShieldIcon from '../../assets/icons/security-verified-svgrepo-com.svg';
import ArrowRightIcon from '../../assets/icons/right-arrow-svgrepo-com.svg';
import LogoutIcon from '../../assets/icons/logout-svgrepo-com.svg';
import EyeIcon from '../../assets/icons/eye-open.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type OrigemDaFoto = 'camera' | 'galeria';

// Tempo para o menu (ou o alerta de permissão do sistema) terminar de fechar
// antes de abrir a câmera ou a galeria: no iOS, abrir junto pode falhar.
const MENU_FECHANDO_MS = 350;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Lixeira, para "Excluir conta" (não há SVG dela em assets). */
function TrashIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path
        d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"
        stroke="#C62828"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Documento com linhas, para "Termos de uso" (não há SVG dele em assets). */
function TermsIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path
        d="M7 3h7l4 4v14H7zM14 3v4h4M9.5 11h6M9.5 14h6M9.5 17h4"
        stroke="#000000"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

type MenuItemProps = {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ title, icon, onPress, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      activeOpacity={0.85}
      style={styles.menuItem}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text style={[styles.menuText, danger && styles.dangerText]}>
          {title}
        </Text>
      </View>

      {!danger ? <ArrowRightIcon width={16} height={16} /> : null}
    </TouchableOpacity>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { signOut, user, tokens, updateUser } = useAuth();

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [opcoesFotoVisiveis, setOpcoesFotoVisiveis] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const fotoUrl = user?.fotoUrl ?? null;

  /**
   * Pede a permissão só da opção escolhida, na hora de usar (a câmera não
   * precisa da galeria, e vice-versa). Recusada de vez, só os Ajustes liberam.
   */
  async function garantirPermissao(origem: OrigemDaFoto) {
    const ler =
      origem === 'camera'
        ? ImagePicker.getCameraPermissionsAsync
        : ImagePicker.getMediaLibraryPermissionsAsync;
    const pedir =
      origem === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;

    let permissao = await ler();
    if (!permissao.granted && permissao.canAskAgain) {
      permissao = await pedir();
    }
    if (permissao.granted) {
      return true;
    }

    if (Platform.OS === 'ios') await sleep(MENU_FECHANDO_MS);

    setPopup({
      variant: 'warning',
      title:
        origem === 'camera'
          ? 'Permita o acesso à câmera'
          : 'Permita o acesso às fotos',
      message:
        origem === 'camera'
          ? 'Para tirar a foto do perfil, libere a câmera para o ZYRA nos Ajustes do celular.'
          : 'Para escolher a foto do perfil, libere o acesso às fotos do ZYRA nos Ajustes do celular.',
      buttonText: 'Abrir Ajustes',
      onConfirm: () => {
        setPopup(null);
        Linking.openSettings().catch((error: unknown) =>
          console.error('[Perfil] Falha ao abrir os Ajustes:', error),
        );
      },
      secondaryButtonText: 'Agora não',
      onSecondaryPress: () => setPopup(null),
    });
    return false;
  }

  async function escolherFoto(origem: OrigemDaFoto) {
    setOpcoesFotoVisiveis(false);
    await sleep(MENU_FECHANDO_MS);

    const accessToken = tokens?.accessToken;
    if (!accessToken || !(await garantirPermissao(origem))) {
      return;
    }

    // Recorte quadrado: a foto aparece num círculo.
    const opcoes: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let escolha: ImagePicker.ImagePickerResult;
    try {
      escolha =
        origem === 'camera'
          ? await ImagePicker.launchCameraAsync({
              ...opcoes,
              cameraType: ImagePicker.CameraType.front,
            })
          : await ImagePicker.launchImageLibraryAsync({
              ...opcoes,
              // HEIC (padrão do iPhone) vem convertido para JPEG.
              preferredAssetRepresentationMode:
                ImagePicker.UIImagePickerPreferredAssetRepresentationMode
                  .Compatible,
            });
    } catch (error) {
      console.error('[Perfil] Falha ao abrir a câmera ou a galeria:', error);
      setPopup({
        variant: 'error',
        title:
          origem === 'camera'
            ? 'Não foi possível abrir a câmera'
            : 'Não foi possível abrir a galeria',
        message: 'Tente novamente em instantes.',
        buttonText: 'Entendi',
      });
      return;
    }

    const imagem = escolha.canceled ? null : escolha.assets?.[0];
    if (!imagem) {
      return;
    }

    setEnviandoFoto(true);
    try {
      const perfil = await atualizarFotoPerfil(imagem.uri, accessToken);
      updateUser({ fotoUrl: perfil.fotoUrl ?? null });
    } catch (error) {
      console.error('[Perfil] Falha ao enviar a foto:', error);
      setPopup({
        variant: 'error',
        title: 'Não foi possível trocar a foto',
        message:
          error instanceof ApiError
            ? error.message
            : 'Tente novamente em instantes.',
        buttonText: 'Entendi',
      });
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function removerFoto() {
    setOpcoesFotoVisiveis(false);

    const accessToken = tokens?.accessToken;
    if (!accessToken) {
      return;
    }

    setEnviandoFoto(true);
    try {
      await removerFotoPerfil(accessToken);
      updateUser({ fotoUrl: null });
    } catch (error) {
      console.error('[Perfil] Falha ao remover a foto:', error);
      setPopup({
        variant: 'error',
        title: 'Não foi possível remover a foto',
        message:
          error instanceof ApiError
            ? error.message
            : 'Tente novamente em instantes.',
        buttonText: 'Entendi',
      });
    } finally {
      setEnviandoFoto(false);
    }
  }

  const displayName = user?.nome ?? 'Nome do Usuário';

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      setExitModalVisible(false);

      console.log('[Configurações] Usuário saiu da conta.');

      await signOut();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Intro' }],
      });
    } finally {
      setIsLoggingOut(false);
    }
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
          accessibilityLabel="Voltar para Home"
          activeOpacity={0.75}
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon width={28} height={28} />
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        {/* Rola quando os itens não cabem na tela (celular pequeno). */}
        <ScrollView
          style={styles.panelScroll}
          contentContainerStyle={styles.panelContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.userName}>{displayName}</Text>

          <Text style={styles.sectionTitle}>Conta</Text>

          <View style={styles.menuGroup}>
            <MenuItem
              title="Informações pessoais"
              icon={<UserIcon width={24} height={24} />}
              onPress={() => navigation.navigate('PersonalInfo')}
            />

            <MenuItem
              title="Alterar senha"
              icon={<LockIcon width={24} height={24} />}
              onPress={() => navigation.navigate('ChangePassword')}
            />

            {/* Na seção Conta, fácil de achar: a LGPD pede exercício
                facilitado dos direitos (arts. 8º §5º, 9º e 18), e a App Store,
                a exclusão nas configurações de conta (5.1.1(v)). Em vermelho,
                sem seta; a tela seguinte pede a senha e confirmação. */}
            <MenuItem
              title="Excluir conta"
              danger
              icon={<TrashIcon width={24} height={24} />}
              onPress={() => navigation.navigate('ExcluirConta')}
            />
          </View>

          <Text style={styles.sectionTitle}>Acessibilidade</Text>

          <View style={styles.menuGroup}>
            <MenuItem
              title="Sobre o ColorADD"
              icon={<LogoColorADD width={28} height={28} />}
              onPress={() => navigation.navigate('SobreColorAdd')}
            />

            <MenuItem
              title="Acessibilidade no ZYRA"
              icon={<EyeIcon width={24} height={24} />}
              onPress={() => navigation.navigate('Acessibilidade')}
            />
          </View>

          <Text style={styles.sectionTitle}>Privacidade</Text>

          <View style={styles.menuGroup}>
            <MenuItem
              title="Permissões"
              icon={<ShieldIcon width={24} height={24} />}
              onPress={() => navigation.navigate('Permissions')}
            />

            <MenuItem
              title="Política de privacidade"
              icon={<InfoIcon width={24} height={24} />}
              onPress={() => navigation.navigate('PoliticaPrivacidade')}
            />

            <MenuItem
              title="Termos de uso"
              icon={<TermsIcon width={24} height={24} />}
              onPress={() => navigation.navigate('TermosUso')}
            />
          </View>

          {/* Empurra o Sair para o fim da tela quando sobra espaço; quando
              não sobra, garante a distância mínima dos itens acima. */}
          <View style={styles.espacoAntesDeSair} />

          <View style={styles.logoutArea}>
            <MenuItem
              title={isLoggingOut ? 'Saindo...' : 'Sair'}
              danger
              icon={<LogoutIcon width={24} height={24} />}
              onPress={() => {
                if (!isLoggingOut) {
                  setExitModalVisible(true);
                }
              }}
            />
          </View>
        </ScrollView>

        {/* Depois da rolagem, para ficar por cima dela. */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            fotoUrl ? 'Trocar a foto de perfil' : 'Adicionar foto de perfil'
          }
          activeOpacity={0.85}
          disabled={enviandoFoto}
          style={styles.avatarWrapper}
          onPress={() => setOpcoesFotoVisiveis(true)}
        >
          <FotoPerfil uri={fotoUrl} tamanho={116} />

          {enviandoFoto ? (
            <View style={styles.avatarCarregando}>
              <ActivityIndicator color={theme.colors.white} />
            </View>
          ) : null}

          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Camada na tela, e não Modal: no iOS, um Modal fechando junto com o
          seletor de fotos pode deixar uma camada invisível travando os toques. */}
      {opcoesFotoVisiveis ? (
        <View style={styles.opcoesFundo}>
          <TouchableOpacity
            accessibilityLabel="Fechar opções da foto"
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setOpcoesFotoVisiveis(false)}
          />
          <View style={styles.opcoesCartao}>
            <Text style={styles.opcoesTitulo}>Foto de perfil</Text>

            <OpcaoDaFoto
              texto="Tirar foto"
              onPress={() => void escolherFoto('camera')}
            />
            <OpcaoDaFoto
              texto="Escolher da galeria"
              onPress={() => void escolherFoto('galeria')}
            />
            {fotoUrl ? (
              <OpcaoDaFoto
                texto="Remover foto"
                perigo
                onPress={() => void removerFoto()}
              />
            ) : null}
            <OpcaoDaFoto
              texto="Cancelar"
              onPress={() => setOpcoesFotoVisiveis(false)}
            />
          </View>
        </View>
      ) : null}

      {popup ? (
        <ZyraPopup
          visible
          modal={false}
          {...popup}
          onConfirm={popup.onConfirm ?? (() => setPopup(null))}
          onClose={() => setPopup(null)}
        />
      ) : null}

      {exitModalVisible ? (
        <ZyraPopup
          visible
          variant="warning"
          title="Você está saindo?"
          message="Você poderá entrar novamente a qualquer momento."
          buttonText="Sair"
          showCloseButton
          customIcon={<LogoutIcon width={44} height={44} />}
          onConfirm={handleLogout}
          onClose={() => setExitModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

function OpcaoDaFoto({
  texto,
  onPress,
  perigo = false,
}: {
  texto: string;
  onPress: () => void;
  perigo?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      style={styles.opcao}
      onPress={onPress}
    >
      <Text style={[styles.opcaoTexto, perigo && styles.opcaoPerigo]}>
        {texto}
      </Text>
    </TouchableOpacity>
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
    // Mais alto: o painel (e a foto, que fica na borda dele) desce, e a foto
    // não encosta no topo da tela.
    height: 150,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  panel: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  },
  panelScroll: {
    flex: 1,
    // Recorta a rolagem na borda arredondada, abaixo do avatar.
    marginTop: 60,
  },
  panelContent: {
    flexGrow: 1,
    paddingHorizontal: 36,
    paddingTop: 12,
  },
  avatarWrapper: {
    position: 'absolute',
    top: -58,
    alignSelf: 'center',
  },
  avatarCarregando: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 58,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcoesFundo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  opcoesCartao: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 22,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  opcoesTitulo: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  opcao: {
    minHeight: 54,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D0D0D0',
  },
  opcaoTexto: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
  opcaoPerigo: {
    color: '#C62828',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#777777',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 17,
  },
  userName: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    marginTop: 20,
    marginBottom: 10,
  },
  menuGroup: {
    gap: 5,
  },
  menuItem: {
    minHeight: 58,
    backgroundColor: theme.colors.white,
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIcon: {
    width: 28,
    alignItems: 'center',
  },
  menuText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
  // #C62828: contraste de 5,6:1 no branco (o #E73232 dava cerca de 4:1,
  // abaixo do mínimo de 4,5:1 da WCAG para texto deste tamanho).
  dangerText: {
    color: '#C62828',
  },
  espacoAntesDeSair: {
    flexGrow: 1,
    minHeight: 44,
  },
  logoutArea: {
    marginBottom: 50,
  },
});
