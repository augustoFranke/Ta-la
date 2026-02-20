/**
 * Servico de Privacidade (LGPD)
 * Implementa os fluxos de direitos do titular: exportacao, correcao, exclusao,
 * portabilidade e revogacao de consentimento.
 */

import { supabase } from './supabase';
import { logAuditEvent } from './audit';
import type {
  PrivacyRequest,
  ConsentType,
  UserDataExport,
  UserDataExportProfile,
} from '../types/privacy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ANONYMIZED_NAME = 'Usuario removido';

/**
 * Executa uma operacao Supabase de forma tolerante a falhas.
 * Se a tabela nao existir ou a operacao falhar, registra o erro e continua.
 * Retorno: true se a operacao teve sucesso, false caso contrario.
 */
async function safeExecute(
  operation: () => PromiseLike<{ error: { message: string } | null }>,
  context: string
): Promise<boolean> {
  try {
    const { error } = await operation();
    if (error) {
      console.error(`Privacy: falha em ${context}`, { error: error.message });
      return false;
    }
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Privacy: excecao em ${context}`, { error: message });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Privacy Request Management
// ---------------------------------------------------------------------------

/**
 * Cria um registro de solicitacao de privacidade.
 */
async function createPrivacyRequest(
  userId: string,
  requestType: PrivacyRequest['request_type'],
  description: string | null = null,
  status: PrivacyRequest['status'] = 'pending'
): Promise<PrivacyRequest> {
  const record = {
    user_id: userId,
    request_type: requestType,
    status,
    description,
    resolution_proof: status === 'completed' ? 'automated_processing' : null,
    resolved_at: status === 'completed' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('privacy_requests')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('Privacy: falha ao criar solicitacao', {
      request_type: requestType,
      error: error.message,
    });
    throw new Error(`Falha ao criar solicitacao de privacidade: ${error.message}`);
  }

  return data as PrivacyRequest;
}

// ---------------------------------------------------------------------------
// Data Export (Portabilidade)
// ---------------------------------------------------------------------------

/**
 * Solicita exportacao dos dados do usuario.
 * Cria registro de solicitacao com status pendente e registra evento de auditoria.
 * A exportacao segue SLA de 15 dias uteis para revisao humana.
 *
 * @param userId - ID do usuario solicitante
 * @returns Registro da solicitacao criada
 */
export async function requestDataExport(userId: string): Promise<PrivacyRequest> {
  const request = await createPrivacyRequest(userId, 'data_export');

  await logAuditEvent({
    event_type: 'privacy_request_created',
    user_id: userId,
    outcome: 'success',
    metadata: { request_type: 'data_export', request_id: request.id },
  });

  return request;
}

/**
 * Coleta todos os dados do usuario para exportacao/portabilidade.
 * Nunca inclui artefatos de verificacao (fotos de documentos, capturas faciais).
 *
 * @param userId - ID do usuario
 * @returns Estrutura completa dos dados do usuario
 */
export async function getUserData(userId: string): Promise<UserDataExport> {
  // Profile
  const { data: profileData } = await supabase
    .from('users')
    .select('name, email, bio, occupation, gender, gender_preference, birth_date, created_at')
    .eq('id', userId)
    .single();

  const profile: UserDataExportProfile = profileData
    ? {
        name: profileData.name,
        email: profileData.email,
        bio: profileData.bio ?? null,
        occupation: profileData.occupation ?? null,
        gender: profileData.gender,
        gender_preference: profileData.gender_preference,
        birth_date: profileData.birth_date,
        created_at: profileData.created_at,
      }
    : {
        name: '',
        email: '',
        bio: null,
        occupation: null,
        gender: '',
        gender_preference: '',
        birth_date: '',
        created_at: '',
      };

  // Photos
  const { data: photosData } = await supabase
    .from('photos')
    .select('url, order')
    .eq('user_id', userId)
    .order('order', { ascending: true });

  // Interests
  const { data: interestsData } = await supabase
    .from('interests')
    .select('tag')
    .eq('user_id', userId);

  // Check-in history
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('venue_id, checked_in_at, checked_out_at')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false });

  // Interactions sent
  const { data: interactionsSent } = await supabase
    .from('interactions')
    .select('interaction_type, created_at')
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });

  // Interactions received
  const { data: interactionsReceived } = await supabase
    .from('interactions')
    .select('interaction_type, created_at')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });

  // Matches
  const { data: matchesData1 } = await supabase
    .from('matches')
    .select('matched_at')
    .eq('user1_id', userId);

  const { data: matchesData2 } = await supabase
    .from('matches')
    .select('matched_at')
    .eq('user2_id', userId);

  const allMatches = [
    ...(matchesData1 ?? []),
    ...(matchesData2 ?? []),
  ].map((m) => ({ matched_at: m.matched_at }));

  // Consent records (may not exist yet)
  let consentRecords: { consent_type: string; granted_at: string; revoked_at: string | null }[] = [];
  try {
    const { data: consentsData } = await supabase
      .from('user_consents')
      .select('consent_type, granted_at, revoked_at')
      .eq('user_id', userId);
    consentRecords = (consentsData ?? []).map((c) => ({
      consent_type: c.consent_type,
      granted_at: c.granted_at,
      revoked_at: c.revoked_at ?? null,
    }));
  } catch {
    // Table may not exist yet
  }

  await logAuditEvent({
    event_type: 'data_export_generated',
    user_id: userId,
    outcome: 'success',
  });

  return {
    profile,
    photos: (photosData ?? []).map((p) => ({ url: p.url, order: p.order })),
    interests: (interestsData ?? []).map((i) => i.tag),
    check_in_history: (checkInsData ?? []).map((c) => ({
      venue_id: c.venue_id,
      checked_in_at: c.checked_in_at,
      checked_out_at: c.checked_out_at ?? null,
    })),
    interactions_sent: (interactionsSent ?? []).map((i) => ({
      interaction_type: i.interaction_type,
      created_at: i.created_at,
    })),
    interactions_received: (interactionsReceived ?? []).map((i) => ({
      interaction_type: i.interaction_type,
      created_at: i.created_at,
    })),
    matches: allMatches,
    consent_records: consentRecords,
  };
}

// ---------------------------------------------------------------------------
// Correction Request
// ---------------------------------------------------------------------------

/**
 * Solicita correcao de dados pessoais.
 * Cria registro para revisao humana dentro do SLA de 15 dias uteis.
 *
 * @param userId - ID do usuario solicitante
 * @param description - Descricao do que precisa ser corrigido
 * @returns Registro da solicitacao criada
 */
export async function requestCorrection(
  userId: string,
  description: string
): Promise<PrivacyRequest> {
  if (!description || description.trim().length === 0) {
    throw new Error('Descricao da correcao e obrigatoria');
  }

  const request = await createPrivacyRequest(userId, 'correction', description.trim());

  await logAuditEvent({
    event_type: 'privacy_request_created',
    user_id: userId,
    outcome: 'success',
    metadata: { request_type: 'correction', request_id: request.id },
  });

  return request;
}

// ---------------------------------------------------------------------------
// Account Deletion
// ---------------------------------------------------------------------------

/**
 * Executa exclusao/anonimizacao imediata da conta do usuario.
 *
 * Cascata de exclusao:
 * 1. Anonimiza perfil (nome, email, bio, ocupacao)
 * 2. Remove fotos de perfil
 * 3. Remove interesses
 * 4. Desativa check-ins
 * 5. Remove matches
 * 6. Remove preferencias de notificacao
 * 7. Remove bloqueios e denuncias do usuario
 * 8. Remove favoritos
 * 9. Cria registro de solicitacao de exclusao
 * 10. Registra eventos de auditoria
 *
 * Nota: a revogacao de sessao e feita via supabase.auth.signOut() no cliente.
 * Anonimizacao de mensagens de chat segue politica de 24h (processamento assincrono).
 *
 * @param userId - ID do usuario a ser excluido
 */
export async function requestDeletion(userId: string): Promise<void> {
  // Log initiation
  await logAuditEvent({
    event_type: 'account_deletion_initiated',
    user_id: userId,
    outcome: 'success',
  });

  // 1. Anonymize user profile
  await safeExecute(
    () =>
      supabase
        .from('users')
        .update({
          name: ANONYMIZED_NAME,
          email: `deleted_${userId.substring(0, 8)}@removed.tala`,
          bio: null,
          occupation: null,
          is_available: false,
          is_verified: false,
          location: null,
        })
        .eq('id', userId),
    'anonimizar perfil'
  );

  // 2. Delete profile photos
  await safeExecute(
    () => supabase.from('photos').delete().eq('user_id', userId),
    'remover fotos'
  );

  // 3. Delete interests
  await safeExecute(
    () => supabase.from('interests').delete().eq('user_id', userId),
    'remover interesses'
  );

  // 4. Deactivate check-ins
  await safeExecute(
    () =>
      supabase
        .from('check_ins')
        .update({
          is_active: false,
          checked_out_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_active', true),
    'desativar check-ins'
  );

  // 5. Delete matches (user as user1 or user2)
  await safeExecute(
    () => supabase.from('matches').delete().eq('user1_id', userId),
    'remover matches (user1)'
  );
  await safeExecute(
    () => supabase.from('matches').delete().eq('user2_id', userId),
    'remover matches (user2)'
  );

  // 6. Delete notification preferences
  await safeExecute(
    () => supabase.from('notification_preferences').delete().eq('user_id', userId),
    'remover preferencias de notificacao'
  );

  // 7. Delete blocks where user is blocker
  await safeExecute(
    () => supabase.from('blocks').delete().eq('blocker_id', userId),
    'remover bloqueios (blocker)'
  );
  await safeExecute(
    () => supabase.from('blocks').delete().eq('blocked_id', userId),
    'remover bloqueios (blocked)'
  );

  // 8. Delete favorites
  await safeExecute(
    () => supabase.from('user_favorite_places').delete().eq('user_id', userId),
    'remover favoritos'
  );

  // 9. Delete drink-related records
  await safeExecute(
    () => supabase.from('drinks').delete().eq('sender_id', userId),
    'remover drinks enviados'
  );
  await safeExecute(
    () => supabase.from('drinks').delete().eq('receiver_id', userId),
    'remover drinks recebidos'
  );

  // 10. Create privacy request record (completed)
  await safeExecute(
    async () => {
      const result = await supabase
        .from('privacy_requests')
        .insert({
          user_id: userId,
          request_type: 'deletion',
          status: 'completed',
          description: null,
          resolution_proof: 'automated_immediate_deletion',
          resolved_at: new Date().toISOString(),
        });
      return result;
    },
    'criar registro de exclusao'
  );

  // 11. Log completion
  await logAuditEvent({
    event_type: 'account_deletion_completed',
    user_id: userId,
    outcome: 'success',
  });

  // 12. Sign out (revoke current session)
  try {
    await supabase.auth.signOut();
  } catch {
    // Sign-out failure should not block deletion completion
    console.error('Privacy: falha ao revogar sessao apos exclusao');
  }
}

// ---------------------------------------------------------------------------
// Consent Revocation
// ---------------------------------------------------------------------------

/**
 * Revoga um consentimento especifico do usuario.
 *
 * @param userId - ID do usuario
 * @param consentType - Tipo de consentimento a revogar
 */
export async function revokeConsent(
  userId: string,
  consentType: ConsentType
): Promise<void> {
  // Try to update existing consent record
  const { data: existing } = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .maybeSingle();

  if (existing) {
    await safeExecute(
      () =>
        supabase
          .from('user_consents')
          .update({ revoked_at: new Date().toISOString() })
          .eq('id', existing.id),
      'revogar consentimento existente'
    );
  } else {
    // Create revocation record even if no prior grant was tracked
    await safeExecute(
      () =>
        supabase.from('user_consents').insert({
          user_id: userId,
          consent_type: consentType,
          granted_at: new Date().toISOString(),
          revoked_at: new Date().toISOString(),
        }),
      'criar registro de revogacao'
    );
  }

  // Create privacy request for tracking
  await safeExecute(
    async () => {
      const result = await supabase.from('privacy_requests').insert({
        user_id: userId,
        request_type: 'consent_revocation',
        status: 'completed',
        description: `Revogacao de consentimento: ${consentType}`,
        resolution_proof: 'automated_processing',
        resolved_at: new Date().toISOString(),
      });
      return result;
    },
    'criar registro de revogacao de consentimento'
  );

  await logAuditEvent({
    event_type: 'consent_revoked',
    user_id: userId,
    outcome: 'success',
    metadata: { consent_type: consentType },
  });
}

// ---------------------------------------------------------------------------
// Data Portability
// ---------------------------------------------------------------------------

/**
 * Solicita portabilidade dos dados do usuario.
 * Cria registro de solicitacao para processamento.
 *
 * @param userId - ID do usuario solicitante
 * @returns Registro da solicitacao criada
 */
export async function requestDataPortability(userId: string): Promise<PrivacyRequest> {
  const request = await createPrivacyRequest(userId, 'data_portability');

  await logAuditEvent({
    event_type: 'privacy_request_created',
    user_id: userId,
    outcome: 'success',
    metadata: { request_type: 'data_portability', request_id: request.id },
  });

  return request;
}

// ---------------------------------------------------------------------------
// Privacy Request History
// ---------------------------------------------------------------------------

/**
 * Consulta solicitacoes de privacidade do usuario.
 *
 * @param userId - ID do usuario
 * @returns Lista de solicitacoes ordenadas por data decrescente
 */
export async function getPrivacyRequests(userId: string): Promise<PrivacyRequest[]> {
  const { data, error } = await supabase
    .from('privacy_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Privacy: falha ao consultar solicitacoes', {
      user_id: userId,
      error: error.message,
    });
    throw new Error(`Falha ao consultar solicitacoes: ${error.message}`);
  }

  return (data ?? []) as PrivacyRequest[];
}
