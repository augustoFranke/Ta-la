/**
 * Central de Privacidade (LGPD)
 * Spec 011: LGPD & Privacy Compliance (Brazil)
 *
 * Fornece ao usuario acesso aos seus direitos como titular de dados:
 * - Transparencia sobre dados coletados
 * - Solicitacao de exportacao
 * - Solicitacao de correcao
 * - Solicitacao de exclusao
 * - Portabilidade
 * - Revogacao de consentimento
 * - Informacoes sobre compartilhamento
 *
 * SLA: 15 dias uteis para solicitacoes com revisao humana.
 * Exclusoes automaticas (via conta) sao processadas imediatamente.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/authStore';
import {
  requestDataExport,
  requestCorrection,
  requestDeletion,
  requestDataPortability,
  revokeConsent,
} from '../../../src/services/privacy';
import { DATA_COLLECTED, PRIVACY_REQUEST_SLA_BUSINESS_DAYS } from '../../../src/types/privacy';
import type { ConsentType } from '../../../src/types/privacy';

export default function PrivacyScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  }, []);

  const handleDataExport = useCallback(async () => {
    if (!userId) return;
    setLoading('export');
    try {
      await requestDataExport(userId);
      showSuccess(
        `Solicitacao registrada. Voce recebera seus dados em ate ${PRIVACY_REQUEST_SLA_BUSINESS_DAYS} dias uteis.`
      );
    } catch {
      Alert.alert('Erro', 'Nao foi possivel registrar sua solicitacao. Tente novamente.');
    } finally {
      setLoading(null);
    }
  }, [userId, showSuccess]);

  const handleCorrection = useCallback(async () => {
    if (!userId) return;
    Alert.prompt(
      'Corrigir dados',
      'Descreva o que precisa ser corrigido:',
      async (description) => {
        if (!description?.trim()) return;
        setLoading('correction');
        try {
          await requestCorrection(userId, description.trim());
          showSuccess(
            `Solicitacao de correcao registrada. Nossa equipe entrara em contato em ate ${PRIVACY_REQUEST_SLA_BUSINESS_DAYS} dias uteis.`
          );
        } catch {
          Alert.alert('Erro', 'Nao foi possivel registrar sua solicitacao.');
        } finally {
          setLoading(null);
        }
      },
      'plain-text'
    );
  }, [userId, showSuccess]);

  const handlePortability = useCallback(async () => {
    if (!userId) return;
    setLoading('portability');
    try {
      await requestDataPortability(userId);
      showSuccess(
        `Solicitacao de portabilidade registrada. Resposta em ate ${PRIVACY_REQUEST_SLA_BUSINESS_DAYS} dias uteis.`
      );
    } catch {
      Alert.alert('Erro', 'Nao foi possivel registrar sua solicitacao.');
    } finally {
      setLoading(null);
    }
  }, [userId, showSuccess]);

  const handleRevokeConsent = useCallback(
    async (consentType: ConsentType, label: string) => {
      if (!userId) return;
      Alert.alert(
        'Revogar consentimento',
        `Deseja revogar o consentimento para: ${label}? Isso pode limitar algumas funcionalidades do aplicativo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Revogar',
            style: 'destructive',
            onPress: async () => {
              setLoading(`consent_${consentType}`);
              try {
                await revokeConsent(userId, consentType);
                showSuccess(`Consentimento para "${label}" revogado com sucesso.`);
              } catch {
                Alert.alert('Erro', 'Nao foi possivel revogar o consentimento.');
              } finally {
                setLoading(null);
              }
            },
          },
        ]
      );
    },
    [userId, showSuccess]
  );

  const handleDeletion = useCallback(async () => {
    if (!userId) return;
    Alert.alert(
      'Excluir conta',
      'Esta acao e permanente e nao pode ser desfeita. Todos os seus dados serao removidos ou anonimizados conforme a LGPD.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar exclusao',
          style: 'destructive',
          onPress: async () => {
            setLoading('deletion');
            try {
              await requestDeletion(userId);
              router.replace('/(auth)/welcome');
            } catch {
              Alert.alert('Erro', 'Nao foi possivel excluir sua conta. Tente novamente ou entre em contato com o suporte.');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  }, [userId, router, showSuccess]);

  const sensitiveItems = DATA_COLLECTED.filter((item) => item.sensitive);
  const nonSensitiveItems = DATA_COLLECTED.filter((item) => !item.sensitive);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>

        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>Voltar</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text, fontSize: typography.sizes.xxl }]}>
          Central de Privacidade
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.sizes.md }]}>
          Conforme a Lei Geral de Protecao de Dados (LGPD), voce tem direitos sobre seus dados pessoais.
        </Text>

        {/* Success Banner */}
        {successMessage && (
          <View style={[styles.successBanner, { backgroundColor: colors.primary }]}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* SLA Notice */}
        <View style={[styles.slaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.slaTitle, { color: colors.text }]}>
            Prazo de atendimento
          </Text>
          <Text style={[styles.slaBody, { color: colors.textSecondary }]}>
            Atendemos solicitacoes de acesso, correcao e portabilidade em ate{' '}
            <Text style={{ fontWeight: '700', color: colors.text }}>
              {PRIVACY_REQUEST_SLA_BUSINESS_DAYS} dias uteis
            </Text>
            . Exclusoes de conta sao processadas imediatamente.
          </Text>
        </View>

        {/* ─── Section: Your Rights ─────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Seus direitos
        </Text>

        <PrivacyActionCard
          title="Solicitar meus dados"
          description="Receba uma copia completa dos seus dados pessoais que coletamos."
          actionLabel="Solicitar exportacao"
          loading={loading === 'export'}
          onPress={handleDataExport}
          colors={colors}
          spacing={spacing}
          typography={typography}
        />

        <PrivacyActionCard
          title="Corrigir meus dados"
          description="Solicite a correcao de dados pessoais incorretos ou desatualizados."
          actionLabel="Solicitar correcao"
          loading={loading === 'correction'}
          onPress={handleCorrection}
          colors={colors}
          spacing={spacing}
          typography={typography}
        />

        <PrivacyActionCard
          title="Portabilidade de dados"
          description="Receba seus dados em formato estruturado para migrar para outro servico."
          actionLabel="Solicitar portabilidade"
          loading={loading === 'portability'}
          onPress={handlePortability}
          colors={colors}
          spacing={spacing}
          typography={typography}
        />

        {/* ─── Section: Consent Revocation ─────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.xl }]}>
          Revogar consentimento
        </Text>

        <PrivacyActionCard
          title="Dados biometricos"
          description="Revogue o consentimento para uso de seus dados biometricos (foto facial para verificacao)."
          actionLabel="Revogar"
          loading={loading === 'consent_biometric_processing'}
          onPress={() => handleRevokeConsent('biometric_processing', 'dados biometricos')}
          colors={colors}
          spacing={spacing}
          typography={typography}
          variant="warning"
        />

        <PrivacyActionCard
          title="Preferencia de parceiro(a)"
          description="Revogue o consentimento para uso de sua preferencia de parceiro(a) nos filtros de descoberta."
          actionLabel="Revogar"
          loading={loading === 'consent_partner_preference_processing'}
          onPress={() =>
            handleRevokeConsent('partner_preference_processing', 'preferencia de parceiro(a)')
          }
          colors={colors}
          spacing={spacing}
          typography={typography}
          variant="warning"
        />

        <PrivacyActionCard
          title="Dados de documento"
          description="Revogue o consentimento para retencao de dados do documento nacional usado na verificacao."
          actionLabel="Revogar"
          loading={loading === 'consent_document_processing'}
          onPress={() => handleRevokeConsent('document_processing', 'dados de documento')}
          colors={colors}
          spacing={spacing}
          typography={typography}
          variant="warning"
        />

        {/* ─── Section: Data Transparency ──────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.xl }]}>
          Dados coletados
        </Text>

        <Text style={[styles.transparencyNote, { color: colors.textSecondary }]}>
          Coletamos apenas os dados necessarios para o funcionamento do aplicativo, conforme descrito abaixo.
        </Text>

        {/* Sensitive data */}
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>
          Dados sensiveis (LGPD Art. 11)
        </Text>
        {sensitiveItems.map((item) => (
          <DataItemRow key={item.field} item={item} colors={colors} />
        ))}

        {/* Non-sensitive data */}
        <Text style={[styles.subSectionTitle, { color: colors.text, marginTop: spacing.md }]}>
          Demais dados
        </Text>
        {nonSensitiveItems.map((item) => (
          <DataItemRow key={item.field} item={item} colors={colors} />
        ))}

        {/* ─── Section: Sharing Info ───────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: spacing.xl }]}>
          Compartilhamento de dados
        </Text>
        <View style={[styles.sharingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sharingBody, { color: colors.textSecondary }]}>
            Seus dados pessoais nao sao vendidos a terceiros. Podem ser compartilhados com:{'\n\n'}
            - Supabase (infraestrutura de banco de dados e autenticacao){'\n'}
            - Expo (plataforma de build e push notifications){'\n\n'}
            Compartilhamentos sao realizados apenas para fins operacionais e com provedores que garantem nivel adequado de protecao.
          </Text>
        </View>

        {/* ─── Danger Zone: Account Deletion ───────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: '#ef4444', marginTop: spacing.xl }]}>
          Zona de perigo
        </Text>

        <TouchableOpacity
          style={[styles.deleteButton, loading === 'deletion' && styles.buttonDisabled]}
          onPress={handleDeletion}
          disabled={loading === 'deletion'}
        >
          {loading === 'deletion' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Excluir minha conta permanentemente</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.deleteNote, { color: colors.textSecondary }]}>
          A exclusao e permanente e nao pode ser desfeita. Todos os dados sao removidos ou anonimizados imediatamente.
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Para duvidas, entre em contato: privacidade@tala.app
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface ThemeColors { primary: string; text: string; textSecondary: string; card: string; border: string; background: string }
interface ThemeSpacing { xs: number; sm: number; md: number; lg: number; xl: number }
interface ThemeTypography { sizes: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number } }

function PrivacyActionCard({
  title,
  description,
  actionLabel,
  loading,
  onPress,
  colors,
  spacing,
  typography,
  variant = 'default',
}: {
  title: string;
  description: string;
  actionLabel: string;
  loading: boolean;
  onPress: () => void;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  variant?: 'default' | 'warning';
}) {
  const buttonColor = variant === 'warning' ? '#f59e0b' : colors.primary;

  return (
    <View
      style={[
        styles.actionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          marginBottom: spacing.md,
        },
      ]}
    >
      <Text style={[styles.actionCardTitle, { color: colors.text, fontSize: typography.sizes.md }]}>
        {title}
      </Text>
      <Text style={[styles.actionCardDesc, { color: colors.textSecondary, fontSize: typography.sizes.sm }]}>
        {description}
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: buttonColor }, loading && styles.buttonDisabled]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function DataItemRow({
  item,
  colors,
}: {
  item: { field: string; description: string; purpose: string; required: boolean; sensitive: boolean };
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.dataRow, { borderBottomColor: colors.border }]}>
      <View style={styles.dataRowHeader}>
        <Text style={[styles.dataFieldName, { color: colors.text }]}>{item.description}</Text>
        {item.required ? (
          <Text style={styles.requiredBadge}>Obrigatorio</Text>
        ) : (
          <Text style={[styles.optionalBadge, { color: colors.textSecondary }]}>Opcional</Text>
        )}
      </View>
      <Text style={[styles.dataPurpose, { color: colors.textSecondary }]}>{item.purpose}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16 },
  title: { fontWeight: '800', marginBottom: 8 },
  subtitle: { lineHeight: 22, marginBottom: 20 },
  successBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: { color: '#000', fontWeight: '600', fontSize: 14, lineHeight: 20 },
  slaCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  slaTitle: { fontWeight: '700', marginBottom: 6, fontSize: 15 },
  slaBody: { fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  subSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  transparencyNote: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actionCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionCardTitle: { fontWeight: '700', marginBottom: 4 },
  actionCardDesc: { lineHeight: 20, marginBottom: 12 },
  actionButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#000', fontWeight: '700', fontSize: 14 },
  dataRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  dataFieldName: { fontWeight: '600', fontSize: 14, flex: 1 },
  requiredBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalBadge: { fontSize: 11, fontStyle: 'italic' },
  dataPurpose: { fontSize: 13, lineHeight: 18 },
  sharingCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sharingBody: { fontSize: 14, lineHeight: 22 },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteNote: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  footer: { marginTop: 32, paddingTop: 16, alignItems: 'center' },
  footerText: { fontSize: 12 },
  buttonDisabled: { opacity: 0.6 },
});
