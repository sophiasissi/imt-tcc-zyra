import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { IntroScreen } from '../screens/IntroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { RegisterBasicInfoScreen } from '../screens/RegisterBasicInfoScreen';
import { RegisterBirthDateScreen } from '../screens/RegisterBirthDateScreen';
import { RegisterColorBlindnessScreen } from '../screens/RegisterColorBlindnessScreen';
import { RegisterDifficultyScreen } from '../screens/RegisterDifficultyScreen';
import { RegisterGenderScreen } from '../screens/RegisterGenderScreen';
import { RegisterPasswordScreen } from '../screens/RegisterPasswordScreen';
import { RegisterStartScreen } from '../screens/RegisterStartScreen';
import { RegisterVerificationScreen } from '../screens/RegisterVerificationScreen';
import { RegisterWelcomeScreen } from '../screens/RegisterWelcomeScreen';
import { ForgotPasswordEmailScreen } from '../screens/ForgotPasswordEmailScreen';
import { ForgotPasswordVerificationScreen } from '../screens/ForgotPasswordVerificationScreen';
import { ForgotPasswordNewPasswordScreen } from '../screens/ForgotPasswordNewPasswordScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PersonalInfoScreen } from '../screens/PersonalInfoScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { useAuth } from '../contexts/AuthContext';
import { ColorAddScreen } from '../screens/ColorAddScreen';
import { SobreColorAddScreen } from '../screens/SobreColorAddScreen';
import { AcessibilidadeScreen } from '../screens/AcessibilidadeScreen';
import { PoliticaPrivacidadeScreen } from '../screens/PoliticaPrivacidadeScreen';
import { TermosUsoScreen } from '../screens/TermosUsoScreen';
import { ExcluirContaScreen } from '../screens/ExcluirContaScreen';
import { CameraColorDetectionScreen } from '../screens/CameraColorDetectionScreen';
import { CapturedClothingScreen } from '../screens/CapturedClothingScreen';
import { LookDetalheScreen } from '../screens/LookDetalheScreen';
import { LookSalvo } from '../services/looksApi';
import { TipoDeImagem } from '../utils/photoUpload';

import { GeneroCadastro, TipoDaltonismoCadastro } from '../constants/perfil';

// Definidos em constants/perfil; reexportados para as telas do cadastro.
export type { GeneroCadastro, TipoDaltonismoCadastro };

