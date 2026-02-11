import { supabase } from './supabase';

type DrinkStatus = 'pending' | 'accepted' | 'declined';

type DrinkRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: DrinkStatus;
  venue_id: string;
  created_at: string;
};

type MatchRow = {
  user1_id: string;
  user2_id: string;
  confirmed: boolean;
};

export type DrinkRelationState =
  | 'none'
  | 'sent_pending'
  | 'received_pending'
  | 'sent_accepted'
  | 'received_accepted'
  | 'matched';

export type DrinkRelation = {
  state: DrinkRelationState;
  incomingDrinkId?: string;
};

function getOtherUserId(userId: string, drink: DrinkRow): string | null {
  if (drink.sender_id === userId) return drink.receiver_id;
  if (drink.receiver_id === userId) return drink.sender_id;
  return null;
}

export async function fetchDrinkRelations(
  userId: string,
  targetIds: string[]
): Promise<Record<string, DrinkRelation>> {
  if (!userId || targetIds.length === 0) return {};

  const targetSet = new Set(targetIds);
  const relationMap: Record<string, DrinkRelation> = {};

  targetIds.forEach((targetId) => {
    relationMap[targetId] = { state: 'none' };
  });

  const { data: matchesData } = await supabase
    .from('matches')
    .select('user1_id, user2_id, confirmed')
    .eq('confirmed', true)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  (matchesData ?? []).forEach((match) => {
    const row = match as MatchRow;
    const other = row.user1_id === userId ? row.user2_id : row.user1_id;
    if (targetSet.has(other)) {
      relationMap[other] = { state: 'matched' };
    }
  });

  const { data: drinksData } = await supabase
    .from('drinks')
    .select('id, sender_id, receiver_id, status, venue_id, created_at')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(300);

  (drinksData ?? []).forEach((row) => {
    const drink = row as DrinkRow;
    const other = getOtherUserId(userId, drink);
    if (!other || !targetSet.has(other)) return;
    if (relationMap[other]?.state === 'matched') return;
    if (relationMap[other]?.state !== 'none') return;

    if (drink.status === 'pending') {
      if (drink.sender_id === userId) {
        relationMap[other] = { state: 'sent_pending' };
      } else {
        relationMap[other] = { state: 'received_pending', incomingDrinkId: drink.id };
      }
      return;
    }

    if (drink.status === 'accepted') {
      relationMap[other] = {
        state: drink.sender_id === userId ? 'sent_accepted' : 'received_accepted',
      };
    }
  });

  return relationMap;
}

const DRINK_ERROR_MESSAGES: Record<string, string> = {
  no_active_check_in: 'Voce precisa estar com check-in ativo neste local para enviar um drink.',
  self_drink: 'Voce nao pode enviar um drink para si mesmo.',
  already_sent: 'Voce ja enviou um drink para esta pessoa neste local.',
  not_authenticated: 'Voce precisa estar logado.',
  receiver_unavailable: 'Esta pessoa nao esta disponivel para receber drinks no momento.',
};

// Server RPC checks is_available — returns 'receiver_unavailable' if target user is unavailable
export async function sendDrinkOffer(params: {
  receiverId: string;
  venueId: string;
  note?: string;
}) {
  const { receiverId, venueId, note } = params;

  const { data, error } = await supabase.rpc('send_drink_offer_v2', {
    p_receiver_id: receiverId,
    p_venue_id: venueId,
    p_note: note ?? null,
  });

  if (error) throw error;

  const result = data as { success: boolean; error?: string; drink_id?: string };

  if (!result.success) {
    const code = result.error ?? 'unknown';
    const message = DRINK_ERROR_MESSAGES[code] ?? 'Nao foi possivel enviar o drink.';
    throw new Error(message);
  }

  return result;
}

export async function respondDrinkOffer(params: {
  drinkId: string;
  action: 'accepted' | 'declined';
}) {
  const { drinkId, action } = params;

  const { error } = await supabase
    .from('drinks')
    .update({ status: action })
    .eq('id', drinkId);

  if (error) throw error;
}
