import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

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
  /**
   * Ajuste fino da etiqueta, em fração da área: x positivo vai para a
   * direita, y positivo para baixo.
   */
  deslocarEtiqueta?: { x?: number; y?: number };
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

  // Parte de cima menor e a de baixo e o calçado maiores: com a camiseta
  // grande, a calça parecia pequena perto dela.
  'CALCADO+INFERIOR+SUPERIOR': {
    SUPERIOR: { x: 0.2, y: 0, w: 0.56, h: 0.42, lado: 'esquerda' },
    INFERIOR: { x: 0.34, y: 0.35, w: 0.5, h: 0.64, ...CALCA },
    CALCADO: { x: 0, y: 0.64, w: 0.42, h: 0.33, lado: 'esquerda' },
  },

  'INFERIOR+SOBREPOSICAO+SUPERIOR': {
    // Camiseta afastada da borda: a camiseta larga ainda deixa lugar para a
    // etiqueta à esquerda.
    SUPERIOR: { x: 0.19, y: 0, w: 0.43, h: 0.4, lado: 'esquerda' },
    SOBREPOSICAO: {
      x: 0.55,
      y: 0.01,
      w: 0.44,
      h: 0.43,
      lado: 'direita',
      deslocarEtiqueta: { y: -0.03 },
    },
    INFERIOR: { x: 0.28, y: 0.37, w: 0.38, h: 0.62, ...CALCA },
  },

  'CALCADO+INFERIOR+SOBREPOSICAO+SUPERIOR': {
    SUPERIOR: {
      x: 0.13,
      y: 0.03,
      w: 0.53,
      h: 0.48,
      lado: 'esquerda',
      alturaDaEtiqueta: 0.82,
      // Compensa o x menor: sem isso, a etiqueta não cabe à esquerda e pula
      // para baixo da peça.
      deslocarEtiqueta: { x: 0.04 },
    },
    SOBREPOSICAO: {
      x: 0.47,
      y: 0.01,
      w: 0.52,
      h: 0.52,
      lado: 'direita',
      alturaDaEtiqueta: 0.7,
      deslocarEtiqueta: { x: 0.02, y: -0.02 },
    },
    INFERIOR: { x: 0.3, y: 0.36, w: 0.42, h: 0.62, ...CALCA },
    CALCADO: { x: 0.05, y: 0.68, w: 0.32, h: 0.28, lado: 'esquerda' },
  },

  'CALCADO+PECA_UNICA': {
    PECA_UNICA: { x: 0.2, y: 0, w: 0.52, h: 0.9, lado: 'esquerda' },
    CALCADO: { x: 0.56, y: 0.64, w: 0.42, h: 0.32, lado: 'direita' },
  },

  'CALCADO+PECA_UNICA+SOBREPOSICAO': {
    PECA_UNICA: { x: 0.19, y: 0, w: 0.46, h: 0.88, lado: 'esquerda' },
    SOBREPOSICAO: {
      x: 0.56,
      y: 0.01,
      w: 0.43,
      h: 0.44,
      lado: 'direita',
      deslocarEtiqueta: { y: -0.03 },
    },
    CALCADO: { x: 0.6, y: 0.64, w: 0.39, h: 0.32, lado: 'direita' },
  },

  PECA_UNICA: {
    PECA_UNICA: { x: 0.25, y: 0, w: 0.5, h: 0.92, lado: 'esquerda' },
  },
};

// Quem fica na frente quando as peças se encostam (maior = mais à frente):
// o calçado na frente de tudo; a peça de cima e a de baixo na frente da
// sobreposição, para não sumirem atrás da jaqueta. O vestido continua atrás
// dela, como antes. Vale no chat e no look salvo, que usam esta colagem.
const CAMADA: Record<PapelNoLook, number> = {
  PECA_UNICA: 1,
  SOBREPOSICAO: 2,
  INFERIOR: 3,
  SUPERIOR: 4,
  CALCADO: 5,
};

