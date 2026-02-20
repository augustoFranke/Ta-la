/**
 * Servico de Auditoria
 * Registra eventos de auditoria no banco de dados para conformidade com LGPD.
 * Garante que dados sensiveis (documentos, biometria) nunca sejam incluidos nos logs.
 */

import { supabase } from './supabase';
import type { AuditEvent, AuditRecord } from '../types/privacy';
import { FORBIDDEN_AUDIT_METADATA_KEYS } from '../types/privacy';

/** Tamanho maximo permitido para valores de metadados de auditoria */
const MAX_METADATA_VALUE_LENGTH = 200;

/**
 * Sanitiza metadados de auditoria removendo chaves proibidas
 * e truncando valores longos.
 * Nunca permite dados de documentos, biometria ou fotos nos logs.
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, string> = {};
  const forbiddenSet = new Set<string>(FORBIDDEN_AUDIT_METADATA_KEYS);

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    // Reject forbidden keys
    if (forbiddenSet.has(lowerKey)) {
      continue;
    }

    // Reject keys that look like they reference sensitive data
    if (
      lowerKey.includes('document') ||
      lowerKey.includes('selfie') ||
      lowerKey.includes('biometric') ||
      lowerKey.includes('face_') ||
      lowerKey.includes('photo_raw')
    ) {
      continue;
    }

    // Truncate long values
    const truncatedValue =
      typeof value === 'string' && value.length > MAX_METADATA_VALUE_LENGTH
        ? value.substring(0, MAX_METADATA_VALUE_LENGTH)
        : String(value);

    sanitized[key] = truncatedValue;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Registra um evento de auditoria na tabela `privacy_audit_log`.
 *
 * O evento inclui: event_type, user_id, timestamp, outcome e metadados sanitizados.
 * Dados sensiveis (fotos de documentos, capturas faciais, numeros de documentos)
 * sao automaticamente removidos dos metadados.
 *
 * @param event - Evento de auditoria a ser registrado
 * @throws Error se a insercao no banco falhar
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const sanitizedMetadata = sanitizeAuditMetadata(event.metadata);

  const record = {
    event_type: event.event_type,
    user_id: event.user_id,
    outcome: event.outcome,
    metadata: sanitizedMetadata ?? null,
    timestamp: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('privacy_audit_log')
    .insert(record);

  if (error) {
    // Log the error but do not expose sensitive data
    console.error('Audit: falha ao registrar evento de auditoria', {
      event_type: event.event_type,
      user_id: event.user_id,
      error: error.message,
    });
    throw new Error(`Falha ao registrar evento de auditoria: ${error.message}`);
  }
}

/**
 * Consulta eventos de auditoria para um usuario.
 * Util para gerar relatorios de conformidade.
 *
 * @param userId - ID do usuario
 * @param limit - Numero maximo de registros (padrao: 50)
 * @returns Lista de registros de auditoria ordenados por timestamp decrescente
 */
export async function getAuditEvents(
  userId: string,
  limit = 50
): Promise<AuditRecord[]> {
  const { data, error } = await supabase
    .from('privacy_audit_log')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Audit: falha ao consultar eventos de auditoria', {
      user_id: userId,
      error: error.message,
    });
    throw new Error(`Falha ao consultar eventos de auditoria: ${error.message}`);
  }

  return (data ?? []) as AuditRecord[];
}
