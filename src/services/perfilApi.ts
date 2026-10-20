import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { UserProfile } from '../contexts/AuthContext';
import { photoFormDataPart } from '../utils/photoUpload';
import { apiRequest } from './api';

// A foto aparece num círculo de ~120 px: 512 px sobra até em tela de alta
// densidade, e a foto vai com ~50 KB em vez dos 2 a 3 MB da câmera.
const LADO_DA_FOTO = 512;
const QUALIDADE = 0.75;

/** Reduz e converte para JPEG (a galeria pode ter PNG ou HEIC). */
async function prepararFoto(uri: string) {
  const contexto = ImageManipulator.manipulate(uri).resize({
    width: LADO_DA_FOTO,
  });
  const imagem = await contexto.renderAsync();
  const resultado = await imagem.saveAsync({
    compress: QUALIDADE,
    format: SaveFormat.JPEG,
  });

  return resultado.uri;
}

/** Troca a foto de perfil e devolve o perfil com a nova `fotoUrl`. */
export async function atualizarFotoPerfil(uri: string, token: string) {
  const formData = new FormData();
  formData.append(
    'foto',
    photoFormDataPart(await prepararFoto(uri), 'perfil', 'image/jpeg'),
  );

  return apiRequest<UserProfile>('/users/me/foto', {
    method: 'PUT',
    body: formData,
    token,
    timeoutMs: 30_000,
  });
}

export function removerFotoPerfil(token: string) {
  return apiRequest<UserProfile>('/users/me/foto', {
    method: 'DELETE',
    token,
  });
}
