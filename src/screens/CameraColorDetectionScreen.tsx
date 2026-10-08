import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  detectColorFromImage,
  DetectColorResponse,
  validateClothingFromImage,
  ValidateClothingResponse,
} from '../services/visionApi';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { TipoDeImagem, tipoDeImagemAceito } from '../utils/photoUpload';
import { theme } from '../styles/theme';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { ZyraLoadingPopup } from '../components/ZyraLoadingPopup';

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

type Lente = '1x' | '0.5x';

// Faixas escuras de cima (resultado da cor) e de baixo (botões).
const TOP_AREA_HEIGHT = 148;
const BOTTOM_AREA_HEIGHT = 154;
const CROSSHAIR_SIZE = 42;

/**
 * Lente ultra-angular (0,5x) do iPhone, pelo nome que o aparelho dá a ela
 * ("Back Ultra Wide Camera", ou o equivalente no idioma do aparelho).
 */
function acharUltraAngular(lentes: string[]) {
  return lentes.find((lente) => /ultra/i.test(lente));
}

// Preset de captura no iOS (ver o comentário no CameraView).
const PICTURE_SIZE_IOS = '1920x1080';

// Distância do seletor de lente até o pé da prévia.
const LENS_SELECTOR_BOTTOM = 64;

// Tempo da animação do iOS fechando o seletor de fotos. O expo-image-picker
// entrega a foto antes de fechar o seletor; esperar evita navegar para a
// tela da peça com o seletor ainda saindo da tela.
const SELETOR_FECHANDO_MS = 600;

// Tempo que o iOS leva para desligar uma câmera e ligar a outra. Durante ele
// a leitura de cor fica pausada e a prévia escurece de leve.
const LENS_SWITCH_MS = 700;

const DETECTION_INTERVAL_MS = 800;
const FIRST_DETECTION_DELAY_MS = 900;