// Etiqueta compacta (símbolo de 28 + o nome da cor em até duas linhas): o
// espaço vai para as peças. A altura cobre símbolo, margem e duas linhas.
const LARGURA_DA_ETIQUETA = 56;
const ALTURA_DA_ETIQUETA = 56;
const LADO_DO_SIMBOLO = 28;
const FOLGA = 3;
// Quanto a etiqueta pode avançar sobre a peça para não sair do lado dela.
const SOBRA_TOLERADA = LARGURA_DA_ETIQUETA / 2;

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
  const dx = (lugar.deslocarEtiqueta?.x ?? 0) * larguraTotal;
  const dy = (lugar.deslocarEtiqueta?.y ?? 0) * alturaTotal;
  const limitarY = (y: number) =>
    Math.min(Math.max(y, 0), alturaTotal - ALTURA_DA_ETIQUETA);
  const y = limitarY(
    foto.topo +
      foto.altura * (lugar.alturaDaEtiqueta ?? 0.5) -
      ALTURA_DA_ETIQUETA / 2 +
      dy,
  );

  // Faltando pouco espaço do lado, a etiqueta encosta na borda da área e
  // avança um pouco sobre a peça, mas continua do lado certo (no look salvo,
  // as peças aumentadas chegam mais perto da borda).
  if (lugar.lado === 'esquerda') {
    const x = foto.esquerda - LARGURA_DA_ETIQUETA - FOLGA + dx;
    if (x >= -SOBRA_TOLERADA) return { x: Math.max(x, 0), y };
  } else {
    const x = foto.esquerda + foto.largura + FOLGA + dx;
    const maximo = larguraTotal - LARGURA_DA_ETIQUETA;
    if (x <= maximo + SOBRA_TOLERADA) return { x: Math.min(x, maximo), y };
  }

  // Sem espaço do lado: embaixo da peça (ou em cima, se embaixo não couber),
  // alinhada pela borda do lado do molde, e não centrada: assim continua
  // perto da peça, do lado em que estaria.
  const x = Math.min(
    Math.max(
      (lugar.lado === 'esquerda'
        ? foto.esquerda
        : foto.esquerda + foto.largura - LARGURA_DA_ETIQUETA) + dx,
      0,
    ),
    larguraTotal - LARGURA_DA_ETIQUETA,
  );
  const abaixo = foto.topo + foto.altura + FOLGA + dy;
  return abaixo + ALTURA_DA_ETIQUETA <= alturaTotal
    ? { x, y: abaixo }
    : { x, y: Math.max(foto.topo - ALTURA_DA_ETIQUETA - FOLGA, 0) };
}

type Props = {
  pecas: PecaDoLook[];
  largura: number;
  altura: number;
  /** Toque na peça (foto ou etiqueta): abre a peça ampliada. */
  onPressPeca?: (peca: PecaDoLook) => void;
  /**
   * Aumenta todas as peças no mesmo fator, cada uma em volta do próprio
   * centro e sem sair da área (1 = tamanho do molde). Usado no look salvo,
   * que tem mais espaço que o chat.
   */
  escalaDasPecas?: number;
};

/** Caixa do molde aumentada em volta do centro, sem passar da área (0 a 1). */
function ampliar(lugar: Lugar, escala: number) {
  const w = Math.min(lugar.w * escala, 1);
  const h = Math.min(lugar.h * escala, 1);
  const limitar = (valor: number, maximo: number) =>
    Math.min(Math.max(valor, 0), maximo);
  return {
    x: limitar(lugar.x - (w - lugar.w) / 2, 1 - w),
    y: limitar(lugar.y - (h - lugar.h) / 2, 1 - h),
    w,
    h,
  };
}

export function LookColagem({
  pecas,
  largura,
  altura,
  onPressPeca,
  escalaDasPecas = 1,
}: Props) {
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

          const { x, y, w, h } = ampliar(lugar, escalaDasPecas);
          const caixa = {
            esquerda: x * largura,
            topo: y * altura,
            largura: w * largura,
            altura: h * altura,
          };
          const proporcao = proporcoes[peca.id];
          const foto = areaDaFoto(caixa, proporcao);
          const etiqueta = posicaoDaEtiqueta(foto, lugar, largura, altura);
          const simbolo = getColorAddSymbol(peca.colorAddSymbol);
          const cor = simbolo?.label ?? peca.corNome;
          const abrir = onPressPeca ? () => onPressPeca(peca) : undefined;

          return (
            <View
              key={peca.id}
              style={[StyleSheet.absoluteFill, { zIndex: CAMADA[peca.papel] }]}
              pointerEvents="box-none"
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

              {/* Área de toque só onde a foto aparece de fato (e não na caixa
                  inteira do molde), para a sobra transparente de uma peça não
                  roubar o toque da vizinha. */}
              <Pressable
                accessibilityRole={abrir ? 'button' : undefined}
                accessibilityLabel={`${nomeDaPeca(peca)}, ${cor}`}
                accessibilityHint={abrir ? 'Abre a peça ampliada' : undefined}
                disabled={!abrir}
                onPress={abrir}
                style={{
                  position: 'absolute',
                  left: foto.esquerda,
                  top: foto.topo,
                  width: foto.largura,
                  height: foto.altura,
                }}
              />

              {/* A cor sempre escrita e com o símbolo, nunca só pela foto. O
                  símbolo vai como é: o quadrado cheio (tom escuro) ou vazado
                  (tom claro) faz parte dele, e o manual do ColorADD proíbe
                  alterá-lo. Só aparece depois de medir a foto, para não pular
                  de lugar. */}
              {/* Fora do leitor de tela: a cor já é lida com a peça. */}
              <Pressable
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                disabled={!abrir}
                onPress={abrir}
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
              </Pressable>
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
