import { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

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

        <Text style={styles.userName}>{displayName}</Text>

        <View style={styles.menuGroup}>
          <MenuItem
            title="Informações pessoais"
            icon={<UserIcon width={24} height={24} />}
            onPress={() => navigation.navigate('PersonalInfo')}
          />
        </View>

        <Text style={styles.sectionTitle}>Acessibilidade</Text>

        <View style={styles.menuGroup}>
          <MenuItem
            title="Sobre o ColorADD"
            icon={<LogoColorADD width={28} height={28} />}
            onPress={() => console.log('[Configurações] Sobre o ColorADD.')}
          />
        </View>

        <Text style={styles.sectionTitle}>Privacidade e Segurança</Text>

        <View style={styles.menuGroup}>
          <MenuItem
            title="Alterar senha"
            icon={<LockIcon width={24} height={24} />}
            onPress={() => navigation.navigate('ChangePassword')}
          />

          <MenuItem
            title="Permissões"
            icon={<ShieldIcon width={24} height={24} />}
            onPress={() => navigation.navigate('Permissions')}
          />

          <MenuItem
            title="Política de privacidade"
            icon={<InfoIcon width={24} height={24} />}
            onPress={() =>
              console.log('[Configurações] Política de privacidade.')
            }
          />
        </View>

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
    paddingHorizontal: 36,
    paddingTop: 72,
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
    marginBottom: 38,
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
  dangerText: {
    color: '#E73232',
  },
  logoutArea: {
    marginTop: 'auto',
    marginBottom: 50,
  },
});
