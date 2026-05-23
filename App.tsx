import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen } from './src/screens/SplashScreen';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    PoppinsRegular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    PoppinsMedium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    PoppinsSemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    PoppinsBold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    PoppinsExtraBold: require('./assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
    PoppinsBlack: require('./assets/fonts/Poppins/Poppins-Black.ttf'),
    Jomhuria: require('./assets/fonts/Jomhuria/Jomhuria-Regular.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return <AppNavigator />;
}
