import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { theme } from '../styles/theme';

import LeftArrowIcon from '../../assets/icons/left-arrow-svgrepo-com.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'CapturedClothing'>;

export function CapturedClothingScreen({ navigation, route }: Props) {
  const { photoUri, colorName, colorAddSymbol } = route.params;

  const symbol = getColorAddSymbol(colorAddSymbol);
  const displayedColorName = symbol?.label ?? colorName ?? '';

  function handleGoBack() {
    navigation.goBack();
  }

  return (
    <LinearGradient
      colors={['#AB003E', '#D66A92', '#FAF9F6']}
      locations={[0, 0.45, 0.72]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            activeOpacity={0.75}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <LeftArrowIcon width={28} height={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.colorHeader}>
            {symbol ? (
              <Image
                source={symbol.image}
                style={styles.colorSymbol}
                tintColor="#FFFFFF"
              />
            ) : null}

            {displayedColorName ? (
              <Text style={styles.colorText}>{displayedColorName}</Text>
            ) : null}
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: photoUri }} style={styles.clothingImage} />

          <View style={styles.bottomContent}>
            <Text style={styles.sectionTitle}>
              Peças do seu armário que combinam
            </Text>

            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>
                Ainda não há combinações disponíveis
              </Text>

              <Text style={styles.emptyStateText}>
                Cadastre mais peças no seu closet para o ZYRA sugerir
                combinações com esta roupa.
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              activeOpacity={1}
              disabled
              style={styles.disabledButton}
            >
              <Text style={styles.disabledButtonText}>Cadastrar nova peça</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 86,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  colorHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  colorSymbol: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  colorText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  clothingImage: {
    width: '100%',
    height: 390,
    borderRadius: 18,
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  bottomContent: {
    marginTop: 28,
    backgroundColor: 'rgba(250, 249, 246, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
  },
  sectionTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyStateBox: {
    minHeight: 126,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  disabledButton: {
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(171, 0, 62, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  disabledButtonText: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
});