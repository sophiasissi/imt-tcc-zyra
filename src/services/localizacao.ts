import * as Location from 'expo-location';

/**
 * Localização aproximada para a previsão do tempo do chat. O back usa só para
 * consultar o clima; nada é salvo.
 */
export type Localizacao = { latitude: number; longitude: number };

// A localização muda pouco durante o uso do app: guarda por 30 minutos.
const VALIDADE_MS = 30 * 60_000;
// O look não pode ficar esperando o GPS: depois disso, segue sem clima.
const TEMPO_LIMITE_MS = 4_000;

let ultima: { valor: Localizacao; em: number } | null = null;

// ~1 km de precisão: basta para o clima e não envia o endereço exato.
function arredondar(coords: {
  latitude: number;
  longitude: number;
}): Localizacao {
  return {
    latitude: Math.round(coords.latitude * 100) / 100,
    longitude: Math.round(coords.longitude * 100) / 100,
  };
}

function comTempoLimite<T>(promessa: Promise<T>) {
  return Promise.race([
    promessa,
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), TEMPO_LIMITE_MS),
    ),
  ]);
}

/**
 * Pede a permissão na primeira vez (o sistema só mostra o pedido uma vez) e
 * devolve a localização. null se a pessoa negou ou se o GPS demorar: o chat
 * funciona igual, só sem a previsão do tempo.
 */
export async function obterLocalizacao(): Promise<Localizacao | null> {
  if (ultima && Date.now() - ultima.em < VALIDADE_MS) {
    return ultima.valor;
  }

  try {
    let permissao = await Location.getForegroundPermissionsAsync();

    if (!permissao.granted && permissao.canAskAgain) {
      permissao = await Location.requestForegroundPermissionsAsync();
    }

    if (!permissao.granted) {
      return null;
    }

    const posicao =
      (await Location.getLastKnownPositionAsync({ maxAge: VALIDADE_MS })) ??
      (await comTempoLimite(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      ));

    if (!posicao) {
      return null;
    }

    ultima = { valor: arredondar(posicao.coords), em: Date.now() };
    return ultima.valor;
  } catch (error) {
    console.error('[Localização] Não foi possível obter a localização:', error);
    return null;
  }
}
