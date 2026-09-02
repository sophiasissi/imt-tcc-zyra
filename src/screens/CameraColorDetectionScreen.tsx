import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  detectColorFromImage,
  DetectColorResponse,
  validateClothingFromImage,
  ValidateClothingResponse,
} from '../services/visionApi';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { theme } from '../styles/theme';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';

import GalleryIcon from '../../assets/icons/photo-svgrepo-com.svg';
import SwitchCameraIcon from '../../assets/icons/switch-horizontal-svgrepo-com (1).svg';
import CloseIcon from '../../assets/icons/close-svgrepo-com.svg';
import FlashIcon from '../../assets/icons/flash-svgrepo-com.svg';
import FlashOffIcon from '../../assets/icons/flash-off-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraColorDetection'>;

type CameraFacing = 'back' | 'front';

type CameraWarningProps = {
  message: string;
};

type MappedColorResult = {
  label: string;
  image: ImageSourcePropType;
  raw: DetectColorResponse;
};

const DETECTION_INTERVAL_MS = 800;
const FIRST_DETECTION_DELAY_MS = 900;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getFriendlyWarningMessage(result?: DetectColorResponse | null) {
  if (!result?.warningCode) {
    return null;
  }

  const warningCode = result.warningCode.toUpperCase();

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

function getInvalidClothingMessage(validation: ValidateClothingResponse) {
  const reason = validation.reason?.toUpperCase();

  if (reason === 'PERSON_DETECTED') {
    return 'Tente fotografar apenas a peça de roupa, sem rosto ou corpo inteiro.';
  }

  if (reason === 'NOT_CLOTHING') {
    return 'Não identificamos uma peça de roupa. Tente fotografar a peça novamente.';
  }

  return 'Não conseguimos confirmar que isso é uma peça de roupa. Tente fotografar novamente.';
}

function isCameraWarmupError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes('image could not be captured');
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
  const isCapturingPhotoRef = useRef(false);
  const isValidatingClothingRef = useRef(false);
  const isScreenActiveRef = useRef(true);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [result, setResult] = useState<DetectColorResponse | null>(null);
  const [lastMappedResult, setLastMappedResult] =
    useState<MappedColorResult | null>(null);
  const [facing, setFacing] = useState<CameraFacing>('back');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isValidatingClothing, setIsValidatingClothing] = useState(false);
  const [frozenPhotoUri, setFrozenPhotoUri] = useState<string | null>(null);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const warningMessage = getFriendlyWarningMessage(result);

  const detectCurrentColor = useCallback(async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isDetectingRef.current ||
      isCapturingPhotoRef.current ||
      isValidatingClothingRef.current
    ) {
      return;
    }

    try {
      isDetectingRef.current = true;

      // skipProcessing NÃO pode ser usado aqui: ele entrega a imagem crua do
      // sensor, sem ajuste de orientação e sem escalar para o preview. O
      // sensor é landscape e o preview é portrait ocupando a tela toda, então
      // a foto passava a conter muito mais cena do que o usuário via — e o
      // recorte central acabava misturando parede, fundo e sombra, cuja média
      // é sempre cinza. A flag também descarta o `quality`.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
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
    } catch (error) {
      if (isCameraWarmupError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível identificar a cor.';

      console.error('[Câmera] Erro ao detectar cor:', message);
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
  useFocusEffect(
    useCallback(() => {
      setFrozenPhotoUri(null);
      setIsValidatingClothing(false);

      isCapturingPhotoRef.current = false;
      isValidatingClothingRef.current = false;

      return undefined;
    }, []),
  );

  useEffect(() => {
    if (!permission?.granted || !isCameraReady) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const firstDetectionTimeoutId = setTimeout(() => {
      void detectCurrentColor();

      intervalId = setInterval(() => {
        void detectCurrentColor();
      }, DETECTION_INTERVAL_MS);
    }, FIRST_DETECTION_DELAY_MS);

    return () => {
      clearTimeout(firstDetectionTimeoutId);

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [permission?.granted, isCameraReady, detectCurrentColor]);

  async function waitForCurrentColorDetection() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (!isDetectingRef.current) {
        return true;
      }

      await sleep(120);
    }

    return !isDetectingRef.current;
  }

  async function handleRequestPermission() {
    await requestPermission();
  }

  function handleBack() {
    navigation.goBack();
  }

  function handleSwitchCamera() {
    setFacing((currentFacing) => (currentFacing === 'back' ? 'front' : 'back'));
    setResult(null);
    setLastMappedResult(null);
    setFrozenPhotoUri(null);
    setPopup(null);
  }

  function handleToggleFlash() {
    setIsFlashOn((currentValue) => !currentValue);
  }

  function handleConfirmPopup() {
    const onConfirm = popup?.onConfirm;

    setPopup(null);

    if (onConfirm) {
      onConfirm();
    }
  }

  async function handleCaptureAndValidateClothing() {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isValidatingClothingRef.current
    ) {
      return;
    }

    const cameraAvailable = await waitForCurrentColorDetection();

    if (!cameraAvailable || !cameraRef.current) {
      setPopup({
        variant: 'info',
        title: 'Câmera preparando',
        message:
          'A câmera ainda está ajustando a imagem. Tente novamente em alguns segundos.',
        buttonText: 'Entendi',
      });

      return;
    }

    let capturedPhotoUri: string | null = null;

    try {
      isValidatingClothingRef.current = true;
      isCapturingPhotoRef.current = true;
      setIsValidatingClothing(true);

      // Sem skipProcessing pelo mesmo motivo do loop de detecção — e aqui a
      // orientação importa ainda mais, porque esta foto é exibida na tela de
      // roupa capturada, onde o Image não respeita o EXIF.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        base64: false,
      });

      capturedPhotoUri = photo?.uri ?? null;

      if (capturedPhotoUri && isScreenActiveRef.current) {
        setFrozenPhotoUri(capturedPhotoUri);
      }
    } catch (error) {
      if (isCameraWarmupError(error)) {
        setPopup({
          variant: 'info',
          title: 'Câmera preparando',
          message: 'A câmera ainda está preparando a imagem. Tente novamente.',
          buttonText: 'Entendi',
        });

        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível capturar a foto.';

      console.error('[Câmera] Erro ao capturar foto:', message);

      setPopup({
        variant: 'error',
        title: 'Não foi possível capturar',
        message: 'Não conseguimos tirar a foto agora. Tente novamente.',
        buttonText: 'Entendi',
      });

      return;
    } finally {
      isCapturingPhotoRef.current = false;
    }

    if (!capturedPhotoUri || !isScreenActiveRef.current) {
      isValidatingClothingRef.current = false;
      setIsValidatingClothing(false);
      setFrozenPhotoUri(null);
      return;
    }

    try {
      const validation = await validateClothingFromImage(capturedPhotoUri);

      if (!isScreenActiveRef.current) {
        return;
      }

      if (!validation.isClothing) {
        setFrozenPhotoUri(null);

        setPopup({
          variant: 'error',
          title: 'Não é uma peça de roupa',
          message: getInvalidClothingMessage(validation),
          buttonText: 'Tentar novamente',
        });

        return;
      }

      const currentColorName =
        lastMappedResult?.label ?? result?.colorName ?? null;

      const currentColorAddSymbol =
        lastMappedResult?.raw.colorAddSymbol ?? result?.colorAddSymbol ?? null;

      setFrozenPhotoUri(null);

      navigation.navigate('CapturedClothing', {
        photoUri: capturedPhotoUri,
        colorName: currentColorName,
        colorAddSymbol: currentColorAddSymbol,
      });

      console.log('[Câmera] Peça validada com sucesso:', validation);
    } catch (error) {
      setFrozenPhotoUri(null);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível validar a peça de roupa.';

      console.error('[Câmera] Erro ao validar peça:', message);

      if (isScreenActiveRef.current) {
        setPopup({
          variant: 'error',
          title: 'Não foi possível validar',
          message:
            'Não foi possível validar a peça agora. Verifique a API Vision e tente novamente.',
          buttonText: 'Entendi',
        });
      }
    } finally {
      isValidatingClothingRef.current = false;

      if (isScreenActiveRef.current) {
        setIsValidatingClothing(false);
      }
    }
  }

  if (!permission) {
    return (
      <View style={styles.permissionScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
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

      {frozenPhotoUri ? (
        <Image source={{ uri: frozenPhotoUri }} style={styles.frozenPreview} />
      ) : null}

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
          ) : null}
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

      {isValidatingClothing && frozenPhotoUri ? (
        <View style={styles.freezeLoadingOverlay}>
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.freezeLoadingText}>Validando peça...</Text>
        </View>
      ) : null}

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
          style={[
            styles.captureOuter,
            isValidatingClothing && styles.captureOuterLoading,
          ]}
          disabled={isValidatingClothing}
          onPress={handleCaptureAndValidateClothing}
        >
          {isValidatingClothing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.captureInner} />
          )}
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

      <ZyraPopup
        visible={Boolean(popup)}
        variant={popup?.variant ?? 'info'}
        title={popup?.title ?? ''}
        message={popup?.message}
        buttonText={popup?.buttonText ?? 'Entendi'}
        showCloseButton={false}
        customIcon={popup?.customIcon}
        onConfirm={handleConfirmPopup}
      />
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
  frozenPreview: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
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
  freezeLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 148,
    bottom: 154,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeLoadingText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    marginTop: 10,
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
  captureOuterLoading: {
    backgroundColor: 'rgba(255,255,255,0.18)',
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