// Só as etapas gratuitas acontecem ao tirar a foto. O reconhecimento do tipo,
// tecido e estilo fica para o cadastro.
const CAPTURE_STEPS = [
  'Conferindo se é uma peça de roupa',
  'Identificando a cor e o símbolo ColorADD',
];

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
  // Troca de lente em andamento: nenhuma foto é tirada até ela terminar.
  const isTrocandoLenteRef = useRef(false);
  // Galeria aberta por cima da câmera: a leitura de cor fica pausada.
  const isNaGaleriaRef = useRef(false);
  const trocaLenteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lensFade] = useState(() => new Animated.Value(0));

  const [permission, requestPermission] = useCameraPermissions();
  // Com outra tela por cima (peça capturada, galeria do app), a câmera e a
  // leitura de cor param: antes elas seguiam tirando uma foto a cada 0,8 s
  // no fundo, disputando rede e processador com o cadastro da peça.
  const isFocused = useIsFocused();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [result, setResult] = useState<DetectColorResponse | null>(null);
  const [lastMappedResult, setLastMappedResult] =
    useState<MappedColorResult | null>(null);
  const [facing, setFacing] = useState<CameraFacing>('back');
  const [lentesDisponiveis, setLentesDisponiveis] = useState<string[]>([]);
  const [lente, setLente] = useState<Lente>('1x');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isValidatingClothing, setIsValidatingClothing] = useState(false);
  const [frozenPhotoUri, setFrozenPhotoUri] = useState<string | null>(null);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const warningMessage = getFriendlyWarningMessage(result);

  // A ultra-angular só existe na traseira; no Android o expo-camera não
  // informa as lentes, e o seletor não aparece.
  const ultraAngular =
    facing === 'back' ? acharUltraAngular(lentesDisponiveis) : undefined;

  /**
   * Prévia em 3:4, a proporção do sensor e da foto. Ocupando a tela inteira,
   * ela cortava ~40% das laterais da cena e parecia ter zoom; assim ela
   * mostra exatamente o que a foto vai ter, como a câmera do iPhone.
   *
   * Fica entre as faixas de cima e de baixo quando cabe; em tela baixa,
   * centrada na tela, por baixo das faixas.
   */
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const previewHeight = (screenWidth * 4) / 3;
  const espacoLivre = screenHeight - TOP_AREA_HEIGHT - BOTTOM_AREA_HEIGHT;
  const previewTop =
    previewHeight <= espacoLivre
      ? TOP_AREA_HEIGHT + (espacoLivre - previewHeight) / 2
      : (screenHeight - previewHeight) / 2;
  const previewFrame = {
    top: previewTop,
    width: screenWidth,
    height: previewHeight,
  };
  // No pé da parte visível da prévia, nunca por baixo da faixa dos botões.
  const lensSelectorTop =
    Math.min(previewTop + previewHeight, screenHeight - BOTTOM_AREA_HEIGHT) -
    LENS_SELECTOR_BOTTOM;

  const detectCurrentColor = useCallback(async () => {
    if (
      !cameraRef.current ||
      !isCameraReady ||
      isDetectingRef.current ||
      isCapturingPhotoRef.current ||
      isValidatingClothingRef.current ||
      isTrocandoLenteRef.current ||
      isNaGaleriaRef.current
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

      if (trocaLenteTimer.current) clearTimeout(trocaLenteTimer.current);
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
    if (!permission?.granted || !isCameraReady || !isFocused) {
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
  }, [permission?.granted, isCameraReady, isFocused, detectCurrentColor]);

  // Espera a leitura de cor e a troca de lente em andamento terminarem.
  function isCameraOcupada() {
    return isDetectingRef.current || isTrocandoLenteRef.current;
  }

  async function waitForCurrentColorDetection() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      if (!isCameraOcupada()) {
        return true;
      }

      await sleep(120);
    }

    return !isCameraOcupada();
  }

  /**
   * Troca entre 0,5x e 1x. No iOS o expo-camera troca de câmera física (sai
   * uma, entra outra), o que leva um instante. Uma foto da leitura de cor em
   * andamento atrasava a troca, então a leitura pausa até ela terminar; o
   * escurecimento esconde o salto da imagem.
   */
  function handleTrocarLente(opcao: Lente) {
    if (opcao === lente) {
      return;
    }

    isTrocandoLenteRef.current = true;
    if (trocaLenteTimer.current) clearTimeout(trocaLenteTimer.current);

    Animated.timing(lensFade, {
      toValue: 1,
      duration: 90,
      useNativeDriver: true,
    }).start();

    setLente(opcao);

    trocaLenteTimer.current = setTimeout(() => {
      trocaLenteTimer.current = null;
      isTrocandoLenteRef.current = false;

      Animated.timing(lensFade, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, LENS_SWITCH_MS);
  }

  async function handleRequestPermission() {
    await requestPermission();
  }

  function handleBack() {
    navigation.goBack();
  }

  function handleSwitchCamera() {
    setFacing((currentFacing) => (currentFacing === 'back' ? 'front' : 'back'));
    // A lista de lentes muda com a câmera; a frontal sempre começa em 1x.
    setLentesDisponiveis([]);
    setLente('1x');
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

    await validarFoto(capturedPhotoUri, { origem: 'camera' });
  }

  /**
   * Abre a galeria do aparelho. A foto escolhida segue o mesmo caminho da
   * foto tirada: validação de vestuário, cor e tela da peça capturada.
   *
   * A edição fica ligada porque a cor é lida no centro da imagem: recortando,
   * a pessoa põe a peça no meio, como faria com a mira da câmera.
   */
  async function handleAbrirGaleria() {
    if (isValidatingClothingRef.current || isNaGaleriaRef.current) {
      return;
    }

    isNaGaleriaRef.current = true;

    let escolha: ImagePicker.ImagePickerResult;

    try {
      escolha = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        // Só o Android respeita; o recorte do iOS é sempre quadrado.
        aspect: [3, 4],
        quality: 0.65,
        // HEIC (padrão do iPhone) vem convertido para JPEG.
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
    } catch (error) {
      console.error('[Câmera] Falha ao abrir a galeria:', error);

      setPopup({
        variant: 'error',
        title: 'Não foi possível abrir a galeria',
        message: 'Tente novamente ou tire uma foto da peça com a câmera.',
        buttonText: 'Entendi',
      });

      isNaGaleriaRef.current = false;
      return;
    }

    const imagem = escolha.canceled ? null : escolha.assets?.[0];

    if (!imagem) {
      isNaGaleriaRef.current = false;
      return;
    }

    const tipo = tipoDeImagemAceito(imagem.uri, imagem.mimeType);

    // Nenhum popup antes de o seletor sumir; a foto já aparece na prévia.
    if (tipo) setFrozenPhotoUri(imagem.uri);
    if (Platform.OS === 'ios') await sleep(SELETOR_FECHANDO_MS);

    if (!isScreenActiveRef.current) {
      isNaGaleriaRef.current = false;
      return;
    }

    if (!tipo) {
      setPopup({
        variant: 'error',
        title: 'Formato não suportado',
        message: 'Escolha uma foto em JPG, PNG ou WebP.',
        buttonText: 'Entendi',
      });

      isNaGaleriaRef.current = false;
      return;
    }

    // Uma leitura de cor da câmera em andamento termina antes de seguir.
    await waitForCurrentColorDetection();

    isValidatingClothingRef.current = true;
    setIsValidatingClothing(true);

    try {
      await validarFoto(imagem.uri, { origem: 'galeria', tipo });
    } finally {
      isNaGaleriaRef.current = false;
    }
  }

  /**
   * Etapa comum à foto tirada e à escolhida na galeria. Espera que quem
   * chamou já tenha marcado a validação como em andamento.
   */
  async function validarFoto(
    photoUri: string,
    { origem, tipo }: { origem: 'camera' | 'galeria'; tipo?: TipoDeImagem },
  ) {
    try {
      // Só as etapas gratuitas rodam aqui: a validação (CLIP local) e a cor da
      // foto (OpenCV). A análise paga fica para quando a pessoa tocar em
      // "Cadastrar nova peça" — tirar foto não pode gastar com a OpenAI.
      // A cor não é essencial para seguir: se falhar, a câmera usa a última
      // leitura do loop, e a galeria deixa o back ler a cor no cadastro.
      const [validation, corDaFoto] = await Promise.all([
        validateClothingFromImage(photoUri, tipo),
        detectColorFromImage(photoUri, tipo).catch(() => null),
      ]);

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

      // A cor da foto é mais confiável que a última leitura do loop, que pode
      // ser de um instante anterior com a mira em outro ponto. Na galeria a
      // leitura do loop é de outra coisa (o que a câmera está vendo), então
      // ela nunca serve de reserva.
      const leituraDoLoop = origem === 'camera';

      const colorName =
        corDaFoto?.colorName ??
        (leituraDoLoop
          ? (lastMappedResult?.label ?? result?.colorName)
          : null) ??
        null;

      const colorAddSymbol =
        corDaFoto?.colorAddSymbol ??
        (leituraDoLoop
          ? (lastMappedResult?.raw.colorAddSymbol ?? result?.colorAddSymbol)
          : null) ??
        null;

      const hex =
        corDaFoto?.hex ??
        (leituraDoLoop ? (lastMappedResult?.raw.hex ?? result?.hex) : null) ??
        null;

      setFrozenPhotoUri(null);

      navigation.navigate('CapturedClothing', {
        photoUri,
        photoTipo: tipo,
        colorName,
        colorAddSymbol,
        hex,
      });
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
        style={[styles.camera, previewFrame]}
        facing={facing}
        // iOS: desliga a sessão da câmera fora de foco (economiza bateria).
        active={isFocused}
        // iOS: fotos em Full HD em vez da resolução máxima do sensor (12 a
        // 48 MP). A leitura de cor tira uma foto a cada 0,8 s, e cada foto
        // cheia (processamento multiquadro, conversão para JPEG e leitura do
        // arquivo de vários MB pelo JS) engasgava a imagem em intervalos.
        // Com o preset 1080p o preview segue nítido, o enquadramento lateral
        // é o mesmo e a mira continua no centro da foto. A foto do cadastro
        // também sai em 1080×1920, o que basta para o armário e a análise.
        pictureSize={Platform.OS === 'ios' ? PICTURE_SIZE_IOS : undefined}
        enableTorch={isFlashOn}
        // Android: prévia em 4:3, encaixada sem cortar (o iOS segue a view).
        ratio="4:3"
        // Sem valor, o iOS usa a lente principal (1x).
        selectedLens={lente === '0.5x' ? ultraAngular : undefined}
        onAvailableLensesChanged={(event) => setLentesDisponiveis(event.lenses)}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {frozenPhotoUri ? (
        <Image
          source={{ uri: frozenPhotoUri }}
          style={[styles.frozenPreview, previewFrame]}
        />
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.lensFade,
          previewFrame,
          {
            opacity: lensFade.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            }),
          },
        ]}
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
          ) : null}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isFlashOn ? 'Desligar flash' : 'Ligar flash'}
          activeOpacity={0.75}
          style={styles.topIconButton}
          onPress={handleToggleFlash}
        >
          {/* O ícone mostra o estado atual, como na câmera do iPhone: raio
              cortado com o flash desligado, raio inteiro com ele ligado. */}
          {isFlashOn ? (
            <FlashIcon width={28} height={28} color="#FFFFFF" />
          ) : (
            <FlashOffIcon width={28} height={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* No centro da prévia, que é o centro da foto: é ali que a visão lê
          a cor. */}
      <View
        pointerEvents="none"
        style={[
          styles.crosshair,
          { top: previewTop + previewHeight / 2 - CROSSHAIR_SIZE / 2 },
        ]}
      >
        <View style={styles.crossVertical} />
        <View style={styles.crossHorizontal} />
      </View>

      {ultraAngular ? (
        <View
          pointerEvents="box-none"
          style={[styles.lensSelectorRow, { top: lensSelectorTop }]}
        >
          <View style={styles.lensSelector}>
            {(['0.5x', '1x'] as const).map((opcao) => {
              const ativa = lente === opcao;

              return (
                <TouchableOpacity
                  key={opcao}
                  accessibilityRole="button"
                  accessibilityLabel={
                    opcao === '0.5x'
                      ? 'Zoom 0,5x, mostra mais da cena'
                      : 'Zoom 1x, normal'
                  }
                  accessibilityState={{ selected: ativa }}
                  activeOpacity={0.8}
                  style={[styles.lensButton, ativa && styles.lensButtonActive]}
                  onPress={() => handleTrocarLente(opcao)}
                >
                  <Text
                    style={[styles.lensText, ativa && styles.lensTextActive]}
                  >
                    {opcao === '0.5x' ? '0,5x' : '1x'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {warningMessage ? (
        <View style={styles.warningArea}>
          <CameraWarning message={warningMessage} />
        </View>
      ) : null}

      {/* Montado só enquanto valida: assim o popup recomeça da primeira
          etapa a cada foto, sem precisar zerar o estado por dentro. */}
      {isValidatingClothing ? (
        <ZyraLoadingPopup
          modal={false}
          visible
          title="Conferindo sua foto"
          steps={CAPTURE_STEPS}
        />
      ) : null}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Abrir galeria"
          activeOpacity={0.85}
          style={styles.bottomIconButton}
          disabled={isValidatingClothing}
          onPress={handleAbrirGaleria}
        >
          <GalleryIcon width={34} height={34} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Capturar foto"
          activeOpacity={0.85}
          style={styles.captureOuter}
          disabled={isValidatingClothing}
          onPress={handleCaptureAndValidateClothing}
        >
          {/* Anel branco com vão e centro no degradê rosa do app: o branco
              maciço de antes pesava demais ao lado dos ícones de traço. */}
          <LinearGradient
            colors={theme.gradientPrimary.colors}
            locations={theme.gradientPrimary.locations}
            start={theme.gradientPrimary.start}
            end={theme.gradientPrimary.end}
            style={styles.captureInner}
          >
            {isValidatingClothing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : null}
          </LinearGradient>
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
        modal={false}
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
  // Posição e tamanho vêm do previewFrame (3:4, entre as faixas).
  camera: {
    position: 'absolute',
    left: 0,
  },
  frozenPreview: {
    position: 'absolute',
    left: 0,
    resizeMode: 'cover',
  },
  lensFade: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#000000',
  },
  // Seletor de lente no pé da prévia, como na câmera do iPhone.
  lensSelectorRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lensSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  lensButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A ativa tem fundo branco e texto maior: não depende só da cor.
  lensButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  lensText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
  },
  lensTextActive: {
    color: '#000000',
    fontFamily: theme.fonts.bold,
    fontSize: 13,
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
    left: '50%',
    width: CROSSHAIR_SIZE,
    height: CROSSHAIR_SIZE,
    marginLeft: -CROSSHAIR_SIZE / 2,
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
  // Proporção do obturador do iPhone: anel de 4 px e um vão de 3 px até o
  // centro, para o anel e o centro se lerem como duas partes.
  captureOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
