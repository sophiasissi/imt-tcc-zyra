import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';

import { SplashScreen } from './src/screens/SplashScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  // O segundo elemento é o erro de carregamento. Ignorá-lo fazia o app ficar
  // preso no `return null` para sempre se qualquer uma das sete fontes
  // falhasse: tela em branco, sem mensagem, sem log e sem forma de sair.
  const [fontsLoaded, fontError] = useFonts({
    PoppinsRegular: require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    PoppinsMedium: require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    PoppinsSemiBold: require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    PoppinsBold: require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
    PoppinsExtraBold: require('./assets/fonts/Poppins/Poppins-ExtraBold.ttf'),
    PoppinsBlack: require('./assets/fonts/Poppins/Poppins-Black.ttf'),
    Jomhuria: require('./assets/fonts/Jomhuria/Jomhuria-Regular.ttf'),
  });

  // Com erro, seguimos com a fonte do sistema. Um app de acessibilidade não
  // pode ter a tipografia como ponto único de falha: melhor a fonte errada
  // do que tela nenhuma.
  const podeSeguir = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError) {
      console.error(
        '[Fontes] Falha ao carregar as fontes. Seguindo com a fonte do sistema:',
        fontError,
      );
    }
  }, [fontError]);

  useEffect(() => {
    if (!podeSeguir) return;

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [podeSeguir]);

  if (!podeSeguir) {
    return null;
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
