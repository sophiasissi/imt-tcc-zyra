import { ReactNode, useEffect } from 'react';
import {
  AppState,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PermissionResponse, useCameraPermissions } from 'expo-camera';
import {
  MediaLibraryPermissionResponse,
  useMediaLibraryPermissions,
} from 'expo-image-picker';

import {
  PaginaConfiguracoes,
  SecaoPagina,
} from '../components/PaginaConfiguracoes';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../styles/theme';

import CameraIcon from '../../assets/icons/camera.svg';
import GalleryIcon from '../../assets/icons/photo-svgrepo-com (1).svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

/**
 * Permissões do app, com o estado real do celular.
 *
 * A tela antiga tinha interruptores que só mudavam na tela. Um app não
 * consegue retirar a própria permissão: isso só se faz nos Ajustes do
 * celular, e por isso o botão leva até lá.
 *
 * Câmera e fotos pedem permissão (as fotos, por decisão da Sophia em
 * 09/10/2026: a CameraColorDetectionScreen pede antes de abrir a galeria).
 */
export function PermissionsScreen({ navigation }: Props) {
  const [camera, pedirCamera, lerCamera] = useCameraPermissions();
  const [fotos, pedirFotos, lerFotos] = useMediaLibraryPermissions();

  // Quem volta dos Ajustes encontra o estado já atualizado.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        void lerCamera();
        void lerFotos();
      }
    });

    return () => assinatura.remove();
  }, [lerCamera, lerFotos]);

  async function abrirAjustes() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('[Permissões] Falha ao abrir os Ajustes:', error);
    }
  }

  const estadoCamera = descrever(camera);
  const estadoFotos = descrever(fotos);

  return (
    <PaginaConfiguracoes title="Permissões" onBack={() => navigation.goBack()}>
      <SecaoPagina titulo="Câmera">
        <CartaoPermissao
          icone={<CameraIcon width={24} height={24} />}
          nome="Câmera"
          uso="Para identificar cores e fotografar suas peças."
          estado={estadoCamera}
          carregado={Boolean(camera)}
          textoPedir="Permitir câmera"
          onPedir={() => void pedirCamera()}
          onAbrirAjustes={() => void abrirAjustes()}
        />
      </SecaoPagina>

      <SecaoPagina titulo="Fotos">
        <CartaoPermissao
          icone={<GalleryIcon width={24} height={24} />}
          nome="Fotos"
          uso="Para cadastrar uma peça com uma foto que você já tem."
          estado={estadoFotos}
          carregado={Boolean(fotos)}
          textoPedir="Permitir fotos"
          onPedir={() => void pedirFotos()}
          onAbrirAjustes={() => void abrirAjustes()}
        />
      </SecaoPagina>
    </PaginaConfiguracoes>
  );
}

type Estado = { texto: string; permitida: boolean; podePedir: boolean };

function descrever(
  permissao: PermissionResponse | MediaLibraryPermissionResponse | null,
): Estado {
  if (!permissao) {
    return { texto: 'Verificando...', permitida: false, podePedir: false };
  }

  if (permissao.granted) {
    // iOS: a pessoa escolheu só algumas fotos que o app pode ver.
    const limitada =
      'accessPrivileges' in permissao &&
      permissao.accessPrivileges === 'limited';

    return {
      texto: limitada ? 'Acesso limitado a algumas fotos' : 'Permitida',
      permitida: true,
      podePedir: false,
    };
  }

  // Ainda não perguntada, ou recusada uma vez no Android: o app pode pedir.
  if (permissao.canAskAgain) {
    return {
      texto:
        permissao.status === 'undetermined'
          ? 'Ainda não pedida'
          : 'Não permitida',
      permitida: false,
      podePedir: true,
    };
  }

  // Recusada de vez: só os Ajustes do celular liberam.
  return { texto: 'Não permitida', permitida: false, podePedir: false };
}

function CartaoPermissao({
  icone,
  nome,
  uso,
  estado,
  carregado,
  textoPedir,
  onPedir,
  onAbrirAjustes,
}: {
  icone: ReactNode;
  nome: string;
  uso: string;
  estado: Estado;
  carregado: boolean;
  textoPedir: string;
  onPedir: () => void;
  onAbrirAjustes: () => void;
}) {
  return (
    <View style={styles.cartao}>
      <View style={styles.linha}>
        {icone}
        <View style={styles.textos}>
          <Text style={styles.nome}>{nome}</Text>
          <Text style={styles.uso}>{uso}</Text>
        </View>
      </View>

      <View
        style={styles.estado}
        accessible
        accessibilityLabel={`${nome}: ${estado.texto}`}
      >
        <View
          style={[
            styles.bolinha,
            { backgroundColor: estado.permitida ? '#2E7D32' : '#9E9E9E' },
          ]}
        />
        <Text style={styles.estadoTexto}>{estado.texto}</Text>
      </View>

      {carregado ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          style={styles.botao}
          onPress={estado.podePedir ? onPedir : onAbrirAjustes}
        >
          <Text style={styles.botaoTexto}>
            {estado.podePedir ? textoPedir : 'Alterar nos Ajustes do celular'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  textos: {
    flex: 1,
  },
  nome: {
    color: theme.colors.title,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  uso: {
    color: theme.colors.muted,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  // A cor só reforça: o estado está sempre escrito ao lado.
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  estadoTexto: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  botao: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  botaoTexto: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
  },
});
