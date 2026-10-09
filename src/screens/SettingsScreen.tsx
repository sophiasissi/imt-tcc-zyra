import { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';
import { ZyraPopup } from '../components/ZyraPopup';
import { useAuth } from '../contexts/AuthContext';

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
  const { signOut, user } = useAuth();

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={['#DE0051', '#AB003E', '#78002C']}
            locations={[0.25, 0.65, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.avatar}
          />

          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </View>
      </View>

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
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
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
    marginBottom: 16,
  },
  sectionTitle: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    marginTop: 24,
    marginBottom: 14,
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
