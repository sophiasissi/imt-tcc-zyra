import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import BackArrowIcon from '../../assets/icons/backArrow.svg';
import { ZyraButton } from './ZyraButton';
import { theme } from '../styles/theme';

/**
 * Os campos (ZyraInput) avisam o layout quando recebem foco, para ele rolar
 * até o campo e o teclado ou o botão não o cobrirem.
 */
const CampoFocadoContext = createContext<(campo: View | null) => void>(
  () => undefined,
);

export function useAvisarCampoFocado() {
  return useContext(CampoFocadoContext);
}

// Espaço entre o campo focado e a borda da área visível.
const MARGEM_DO_CAMPO = 16;

// Curva da animação do teclado do iOS (a mesma do chat).
const KEYBOARD_EASING = Easing.bezier(0.38, 0.7, 0.125, 1);

type Props = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  showHeader?: boolean;
  footerButtonTitle?: string;
  onFooterButtonPress?: () => void;
  footerButtonDisabled?: boolean;
  onBack?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  /**
   * false para telas sem campos que precisam caber inteiras (com ilustração
   * que encolhe): sem a área rolável, o conteúdo nunca passa da tela.
   */
  rolavel?: boolean;
};

export function AuthLayout({
  title,
  children,
  footer,
  footerButtonTitle,
  onFooterButtonPress,
  footerButtonDisabled = false,
  showHeader = true,
  onBack,
  contentStyle,
  titleStyle,
  rolavel = true,
}: Props) {
  const hasDefaultFooterButton = Boolean(
    footerButtonTitle && onFooterButtonPress,
  );

  const containerRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const campoFocado = useRef<View | null>(null);
  const alturaVisivel = useRef(0);
  const alturaConteudo = useRef(0);
  const rolagem = useRef(0);
  const tecladoAberto = useRef(false);
  // Espaço que o teclado ocupa na parte de baixo da tela, animado junto com ele.
  const [espacoDoTeclado] = useState(() => new Animated.Value(0));
  const [podeRolar, setPodeRolar] = useState(false);

  // Só rola quando o conteúdo não cabe (por exemplo, com o teclado aberto).
  // Quando cabe, a tela fica parada mesmo arrastando o dedo.
  const atualizarRolagem = useCallback(() => {
    setPodeRolar(alturaConteudo.current > alturaVisivel.current + 1);
  }, []);

  // Rola só o necessário para o campo focado ficar inteiro na área visível.
  const revelarCampoFocado = useCallback(() => {
    const campo = campoFocado.current;
    // getInnerViewRef existe no ScrollView, mas falta nos tipos do React Native.
    const conteudo = (
      scrollRef.current as unknown as { getInnerViewRef(): View | null } | null
    )?.getInnerViewRef();

    if (!campo || !conteudo || !alturaVisivel.current) {
      return;
    }

    campo.measureLayout(
      conteudo,
      (_x, y, _largura, altura) => {
        const topo = rolagem.current;
        const base = topo + alturaVisivel.current;

        if (y - MARGEM_DO_CAMPO < topo) {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - MARGEM_DO_CAMPO) });
        } else if (y + altura + MARGEM_DO_CAMPO > base) {
          scrollRef.current?.scrollTo({
            y: y + altura + MARGEM_DO_CAMPO - alturaVisivel.current,
          });
        }
      },
      () => undefined,
    );
  }, []);

  useEffect(() => {
    // Mesma técnica do chat: o espaço cresce com a duração e a curva do
    // próprio teclado, então os campos e o botão sobem junto com ele.
    function animarEspaco(valor: number, duracao?: number) {
      Animated.timing(espacoDoTeclado, {
        toValue: valor,
        duration: duracao || 250,
        easing: KEYBOARD_EASING,
        useNativeDriver: false,
      }).start(({ finished }) => {
        // Depois que o teclado terminou de abrir, garante o campo à vista.
        if (finished && tecladoAberto.current) revelarCampoFocado();
      });
    }

    function aoMostrar(evento: KeyboardEvent) {
      tecladoAberto.current = true;
      // Quanto o teclado cobre da tela, a partir da borda de baixo do layout
      // (já descontada a área segura do iPhone).
      containerRef.current?.measureInWindow((_x, y, _largura, altura) => {
        animarEspaco(
          Math.max(0, y + altura - evento.endCoordinates.screenY),
          evento.duration,
        );
      });
    }

    function aoEsconder(evento?: KeyboardEvent) {
      tecladoAberto.current = false;
      campoFocado.current = null;
      animarEspaco(0, evento?.duration);
    }

    const mostrar =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const esconder =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const assinaturaMostrar = Keyboard.addListener(mostrar, aoMostrar);
    const assinaturaEsconder = Keyboard.addListener(esconder, aoEsconder);

    return () => {
      assinaturaMostrar.remove();
      assinaturaEsconder.remove();
    };
  }, [espacoDoTeclado, revelarCampoFocado]);

  const avisarCampoFocado = useCallback(
    (campo: View | null) => {
      campoFocado.current = campo;
      // Trocando de campo com o teclado já aberto, rola na hora. Na primeira
      // vez, espera o teclado terminar de abrir (ver animarEspaco).
      if (tecladoAberto.current) requestAnimationFrame(revelarCampoFocado);
    },
    [revelarCampoFocado],
  );

  return (
    <CampoFocadoContext.Provider value={avisarCampoFocado}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          ref={containerRef}
          style={[styles.container, { paddingBottom: espacoDoTeclado }]}
        >
          {showHeader ? (
            <View style={styles.header}>
              {onBack ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Voltar"
                  activeOpacity={0.8}
                  style={styles.backButton}
                  onPress={onBack}
                >
                  <BackArrowIcon width={26} height={26} />
                </TouchableOpacity>
              ) : null}
              {title ? (
                <Text style={[styles.title, titleStyle]}>{title}</Text>
              ) : null}
            </View>
          ) : null}

          {!rolavel ? (
            <View
              style={[
                styles.scroll,
                styles.content,
                !showHeader && styles.contentNoHeader,
                contentStyle,
              ]}
            >
              {children}
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                !showHeader && styles.contentNoHeader,
                contentStyle,
              ]}
              scrollEnabled={podeRolar}
              bounces={false}
              alwaysBounceVertical={false}
              overScrollMode="never"
              onLayout={(event) => {
                alturaVisivel.current = event.nativeEvent.layout.height;
                atualizarRolagem();
              }}
              onContentSizeChange={(_largura, altura) => {
                alturaConteudo.current = altura;
                atualizarRolagem();
              }}
              onScroll={(event) => {
                rolagem.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="never"
              keyboardDismissMode={
                Platform.OS === 'ios' ? 'interactive' : 'on-drag'
              }
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          )}

          {hasDefaultFooterButton ? (
            <View style={styles.footer}>
              <ZyraButton
                title={footerButtonTitle!}
                onPress={onFooterButtonPress ?? (() => undefined)}
                disabled={footerButtonDisabled}
              />
            </View>
          ) : footer ? (
            <View style={styles.footer}>{footer}</View>
          ) : null}
        </Animated.View>
      </SafeAreaView>
    </CampoFocadoContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    minHeight: 80,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 18,
    top: 14,
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 20,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: 22,
    paddingLeft: 26,
    paddingRight: theme.spacing.screen,
  },
  contentNoHeader: {
    paddingTop: 0,
  },
  footer: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 28,
  },
});
