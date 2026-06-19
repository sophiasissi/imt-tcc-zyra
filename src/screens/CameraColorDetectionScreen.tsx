import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import {
  detectColorFromImage,
  DetectColorResponse,
} from '../services/visionApi';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { theme } from '../styles/theme';

import GalleryIcon from '../../assets/icons/photo-svgrepo-com.svg';
import SwitchCameraIcon from '../../assets/icons/switch-horizontal-svgrepo-com (1).svg';
import CloseIcon from '../../assets/icons/close-svgrepo-com.svg';
import FlashIcon from '../../assets/icons/flash-svgrepo-com.svg';
import FlashOffIcon from '../../assets/icons/flash-off-svgrepo-com.svg';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'CameraColorDetection'
>;

type CameraFacing = 'back' | 'front';

type CameraWarningProps = {
  message: string;
};

type MappedColorResult = {
  label: string;
  image: ReturnType<typeof getColorAddSymbol>['image'];
  raw: DetectColorResponse;
};

const DETECTION_INTERVAL_MS = 800;

function getFriendlyWarningMessage(result?: DetectColorResponse | null) {
  if (!result?.warningCode && !result?.warningMessage) {
    return null;
  }

  if (result.warningMessage) {
    return result.warningMessage;
  }

  const warningCode = result.warningCode?.toUpperCase();

  if (
    warningCode?.includes('LOW_LIGHT') ||
    warningCode?.includes('DARK') ||
    warningCode?.includes('BAIXA')
  ) {
    return 'A iluminação está baixa. Tente aproximar a peça de uma luz melhor.';
  }

  if (
    warningCode?.includes('HIGH_LIGHT') ||
    warningCode?.includes('OVEREXPOSED') ||
    warningCode?.includes('ALTA')
  ) {
    return 'A iluminação está muito forte. Tente reduzir reflexos ou mudar o ângulo.';
  }

  if (
    warningCode?.includes('LOW_CONFIDENCE') ||
    warningCode?.includes('UNCERTAIN') ||
    warningCode?.includes('INDEFINIDA')
  ) {
    return 'Não conseguimos identificar a cor com segurança. Aponte a mira para uma área lisa da peça.';
  }

  return 'A leitura pode não estar precisa. Ajuste a iluminação e a posição da peça.';
}

function CameraWarning({ message }: CameraWarningProps) {
  return (
    <View style={styles.warningBox}>
      <Text style={styles.warningMessage}>{message}</Text>
    </View>
  );
}

