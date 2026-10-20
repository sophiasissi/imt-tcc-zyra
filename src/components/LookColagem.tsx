import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PapelNoLook, PecaDoLook } from '../services/looksApi';
import { nomeDaPeca } from '../services/pecasApi';
import { theme } from '../styles/theme';
import { getColorAddSymbol } from '../utils/colorAddSymbols';
import { FotoDaPeca } from './FotoDaPeca';

/**
 * Look montado como colagem, no estilo do mockup: as peças sem fundo soltas,
 * na posição em que seriam vestidas (cima, baixo, pés), com poucas
 * sobreposições. Cada peça tem a etiqueta da cor (símbolo ColorADD + nome)
 * colada nela: à esquerda da peça que está à esquerda, à direita da que está à
 * direita; sem espaço do lado, logo abaixo (ou acima) dela.
 *
 * Os moldes dão a caixa de cada peça em fração da área (0 a 1), para caber em
 * qualquer celular. Com quatro peças, cima + baixo + calçado ficam no mesmo
 * arranjo das três, e a camada (jaqueta, blusa) entra à direita da peça de cima.
 */

type Lado = 'esquerda' | 'direita';

type Lugar = {
  x: number;
  y: number;
  w: number;
  h: number;
  lado: Lado;
  /** Altura da etiqueta na peça (0 = topo, 1 = base). Padrão: o meio. */
  alturaDaEtiqueta?: number;
};

type Molde = Partial<Record<PapelNoLook, Lugar>>;

// Calça com a etiqueta na altura das pernas: longe da etiqueta da camada, que
// fica logo acima, do mesmo lado.
const CALCA = { lado: 'direita', alturaDaEtiqueta: 0.72 } as const;

const MOLDES: Record<string, Molde> = {
  'INFERIOR+SUPERIOR': {
    SUPERIOR: { x: 0.17, y: 0.01, w: 0.64, h: 0.5, lado: 'esquerda' },
    INFERIOR: { x: 0.32, y: 0.44, w: 0.44, h: 0.55, ...CALCA },
  },

  'CALCADO+INFERIOR+SUPERIOR': {
    SUPERIOR: { x: 0.17, y: 0, w: 0.64, h: 0.47, lado: 'esquerda' },
    INFERIOR: { x: 0.32, y: 0.4, w: 0.44, h: 0.58, ...CALCA },
    CALCADO: { x: 0.03, y: 0.66, w: 0.38, h: 0.3, lado: 'esquerda' },
  },

  'INFERIOR+SOBREPOSICAO+SUPERIOR': {
    // Camiseta afastada da borda: a camiseta larga ainda deixa lugar para a
    // etiqueta à esquerda.
    SUPERIOR: { x: 0.19, y: 0, w: 0.43, h: 0.4, lado: 'esquerda' },
    SOBREPOSICAO: { x: 0.6, y: 0.01, w: 0.39, h: 0.38, lado: 'direita' },
    INFERIOR: { x: 0.28, y: 0.37, w: 0.38, h: 0.62, ...CALCA },
  },

  'CALCADO+INFERIOR+SOBREPOSICAO+SUPERIOR': {
    SUPERIOR: { x: 0.19, y: 0, w: 0.43, h: 0.4, lado: 'esquerda' },
    SOBREPOSICAO: { x: 0.6, y: 0.01, w: 0.39, h: 0.38, lado: 'direita' },
    INFERIOR: { x: 0.28, y: 0.37, w: 0.38, h: 0.6, ...CALCA },
    CALCADO: { x: 0, y: 0.68, w: 0.32, h: 0.28, lado: 'esquerda' },
  },

  'CALCADO+PECA_UNICA': {
    PECA_UNICA: { x: 0.2, y: 0, w: 0.52, h: 0.9, lado: 'esquerda' },
    CALCADO: { x: 0.56, y: 0.64, w: 0.42, h: 0.32, lado: 'direita' },
  },

  'CALCADO+PECA_UNICA+SOBREPOSICAO': {
    PECA_UNICA: { x: 0.19, y: 0, w: 0.46, h: 0.88, lado: 'esquerda' },
    SOBREPOSICAO: { x: 0.6, y: 0.01, w: 0.39, h: 0.4, lado: 'direita' },
    CALCADO: { x: 0.6, y: 0.64, w: 0.39, h: 0.32, lado: 'direita' },
  },

  PECA_UNICA: {
    PECA_UNICA: { x: 0.25, y: 0, w: 0.5, h: 0.92, lado: 'esquerda' },
  },
};

// Quem fica na frente quando as peças se encostam (maior = mais à frente).
const CAMADA: Record<PapelNoLook, number> = {
  CALCADO: 1,
  INFERIOR: 2,
  PECA_UNICA: 3,
  SUPERIOR: 4,
  SOBREPOSICAO: 5,
};

// Etiqueta compacta (símbolo de 22 + o nome da cor em até duas linhas): o
// espaço vai para as peças.
const LARGURA_DA_ETIQUETA = 56;
const ALTURA_DA_ETIQUETA = 48;
const LADO_DO_SIMBOLO = 22;
const FOLGA = 3;

function chaveDoMolde(pecas: PecaDoLook[]) {
  return [...new Set(pecas.map((p) => p.papel))].sort().join('+');
}

/** A peça veio sem fundo (o recorte é salvo em WebP; a foto com fundo, em JPG). */
function semFundo(peca: PecaDoLook) {
  return peca.imagemUrl.split('?')[0].toLowerCase().endsWith('.webp');
}

/**
 * Se o look pode ser mostrado como colagem: existe molde para a combinação,
 * não há duas peças no mesmo lugar e todas estão sem fundo (com fundo, a
 * colagem vira uma pilha de retângulos).
 */
