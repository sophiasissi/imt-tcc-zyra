import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { IntroScreen } from '../screens/IntroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterBasicInfoScreen } from '../screens/RegisterBasicInfoScreen';
import { RegisterBirthDateScreen } from '../screens/RegisterBirthDateScreen';
import { RegisterColorBlindnessScreen } from '../screens/RegisterColorBlindnessScreen';
import { RegisterDifficultyScreen } from '../screens/RegisterDifficultyScreen';
import { RegisterGenderScreen } from '../screens/RegisterGenderScreen';
import { RegisterPasswordScreen } from '../screens/RegisterPasswordScreen';
import { RegisterStartScreen } from '../screens/RegisterStartScreen';
import { RegisterVerificationScreen } from '../screens/RegisterVerificationScreen';
import { RegisterWelcomeScreen } from '../screens/RegisterWelcomeScreen';

export type RootStackParamList = {
  Intro: undefined;
  RegisterStart: undefined;
  RegisterBasicInfo: undefined;
  RegisterPassword: undefined;
  RegisterVerification: undefined;
  RegisterWelcome: { username?: string } | undefined;
  RegisterBirthDate: undefined;
  RegisterGender: undefined;
  RegisterColorBlindness: undefined;
  RegisterDifficulty: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Intro">
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="RegisterStart" component={RegisterStartScreen} />
        <Stack.Screen name="RegisterBasicInfo" component={RegisterBasicInfoScreen} />
        <Stack.Screen name="RegisterPassword" component={RegisterPasswordScreen} />
        <Stack.Screen name="RegisterVerification" component={RegisterVerificationScreen} />
        <Stack.Screen name="RegisterWelcome" component={RegisterWelcomeScreen} />
        <Stack.Screen name="RegisterBirthDate" component={RegisterBirthDateScreen} />
        <Stack.Screen name="RegisterGender" component={RegisterGenderScreen} />
        <Stack.Screen name="RegisterColorBlindness" component={RegisterColorBlindnessScreen} />
        <Stack.Screen name="RegisterDifficulty" component={RegisterDifficultyScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