export function CameraColorDetectionScreen({ navigation }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const isDetectingRef = useRef(false);
  const isScreenActiveRef = useRef(true);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [result, setResult] = useState<DetectColorResponse | null>(null);
  const [lastMappedResult, setLastMappedResult] =
    useState<MappedColorResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFirstDetection, setIsFirstDetection] = useState(true);
  const [facing, setFacing] = useState<CameraFacing>('back');
  const [isFlashOn, setIsFlashOn] = useState(false);

  const warningMessage = getFriendlyWarningMessage(result);

  const detectCurrentColor = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || isDetectingRef.current) {
      return;
    }

    try {
      isDetectingRef.current = true;
      setErrorMessage(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: false,
        skipProcessing: true,
      });

      if (!photo?.uri || !isScreenActiveRef.current) {
        return;
      }

      const response = await detectColorFromImage(photo.uri);

      if (!isScreenActiveRef.current) {
        return;
      }

      const colorAddSymbol = getColorAddSymbol(response.colorAddSymbol);

      setResult(response);

      if (colorAddSymbol) {
        setLastMappedResult({
          label: colorAddSymbol.label,
          image: colorAddSymbol.image,
          raw: response,
        });
      } else {
        console.log(
          '[Câmera] Símbolo ColorADD não mapeado:',
          response.colorAddSymbol,
        );
      }

      setIsFirstDetection(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a cor.';

      console.error('[Câmera] Erro ao detectar cor:', message);

      if (isScreenActiveRef.current) {
        setErrorMessage(message);
        setIsFirstDetection(false);
      }
    } finally {
      isDetectingRef.current = false;
    }
  }, [isCameraReady]);

  useEffect(() => {
    isScreenActiveRef.current = true;

    return () => {
      isScreenActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!permission?.granted || !isCameraReady) {
      return;
    }

    void detectCurrentColor();

    const intervalId = setInterval(() => {
      void detectCurrentColor();
    }, DETECTION_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [permission?.granted, isCameraReady, detectCurrentColor]);

  async function handleRequestPermission() {
    await requestPermission();
  }

  function handleBack() {
    navigation.goBack();
  }

  function handleSwitchCamera() {
    setFacing((currentFacing) =>
      currentFacing === 'back' ? 'front' : 'back',
    );
  }

  function handleToggleFlash() {
    setIsFlashOn((currentValue) => !currentValue);
  }

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={styles.permissionText}>Preparando câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Permissão de câmera</Text>
        <Text style={styles.permissionText}>
          O ZYRA precisa acessar a câmera para identificar as cores das roupas.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>Permitir câmera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.75}
          style={styles.permissionBackButton}
          onPress={handleBack}
        >
          <Text style={styles.permissionBackText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={isFlashOn}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <View pointerEvents="none" style={styles.darkTopOverlay} />
      <View pointerEvents="none" style={styles.darkBottomOverlay} />

      <View style={styles.topActions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Fechar câmera"
          activeOpacity={0.75}
          style={styles.topIconButton}
          onPress={handleBack}
        >
          <CloseIcon width={28} height={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.resultPill}>
          {lastMappedResult ? (
            <>
              <Image
                source={lastMappedResult.image}
                style={styles.symbolImage}
              />

              <Text style={styles.resultText}>{lastMappedResult.label}</Text>
            </>
          ) : (
            <Text style={styles.waitingText}>apontando...</Text>
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isFlashOn ? 'Desligar flash' : 'Ligar flash'}
          activeOpacity={0.75}
          style={styles.topIconButton}
          onPress={handleToggleFlash}
        >
          {isFlashOn ? (
            <FlashOffIcon width={28} height={28} color="#FFFFFF" />
          ) : (
            <FlashIcon width={28} height={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <View pointerEvents="none" style={styles.crosshair}>
        <View style={styles.crossVertical} />
        <View style={styles.crossHorizontal} />
      </View>

      {warningMessage ? (
        <View style={styles.warningArea}>
          <CameraWarning message={warningMessage} />
        </View>
      ) : null}

      <View style={styles.statusArea} pointerEvents="none">
        {isFirstDetection ? (
          <Text style={styles.statusText}>Aponte para a roupa</Text>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>Verifique a conexão com a API Vision</Text>
        ) : null}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Abrir galeria"
          activeOpacity={0.85}
          style={styles.bottomIconButton}
          onPress={() => console.log('[Câmera] Galeria ainda não integrada.')}
        >
          <GalleryIcon width={34} height={34} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Capturar foto"
          activeOpacity={0.85}
          style={styles.captureOuter}
          onPress={() => void detectCurrentColor()}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Trocar câmera"
          activeOpacity={0.85}
          style={styles.bottomIconButton}
          onPress={handleSwitchCamera}
        >
          <SwitchCameraIcon width={36} height={36} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  darkTopOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 148,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  darkBottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 154,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  topActions: {
    position: 'absolute',
    top: 58,
    left: 22,
    right: 22,
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPill: {
    minWidth: 132,
    maxWidth: 184,
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolImage: {
    width: 46,
    height: 46,
    resizeMode: 'contain',
    marginBottom: 3,
  },
  resultText: {
    color: '#000000',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  waitingText: {
    color: '#000000',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossVertical: {
    position: 'absolute',
    width: 5,
    height: 35,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  crossHorizontal: {
    position: 'absolute',
    width: 35,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  warningArea: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 156,
    zIndex: 10,
  },
  warningBox: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  warningMessage: {
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  statusArea: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 166,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 38,
    right: 38,
    bottom: 42,
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomIconButton: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  permissionTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  permissionBackButton: {
    marginTop: 18,
  },
  permissionBackText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
});