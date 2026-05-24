import { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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
}: Props) {
  const hasDefaultFooterButton = Boolean(footerButtonTitle && onFooterButtonPress);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            !showHeader && styles.contentNoHeader,
            contentStyle,
          ]}
          keyboardShouldPersistTaps="never"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
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
