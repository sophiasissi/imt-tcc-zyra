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
import { CameraColorDetectionScreen } from '../screens/CameraColorDetectionScreen';

export type GeneroCadastro =
  | 'MASCULINO'
  | 'FEMININO'
  | 'NAO_BINARIO'
  | 'PREFIRO_NAO_DIZER';

export type TipoDaltonismoCadastro =
  | 'PROTANOMALIA'
  | 'PROTANOPIA'
  | 'DEUTERANOMALIA'
  | 'DEUTERANOPIA'
  | 'TRITANOMALIA'
  | 'TRITANOPIA'
  | 'ACROMATOPSIA'
  | 'NAO_SEI';

export type RootStackParamList = {
  Intro: undefined;
  RegisterStart: undefined;
  RegisterBasicInfo: undefined;

  RegisterPassword: {
    firstName: string;
    name: string;
    email: string;
  };

  RegisterVerification: {
    firstName: string;
    name: string;
    email: string;
    password: string;
  };

  RegisterWelcome: {
    firstName: string;
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
  };

  Login: undefined;

  ForgotPasswordEmail: undefined;

  ForgotPasswordVerification: {
    email: string;
  };

  ForgotPasswordNewPassword: {
    email: string;
    confirmationCode: string;
  };

  Home: undefined;

  Chat: {
    nome?: string | null;
  };

  Settings: undefined;

  PersonalInfo: undefined;

  Permissions: undefined;

  ChangePassword: undefined;

  CameraColorDetection: undefined;
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
          name="Chat"
          component={ChatScreen}
          options={{
            animation: 'none',
            presentation: 'transparentModal',
            contentStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
          }}
        />

        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
