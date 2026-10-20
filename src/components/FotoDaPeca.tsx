import { StyleProp } from 'react-native';
import { Image, ImageLoadEventData, ImageStyle } from 'expo-image';

type Props = {
  /** URL assinada (muda a cada leitura); o cache usa só o caminho da foto. */
  uri: string;
  style?: StyleProp<ImageStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
  /** Tamanho real da foto, quando ela carrega (a colagem usa para pôr a etiqueta ao lado). */
  onLoad?: (evento: ImageLoadEventData) => void;
};

/**
 * Foto da peça com cache em memória e em disco.
 *
 * A chave do cache é o caminho da foto no S3, sem a assinatura: a URL assinada
 * muda toda vez que o armário é lido, e sem isso o celular baixava todas as
 * fotos de novo a cada abertura.
 *
 * `contain`: a peça (quase sempre sem fundo) aparece inteira no card, sem as
 * bordas cortadas.
 */
export function FotoDaPeca({
  uri,
  style,
  accessible,
  accessibilityLabel,
  onLoad,
}: Props) {
  return (
    <Image
      source={{ uri, cacheKey: uri.split('?')[0] }}
      cachePolicy="memory-disk"
      contentFit="contain"
      transition={120}
      style={style}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      onLoad={onLoad}
    />
  );
}
