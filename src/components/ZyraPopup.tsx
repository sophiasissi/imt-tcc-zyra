import { ReactNode } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { theme } from '../styles/theme';
import { ZyraButton } from './ZyraButton';

export type ZyraPopupVariant = 'success' | 'error' | 'warning' | 'info';

export type ZyraPopupConfig = {
  variant?: ZyraPopupVariant;
  title: string;
  message?: string;
  buttonText?: string;
  showCloseButton?: boolean;
  customIcon?: React.ReactNode;
  onConfirm?: () => void;
  /** Segundo botão, para perguntas de duas respostas (ex.: Sim e Não). */
  secondaryButtonText?: string;
  onSecondary?: () => void;
  /** Trava o botão principal enquanto a ação dele roda. */
  confirmDisabled?: boolean;
};

type Props = ZyraPopupConfig & {
  visible: boolean;
  onConfirm: () => void;
  onClose?: () => void;
  /**
   * false: desenha o popup como uma camada dentro da tela, em vez de um
   * Modal nativo. No iOS, um Modal abrindo ou fechando junto com outra
   * transição (seletor de fotos, navegação, outro Modal) é descartado em
   * silêncio e deixa uma camada invisível que trava os toques. Use false nas
   * telas em que o popup some e a navegação acontece no mesmo instante.
   */
  modal?: boolean;
};

const variantConfig: Record<
  ZyraPopupVariant,
  {
    icon: string;
    accessibilityLabel: string;
  }
> = {
  success: {
    icon: '✓',
    accessibilityLabel: 'Sucesso',
  },
  error: {
    icon: '!',
    accessibilityLabel: 'Erro',
  },
  warning: {
    icon: '!',
    accessibilityLabel: 'Atenção',
  },
  info: {
    icon: 'i',
    accessibilityLabel: 'Informação',
  },
};

export function ZyraPopup({
  visible,
  variant = 'info',
  title,
  message,
  buttonText = 'Entendi',
  showCloseButton = false,
  customIcon,
  onConfirm,
  onClose,
  secondaryButtonText,
  onSecondary,
  confirmDisabled = false,
  modal = true,
}: Props) {
  const currentVariant = variantConfig[variant];

  function envolver(conteudo: ReactNode) {
    if (!modal) {
      // accessibilityViewIsModal: o VoiceOver fica só dentro do popup, como
      // num Modal de verdade.
      return visible ? (
        <View style={styles.inlineLayer} accessibilityViewIsModal>
          {conteudo}
        </View>
      ) : null;
    }

    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={onClose ?? onConfirm}
      >
        {conteudo}
      </Modal>
    );
  }

  return envolver(
    <View style={styles.overlay}>
      <View
        style={styles.card}
        accessibilityRole="alert"
        accessibilityLabel={`${currentVariant.accessibilityLabel}: ${title}`}
      >
        {showCloseButton ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            activeOpacity={0.75}
            style={styles.closeButton}
            onPress={onClose ?? onConfirm}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        ) : null}

        {customIcon ? (
          <View style={styles.customIconWrapper}>{customIcon}</View>
        ) : (
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{currentVariant.icon}</Text>
          </View>
        )}

        <Text style={styles.title}>{title}</Text>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <ZyraButton
          title={buttonText}
          onPress={onConfirm}
          disabled={confirmDisabled}
          style={styles.actionButton}
        />

        {secondaryButtonText && onSecondary ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={secondaryButtonText}
            activeOpacity={0.75}
            disabled={confirmDisabled}
            style={[
              styles.secondaryButton,
              confirmDisabled && styles.secondaryButtonDisabled,
            ]}
            onPress={onSecondary}
          >
            <Text style={styles.secondaryButtonText}>
              {secondaryButtonText}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>,
  );
}

const styles = StyleSheet.create({
  // Por cima de tudo na tela que o usa (deve ser o último filho da raiz).
  inlineLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.semiBold,
    fontSize: 22,
    lineHeight: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.extraBold,
    fontSize: 34,
    lineHeight: 40,
  },
  title: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    height: 50,
  },
  // Contornado, para a resposta principal continuar sendo a mais visível.
  secondaryButton: {
    width: '100%',
    height: 50,
    marginTop: 12,
    borderRadius: theme.radius.button,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    fontSize: 20,
  },
  customIconWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});
