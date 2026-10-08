import { apiRequest } from './api';
import { Ocasiao, Peca } from './pecasApi';

/** Lugar da peça no look: o app usa para ordenar e descrever. */
export type PapelNoLook =
  | 'SUPERIOR'
  | 'SOBREPOSICAO'
  | 'INFERIOR'
  | 'PECA_UNICA'
  | 'CALCADO';

export type PecaDoLook = Peca & { papel: PapelNoLook };

export type MensagemHistorico = {
  autor: 'usuario' | 'zyra';
  texto: string;
};

/**
 * Resposta do POST /looks/sugerir. O texto já vem pronto do back (montado por
 * código, sem IA); o app só mostra.
 */
export type RespostaLook =
  | {
      tipo: 'POUCAS_PECAS';
      mensagem: string;
      faltamSuperiores: number;
      faltamInferiores: number;
    }
  | { tipo: 'PERGUNTA' | 'FORA_DE_ESCOPO'; mensagem: string }
  | { tipo: 'SEM_LOOK'; mensagem: string; avisos: string[] }
  | {
      tipo: 'LOOK';
      mensagem: string;
      avisos: string[];
      pecas: PecaDoLook[];
      /**
       * Evento pedido em poucas palavras ("Casamento à noite"), gerado pela IA
       * na interpretação do pedido. Opcional até o back passar a enviar.
       */
      titulo?: string | null;
      /** Ocasião entendida no pedido; vai junto quando o look é salvo. */
      ocasiao?: Ocasiao | null;
    };

export type SugerirLookInput = {
  mensagem: string;
  /** Últimas mensagens, para o back entender respostas curtas ("trabalho"). */
  historico?: MensagemHistorico[];
  /** Peças do look anterior, para "quero outro" trazer algo diferente. */
  pecasAnteriores?: string[];
  /** Peças dos últimos looks da conversa, para o back variar as sugestões. */
  pecasRecentes?: string[];
};

export function sugerirLook(input: SugerirLookInput, token: string) {
  return apiRequest<RespostaLook>('/looks/sugerir', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
    // Inclui a interpretação do pedido pela OpenAI.
    timeoutMs: 30_000,
  });
}

/** Look da Galeria de Looks, como o GET /looks devolve. */
export type LookSalvo = {
  id: string;
  /** Título do evento pedido; looks antigos podem não ter. */
  nome: string | null;
  ocasiao: Ocasiao | null;
  criadoEm: string;
  /** Já na ordem do look: superior, sobreposição, inferior, peça única, calçado. */
  pecas: PecaDoLook[];
};

export type SalvarLookInput = {
  pecaIds: string[];
  /** O back aceita até 60 caracteres. */
  nome?: string;
  ocasiao?: Ocasiao;
};

/**
 * Salva o look na Galeria de Looks. Salvar as mesmas peças de novo devolve o
 * look que já existe, sem criar cópia.
 */
export function salvarLook(input: SalvarLookInput, token: string) {
  return apiRequest<LookSalvo>('/looks', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

/** Looks salvos, do mais recente para o mais antigo. */
export function listarLooks(token: string) {
  return apiRequest<LookSalvo[]>('/looks', { token });
}

/** Tira o look da Galeria de Looks. As peças continuam no armário. */
export function removerLook(id: string, token: string) {
  return apiRequest<{ message: string }>(`/looks/${id}`, {
    method: 'DELETE',
    token,
  });
}
