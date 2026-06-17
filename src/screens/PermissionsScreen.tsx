import { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

import BackIcon from '../../assets/icons/backArrow.svg';
import CameraIcon from '../../assets/icons/camera.svg';
import GalleryIcon from '../../assets/icons/photo-svgrepo-com (1).svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

type PermissionRowProps = {
  label: string;
  icon: React.ReactNode;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function PermissionRow({
  label,
  icon,
  value,
  onValueChange,
}: PermissionRowProps) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionLeft}>
        <View style={styles.permissionIcon}>{icon}</View>
        <Text style={styles.permissionText}>{label}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.colors.input,
          true: '#2E9B34',
        }}
        thumbColor={theme.colors.white}
      />
    </View>
  );
}

export function PermissionsScreen({ navigation }: Props) {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [galleryEnabled, setGalleryEnabled] = useState(false);

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

        <Text style={styles.title}>Permissões</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <PermissionRow
          label="Camera"
          icon={<CameraIcon width={23} height={23} />}
          value={cameraEnabled}
          onValueChange={setCameraEnabled}
        />

        <PermissionRow
          label="Galeria"
          icon={<GalleryIcon width={23} height={23} />}
          value={galleryEnabled}
          onValueChange={setGalleryEnabled}
        />
      </View>
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
    paddingHorizontal: 26,
    paddingTop: 10,
  },
  permissionRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionIcon: {
    width: 28,
    alignItems: 'center',
  },
  permissionText: {
    color: theme.colors.titleZyra,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
});