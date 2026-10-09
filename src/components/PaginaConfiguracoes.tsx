import { ReactNode } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { theme } from '../styles/theme';

import BackIcon from '../../assets/icons/backArrow.svg';

type Props = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

/**
 * Página de texto aberta pelas Configurações: o mesmo cabeçalho de
 * Informações pessoais (voltar + título) e o conteúdo rolando embaixo.
 */
export function PaginaConfiguracoes({ title, onBack, children }: Props) {
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
          onPress={onBack}
        >
          <BackIcon width={26} height={26} />
        </TouchableOpacity>

        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Seção com título, para as páginas de Configurações. */
export function SecaoPagina({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

export function ParagrafoPagina({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

/** Item de lista com marcador, para recursos e limitações. */
export function ItemPagina({ children }: { children: ReactNode }) {
  return (
    <View style={styles.item}>
      <View style={styles.bullet} />
      <Text style={styles.itemText}>{children}</Text>
    </View>
  );
}

export const paginaStyles = StyleSheet.create({
  destaque: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.title,
  },
});

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
    flexShrink: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    marginBottom: 10,
  },
  paragraph: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
});