export function cabeNaColagem(pecas: PecaDoLook[]) {
  const molde = MOLDES[chaveDoMolde(pecas)];
  const papeis = new Set(pecas.map((p) => p.papel));
  return (
    Boolean(molde) && papeis.size === pecas.length && pecas.every(semFundo)
  );
}

type Retangulo = {
  esquerda: number;
  topo: number;
  largura: number;
  altura: number;
};

/** Onde a foto aparece de fato dentro da caixa (contain: proporção mantida, centrada). */
function areaDaFoto(
  caixa: Retangulo,
  proporcao: number | undefined,
): Retangulo {
  if (!proporcao) return caixa;
  const largura = Math.min(caixa.largura, caixa.altura * proporcao);
  const altura = largura / proporcao;
  return {
    esquerda: caixa.esquerda + (caixa.largura - largura) / 2,
    topo: caixa.topo + (caixa.altura - altura) / 2,
    largura,
    altura,
  };
}

/** Etiqueta colada na peça, do lado do molde; sem espaço, abaixo ou acima dela. */
function posicaoDaEtiqueta(
  foto: Retangulo,
  lugar: Lugar,
  larguraTotal: number,
  alturaTotal: number,
) {
  const limitarY = (y: number) =>
    Math.min(Math.max(y, 0), alturaTotal - ALTURA_DA_ETIQUETA);
  const y = limitarY(
    foto.topo +
      foto.altura * (lugar.alturaDaEtiqueta ?? 0.5) -
      ALTURA_DA_ETIQUETA / 2,
  );

  if (lugar.lado === 'esquerda') {
    const x = foto.esquerda - LARGURA_DA_ETIQUETA - FOLGA;
    if (x >= 0) return { x, y };
  } else {
    const x = foto.esquerda + foto.largura + FOLGA;
    if (x + LARGURA_DA_ETIQUETA <= larguraTotal) return { x, y };
  }

  // Sem espaço do lado: embaixo da peça (ou em cima, se embaixo não couber),
  // alinhada pela borda do lado do molde, e não centrada: assim continua
  // perto da peça, do lado em que estaria.
  const x = Math.min(
    Math.max(
      lugar.lado === 'esquerda'
        ? foto.esquerda
        : foto.esquerda + foto.largura - LARGURA_DA_ETIQUETA,
      0,
    ),
    larguraTotal - LARGURA_DA_ETIQUETA,
  );
  const abaixo = foto.topo + foto.altura + FOLGA;
  return abaixo + ALTURA_DA_ETIQUETA <= alturaTotal
    ? { x, y: abaixo }
    : { x, y: Math.max(foto.topo - ALTURA_DA_ETIQUETA - FOLGA, 0) };
}

type Props = {
  pecas: PecaDoLook[];
  largura: number;
  altura: number;
};

export function LookColagem({ pecas, largura, altura }: Props) {
  const molde = MOLDES[chaveDoMolde(pecas)] ?? {};
  // Proporção (largura / altura) de cada foto, medida quando ela carrega.
  const [proporcoes, setProporcoes] = useState<Record<string, number>>({});

  return (
    <View style={{ width: largura, height: altura }}>
      {[...pecas]
        .sort((a, b) => CAMADA[a.papel] - CAMADA[b.papel])
        .map((peca) => {
          const lugar = molde[peca.papel];
          if (!lugar) return null;

          const caixa = {
            esquerda: lugar.x * largura,
            topo: lugar.y * altura,
            largura: lugar.w * largura,
            altura: lugar.h * altura,
          };
          const proporcao = proporcoes[peca.id];
          const etiqueta = posicaoDaEtiqueta(
            areaDaFoto(caixa, proporcao),
            lugar,
            largura,
            altura,
          );
          const simbolo = getColorAddSymbol(peca.colorAddSymbol);
          const cor = simbolo?.label ?? peca.corNome;

          return (
            <View
              key={peca.id}
              style={[StyleSheet.absoluteFill, { zIndex: CAMADA[peca.papel] }]}
              pointerEvents="none"
              accessible
              accessibilityLabel={`${nomeDaPeca(peca)}, ${cor}`}
            >
              <FotoDaPeca
                uri={peca.imagemUrl}
                style={{
                  position: 'absolute',
                  left: caixa.esquerda,
                  top: caixa.topo,
                  width: caixa.largura,
                  height: caixa.altura,
                }}
                onLoad={({ source }) => {
                  if (source.width && source.height) {
                    const medida = source.width / source.height;
                    setProporcoes((atuais) =>
                      atuais[peca.id] === medida
                        ? atuais
                        : { ...atuais, [peca.id]: medida },
                    );
                  }
                }}
              />

              {/* A cor sempre escrita e com o símbolo, nunca só pela foto. O
                  símbolo vai como é: o quadrado cheio (tom escuro) ou vazado
                  (tom claro) faz parte dele, e o manual do ColorADD proíbe
                  alterá-lo. Só aparece depois de medir a foto, para não pular
                  de lugar. */}
              <View
                style={[
                  styles.etiqueta,
                  {
                    left: etiqueta.x,
                    top: etiqueta.y,
                    opacity: proporcao ? 1 : 0,
                  },
                ]}
              >
                {simbolo ? (
                  <Image source={simbolo.image} style={styles.simbolo} />
                ) : null}
                <Text style={styles.cor} numberOfLines={2}>
                  {cor}
                </Text>
              </View>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: {
    position: 'absolute',
    width: LARGURA_DA_ETIQUETA,
    height: ALTURA_DA_ETIQUETA,
    alignItems: 'center',
  },
  simbolo: {
    width: LADO_DO_SIMBOLO,
    height: LADO_DO_SIMBOLO,
    resizeMode: 'contain',
    marginBottom: 3,
  },
  cor: {
    color: theme.colors.title,
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});