export type RootStackParamList = {
  Intro: undefined;
  RegisterStart: undefined;
  /** Versão dos Termos marcada como aceita na RegisterStartScreen. */
  RegisterBasicInfo: { versaoTermosAceita: string };

  RegisterPassword: {
    firstName: string;
    name: string;
    email: string;
    versaoTermosAceita: string;
  };

  RegisterVerification: {
    // Opcionais porque esta tela também é alcançada pelo login, quando a conta
    // existe mas nunca foi confirmada. Nesse caminho só temos email e senha —
    // o nome ainda não foi coletado.
    firstName?: string;
    name?: string;
    email: string;
    password: string;
    /** Para o register-profile, se o perfil não tiver saído no signup. */
    versaoTermosAceita?: string;
  };

  RegisterWelcome: {
    firstName?: string;
    accessToken?: string;
  };

  RegisterBirthDate:
    | {
        accessToken?: string;
      }
    | undefined;

  RegisterGender: {
    accessToken?: string;
    dataNascimento: string;
  };

  RegisterColorBlindness: {
    accessToken?: string;
    dataNascimento: string;
    genero?: GeneroCadastro;
  };

  RegisterDifficulty: {
    accessToken?: string;
    dataNascimento: string;
    genero?: GeneroCadastro;
    tipoDaltonismo?: TipoDaltonismoCadastro;
    /** Marcou a autorização do dado de saúde (ConsentimentoSaude). */
    consentimentoDadosSaude?: boolean;
  };

  // email: vem preenchido quando o cadastro descobre que o email já tem conta.
  Login: { email?: string } | undefined;

  ForgotPasswordEmail: undefined;

  ForgotPasswordVerification: {
    email: string;
  };

  ForgotPasswordNewPassword: {
    email: string;
    confirmationCode: string;
  };

  Home:
    | {
        /** Instante em que o chat salvou um look: a Home mostra o aviso. */
        lookSalvoEm?: number;
      }
    | undefined;

  Chat: {
    nome?: string | null;
    /** O armário estava aberto na Home: o painel do chat já começa no topo. */
    armarioAberto?: boolean;
  };

  Settings: undefined;

  PersonalInfo: undefined;

  Permissions: undefined;

  ChangePassword: undefined;

  CameraColorDetection: undefined;

  /** Explicação do código ColorADD, aberta pelo botão do topo da Home. */
  ColorAdd: undefined;

  /** Configurações > Acessibilidade. */
  SobreColorAdd: undefined;
  Acessibilidade: undefined;

  /** Abertas também do cadastro, antes do login. */
  PoliticaPrivacidade: undefined;
  TermosUso: undefined;

  ExcluirConta: undefined;

  LookDetalhe: {
    look: LookSalvo;
  };

  CapturedClothing: {
    photoUri: string;
    /** Foto da galeria pode ser PNG ou WebP; da câmera, sempre JPEG. */
    photoTipo?: TipoDeImagem;
    colorName?: string | null;
    colorAddSymbol?: string | null;
    hex?: string | null;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isRestoringSession, isAuthenticated } = useAuth();

  if (isRestoringSession) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? 'Home' : 'Intro'}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="RegisterStart" component={RegisterStartScreen} />

        <Stack.Screen
          name="RegisterBasicInfo"
          component={RegisterBasicInfoScreen}
        />

        <Stack.Screen
          name="RegisterPassword"
          component={RegisterPasswordScreen}
        />

        <Stack.Screen
          name="RegisterVerification"
          component={RegisterVerificationScreen}
        />

        <Stack.Screen
          name="RegisterWelcome"
          component={RegisterWelcomeScreen}
        />

        <Stack.Screen
          name="RegisterBirthDate"
          component={RegisterBirthDateScreen}
        />

        <Stack.Screen name="RegisterGender" component={RegisterGenderScreen} />

        <Stack.Screen
          name="RegisterColorBlindness"
          component={RegisterColorBlindnessScreen}
        />

        <Stack.Screen
          name="RegisterDifficulty"
          component={RegisterDifficultyScreen}
        />

        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="ForgotPasswordEmail"
          component={ForgotPasswordEmailScreen}
        />

        <Stack.Screen
          name="ForgotPasswordVerification"
          component={ForgotPasswordVerificationScreen}
        />

        <Stack.Screen
          name="ForgotPasswordNewPassword"
          component={ForgotPasswordNewPasswordScreen}
        />

        <Stack.Screen name="Home" component={HomeScreen} />

        <Stack.Screen
          name="CameraColorDetection"
          component={CameraColorDetectionScreen}
        />

        <Stack.Screen
          name="CapturedClothing"
          component={CapturedClothingScreen}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            animation: 'none',
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
          }}
        />

        {/* Por cima da Home, que fica visível por trás do fundo escurecido. */}
        <Stack.Screen
          name="ColorAdd"
          component={ColorAddScreen}
          options={{
            animation: 'fade',
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />

        <Stack.Screen name="LookDetalhe" component={LookDetalheScreen} />

        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="SobreColorAdd" component={SobreColorAddScreen} />
        <Stack.Screen name="Acessibilidade" component={AcessibilidadeScreen} />
        <Stack.Screen
          name="PoliticaPrivacidade"
          component={PoliticaPrivacidadeScreen}
        />
        <Stack.Screen name="TermosUso" component={TermosUsoScreen} />
        <Stack.Screen name="ExcluirConta" component={ExcluirContaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
