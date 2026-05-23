import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../styles/theme';
import BackIcon from '../../assets/icons/back-svgrepo-com.svg';

type Props = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
};

export function AuthLayout({ title = 'Crie uma conta', children, footer, onBack }: Props) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {onBack && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          activeOpacity={0.8}
          style={styles.backButton}
        >
          <BackIcon width={32} height={32} style={styles.backIcon} />
        </TouchableOpacity>
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 54,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    width: 16,
    height: 16,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.screen,
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: theme.spacing.screen,
    paddingBottom: 28,
  },
});
