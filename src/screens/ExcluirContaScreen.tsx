import { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AuthLayout } from '../components/AuthLayout';
import { ItemPagina } from '../components/PaginaConfiguracoes';
import { ZyraButton } from '../components/ZyraButton';
import { ZyraInput } from '../components/ZyraInput';
import { ZyraPopup, ZyraPopupConfig } from '../components/ZyraPopup';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../services/api';
import { theme } from '../styles/theme';

import EyeClosedIcon from '../../assets/icons/eye-closed.svg';
import EyeOpenIcon from '../../assets/icons/eye-open.svg';

type Props = NativeStackScreenProps<RootStackParamList, 'ExcluirConta'>;

const VERMELHO = '#C62828';

/**
 * Exclusão de conta (Configurações > Excluir conta), exigida pela App Store
 * (5.1.1(v)) e pelo Google Play, e direito do titular na LGPD (art. 18, VI).
 *
 * A Apple permite pedir a senha de novo e uma confirmação, mas não exigir
 * e-mail, ligação ou atendimento. O back (DELETE /users/me) confere a senha,
 * apaga perfil, peças, looks e a conta no Cognito, e depois as fotos no S3.
 */
export function ExcluirContaScreen({ navigation }: Props) {
  const { tokens, signOut } = useAuth();

  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isExcluindo, setIsExcluindo] = useState(false);
  const [popup, setPopup] = useState<ZyraPopupConfig | null>(null);

  const podeExcluir = senha.length > 0 && !isExcluindo;

  function pedirConfirmacao() {
    Keyboard.dismiss();

    setPopup({
      variant: 'warning',
      title: 'Excluir sua conta?',
      message:
        'Seu perfil, suas peças com as fotos e seus looks salvos serão apagados para sempre.',
      buttonText: 'Excluir',
      onConfirm: excluir,
      secondaryButtonText: 'Cancelar',
      onSecondaryPress: () => setPopup(null),
      secondaryVariant: 'botao',
    });
  }

  async function excluir() {
    const accessToken = tokens?.accessToken;

    if (!accessToken) {
      setPopup({
        variant: 'warning',
        title: 'Sessão não encontrada',
        message: 'Entre novamente para excluir sua conta.',
        buttonText: 'Entendi',
      });
      return;
    }

    try {
      setIsExcluindo(true);
      setPopup(null);

      await apiRequest('/users/me', {
        method: 'DELETE',
        token: accessToken,
        body: JSON.stringify({ senha }),
        // Apaga a conta e as fotos: pode passar do tempo padrão com muitas
        // peças.
        timeoutMs: 60_000,
      });

      // A conta já não existe: o logout no servidor vai falhar, e o signOut
      // limpa a sessão do aparelho mesmo assim.
      await signOut();

      setPopup({
        variant: 'success',
        title: 'Conta excluída',
        message: 'Seus dados foram apagados. Obrigado por usar o ZYRA.',
        buttonText: 'Concluir',
        onConfirm: () => {
          setPopup(null);
          navigation.reset({ index: 0, routes: [{ name: 'Intro' }] });
        },
      });
    } catch (error) {
      console.error('[Excluir conta] Falha ao excluir:', error);

      setPopup({
        variant: 'error',
        title: 'Não foi possível excluir a conta',
        message:
          error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes.',
        buttonText: 'Entendi',
      });
    } finally {
      setIsExcluindo(false);
    }
  }

  return (
    <>
      <AuthLayout
        title="Excluir conta"
        onBack={isExcluindo ? undefined : () => navigation.goBack()}
        footer={
          <View>
            <Text
              accessibilityRole="button"
              style={styles.cancelar}
              onPress={isExcluindo ? undefined : () => navigation.goBack()}
            >
              Cancelar
            </Text>

            <ZyraButton
              title={isExcluindo ? 'Excluindo...' : 'Excluir minha conta'}
              disabled={!podeExcluir}
              onPress={pedirConfirmacao}
              style={styles.botaoExcluir}
            />
          </View>
        }
      >
        <Text style={styles.aviso}>
          Ao excluir sua conta, apagamos tudo o que o ZYRA guarda sobre você:
        </Text>

        <View style={styles.lista}>
          <ItemPagina>Seu perfil e suas respostas do cadastro.</ItemPagina>
          <ItemPagina>Todas as peças do seu armário, com as fotos.</ItemPagina>
          <ItemPagina>Todos os looks salvos.</ItemPagina>
        </View>

        <Text style={[styles.aviso, styles.destaque]}>
          Essa ação não pode ser desfeita.
        </Text>

        <View style={styles.campo}>
          <ZyraInput
            label="Para confirmar, digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            editable={!isExcluindo}
            rightAccessory={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
                activeOpacity={0.75}
                hitSlop={8}
                onPress={() => setMostrarSenha((atual) => !atual)}
              >
                {mostrarSenha ? (
                  <EyeOpenIcon width={21} height={21} />
                ) : (
                  <EyeClosedIcon width={21} height={21} />
                )}
              </TouchableOpacity>
            }
          />
        </View>
      </AuthLayout>

      {popup ? (
        // Camada, e não Modal: o popup final some junto com a troca de tela
        // (ver ZyraPopup).
        <ZyraPopup
          visible
          modal={false}
          {...popup}
          onConfirm={popup.onConfirm ?? (() => setPopup(null))}
          onClose={isExcluindo ? undefined : () => setPopup(null)}
          confirmDisabled={isExcluindo}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  aviso: {
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  destaque: {
    color: VERMELHO,
    fontFamily: theme.fonts.bold,
    marginTop: 6,
  },
  lista: {
    marginTop: 12,
    marginBottom: 4,
  },
  campo: {
    marginTop: 24,
  },
  cancelar: {
    color: theme.colors.label,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  botaoExcluir: {
    backgroundColor: VERMELHO,
  },
});
