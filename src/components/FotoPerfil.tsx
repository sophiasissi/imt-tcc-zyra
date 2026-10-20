import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  /** URL assinada da foto (muda a cada login), ou null para o círculo rosa. */
  uri: string | null | undefined;
  tamanho: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chave do cache: o caminho da foto no S3, sem a assinatura. A URL assinada
 * muda a cada vez que o perfil é lido, mas o caminho só muda quando a pessoa
 * troca de foto; assim a foto aparece na hora ao voltar para a tela.
 */
function chaveDoCache(uri: string) {
  return uri.split('?')[0];
}

/** Foto de perfil redonda, com o degradê do ZYRA quando não há foto. */
export function FotoPerfil({ uri, tamanho, style }: Props) {
  const forma = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  return (
    <View style={[forma, styles.recorte, style]}>
      {uri ? (
        <Image
          source={{ uri, cacheKey: chaveDoCache(uri) }}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={150}
          style={StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient
          colors={['#DE0051', '#AB003E', '#78002C']}
          locations={[0.25, 0.65, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recorte: {
    overflow: 'hidden',
  },
});
