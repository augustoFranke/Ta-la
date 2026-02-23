/**
 * Tipos de privacidade e LGPD
 * Definicoes de tipos para solicitacoes de privacidade, auditoria e exportacao de dados
 */

// --- Privacy Request Types ---

export type PrivacyRequestType =
  | 'data_export'
  | 'deletion'
  | 'correction'
  | 'consent_revocation'
  | 'data_portability';

export type PrivacyRequestStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type ConsentType =
  | 'biometric_processing'
  | 'partner_preference_processing'
  | 'document_processing'
  | 'marketing';

export interface PrivacyRequest {
  id: string;
  user_id: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  description: string | null;
  resolution_proof: string | null;
  created_at: string;
  resolved_at: string | null;
}

// --- Audit Types ---

export type AuditEventType =
  | 'privacy_request_created'
  | 'privacy_request_resolved'
  | 'account_deletion_initiated'
  | 'account_deletion_completed'
  | 'data_export_generated'
  | 'consent_revoked'
  | 'verification_attempt';

export type AuditOutcome = 'success' | 'failure' | 'partial';

export interface AuditEvent {
  event_type: AuditEventType;
  user_id: string;
  outcome: AuditOutcome;
  metadata?: Record<string, string>;
}

export interface AuditRecord extends AuditEvent {
  id: string;
  timestamp: string;
}

// --- User Data Export ---

export interface UserDataExportProfile {
  name: string;
  email: string;
  bio: string | null;
  occupation: string | null;
  gender: string;
  gender_preference: string;
  birth_date: string;
  created_at: string;
}

export interface UserDataExportCheckIn {
  venue_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
}

export interface UserDataExportInteraction {
  interaction_type: string;
  created_at: string;
}

export interface UserDataExportMatch {
  matched_at: string;
}

export interface UserDataExportConsent {
  consent_type: string;
  granted_at: string;
  revoked_at: string | null;
}

export interface UserDataExport {
  profile: UserDataExportProfile;
  photos: { url: string; order: number }[];
  interests: string[];
  check_in_history: UserDataExportCheckIn[];
  interactions_sent: UserDataExportInteraction[];
  interactions_received: UserDataExportInteraction[];
  matches: UserDataExportMatch[];
  consent_records: UserDataExportConsent[];
}

// --- Data Collection Disclosure ---

export interface DataCollectedItem {
  category: string;
  field: string;
  description: string;
  purpose: string;
  required: boolean;
  sensitive: boolean;
}

/**
 * Lista completa dos dados coletados pelo aplicativo.
 * Exibida na Central de Privacidade para transparencia conforme LGPD.
 */
export const DATA_COLLECTED: readonly DataCollectedItem[] = [
  {
    category: 'Identificacao',
    field: 'name',
    description: 'Nome completo',
    purpose: 'Identificacao do usuario no aplicativo',
    required: true,
    sensitive: false,
  },
  {
    category: 'Identificacao',
    field: 'email',
    description: 'Endereco de e-mail',
    purpose: 'Autenticacao e comunicacao',
    required: true,
    sensitive: false,
  },
  {
    category: 'Identificacao',
    field: 'birth_date',
    description: 'Data de nascimento',
    purpose: 'Verificacao de idade minima e filtros de descoberta',
    required: true,
    sensitive: false,
  },
  {
    category: 'Perfil',
    field: 'bio',
    description: 'Biografia',
    purpose: 'Apresentacao pessoal para outros usuarios',
    required: false,
    sensitive: false,
  },
  {
    category: 'Perfil',
    field: 'occupation',
    description: 'Ocupacao',
    purpose: 'Apresentacao pessoal para outros usuarios',
    required: false,
    sensitive: false,
  },
  {
    category: 'Perfil',
    field: 'photos',
    description: 'Fotos de perfil',
    purpose: 'Apresentacao visual para outros usuarios',
    required: true,
    sensitive: false,
  },
  {
    category: 'Perfil',
    field: 'interests',
    description: 'Interesses',
    purpose: 'Descoberta e compatibilidade entre usuarios',
    required: false,
    sensitive: false,
  },
  {
    category: 'Dados sensiveis',
    field: 'gender',
    description: 'Genero / sexo biologico',
    purpose: 'Filtros de preferencia de parceiro(a)',
    required: true,
    sensitive: true,
  },
  {
    category: 'Dados sensiveis',
    field: 'gender_preference',
    description: 'Preferencia de parceiro(a)',
    purpose: 'Filtros de descoberta de usuarios compativeis',
    required: true,
    sensitive: true,
  },
  {
    category: 'Dados sensiveis',
    field: 'document_data',
    description: 'Dados de documento nacional (CPF/RG)',
    purpose: 'Verificacao de identidade',
    required: true,
    sensitive: true,
  },
  {
    category: 'Dados sensiveis',
    field: 'biometric_data',
    description: 'Dados biometricos (foto facial para validacao)',
    purpose: 'Verificacao de identidade por reconhecimento facial',
    required: true,
    sensitive: true,
  },
  {
    category: 'Localizacao',
    field: 'location',
    description: 'Localizacao geografica',
    purpose: 'Descoberta de locais proximos e check-in',
    required: true,
    sensitive: false,
  },
  {
    category: 'Atividade',
    field: 'check_ins',
    description: 'Historico de check-ins',
    purpose: 'Registro de presenca em locais',
    required: false,
    sensitive: false,
  },
  {
    category: 'Atividade',
    field: 'interactions',
    description: 'Interacoes (drinks, likes)',
    purpose: 'Funcionalidades sociais do aplicativo',
    required: false,
    sensitive: false,
  },
  {
    category: 'Atividade',
    field: 'matches',
    description: 'Conexoes confirmadas',
    purpose: 'Funcionalidades sociais do aplicativo',
    required: false,
    sensitive: false,
  },
] as const;

/**
 * Categorias de dados sensiveis conforme LGPD (Art. 11).
 * Biometria, documentos nacionais e preferencia de parceiro(a).
 */
export const SENSITIVE_DATA_CATEGORIES = [
  'biometric_data',
  'document_data',
  'gender',
  'gender_preference',
] as const;

/**
 * Chaves proibidas em metadados de auditoria.
 * Nunca devem aparecer em logs.
 */
export const FORBIDDEN_AUDIT_METADATA_KEYS = [
  'document_number',
  'cpf',
  'rg',
  'cnh',
  'face_capture',
  'document_photo',
  'biometric_data',
  'selfie',
  'face_image',
] as const;

/** SLA para resposta a solicitacoes de privacidade (dias uteis) */
export const PRIVACY_REQUEST_SLA_BUSINESS_DAYS = 15;
