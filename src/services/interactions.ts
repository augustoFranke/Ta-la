import { supabase } from './supabase';
import type { InteractionType, ReceivedInteraction } from '../types/database';

const INTERACTION_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated: 'Voce precisa estar logado.',
  self_interaction: 'Voce nao pode interagir consigo mesmo.',
  no_active_check_in: 'Voce precisa estar com check-in ativo neste local.',
  receiver_not_at_venue: 'Esta pessoa nao esta mais neste local.',
  receiver_unavailable: 'Esta pessoa nao esta disponivel no momento.',
  already_sent: 'Voce ja enviou este tipo de interacao para esta pessoa.',
  invalid_type: 'Tipo de interacao invalido.',
};

export async function sendInteraction(params: {
  receiverId: string;
  venueId: string;
  type: InteractionType;
}): Promise<{ success: boolean; interaction_id?: string; is_match?: boolean }> {
  const { data, error } = await supabase.rpc('send_interaction', {
    p_receiver_id: params.receiverId,
    p_venue_id: params.venueId,
    p_interaction_type: params.type,
  });

  if (error) throw error;

  const result = data as {
    success: boolean;
    error?: string;
    interaction_id?: string;
    is_match?: boolean;
  };

  if (!result.success) {
    const code = result.error ?? 'unknown';
    const message = INTERACTION_ERROR_MESSAGES[code] ?? 'Nao foi possivel enviar.';
    throw new Error(message);
  }

  return result;
}

export async function fetchReceivedInteractions(
  userId: string,
  venueId: string,
): Promise<ReceivedInteraction[]> {
  const { data, error } = await supabase.rpc('get_received_interactions', {
    p_user_id: userId,
    p_venue_id: venueId,
  });

  if (error) throw error;
  return (data ?? []) as ReceivedInteraction[];
}

export async function unmatch(matchedUserId: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error('Voce precisa estar logado.');

  const user1 = userId < matchedUserId ? userId : matchedUserId;
  const user2 = userId < matchedUserId ? matchedUserId : userId;

  const { error } = await supabase
    .from('matches')
    .update({ unmatched_at: new Date().toISOString() })
    .eq('user1_id', user1)
    .eq('user2_id', user2);

  if (error) throw error;
}
