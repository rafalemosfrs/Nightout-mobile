import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { proposalService } from '../../../services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../../constants/theme';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) return 'Data não informada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeStatus(status) {
  return String(status || 'PENDENTE').toUpperCase();
}

function isAccepted(status) {
  return ['ACEITA', 'ACEITO', 'APROVADA', 'APROVADO', 'CONFIRMADO'].includes(
    normalizeStatus(status)
  );
}

function isPending(status) {
  return ['PENDENTE', 'ENVIADA', 'ABERTA'].includes(normalizeStatus(status));
}

function getStatusStyle(status) {
  if (isAccepted(status)) {
    return styles.statusSuccess;
  }

  if (isPending(status)) {
    return styles.statusPending;
  }

  return styles.statusDanger;
}

function getStatusLabel(status) {
  if (isAccepted(status)) return 'Aceita';
  if (isPending(status)) return 'Pendente';
  if (normalizeStatus(status) === 'RECUSADA') return 'Recusada';
  return normalizeStatus(status);
}

function normalizeProposal(item) {
  const event = item?.evento || {};
  const house = item?.casaDeShow || item?.casa || event?.casaDeShow || {};
  
  return {
    id: item?.id || item?.id_proposta || item?.id_proposta_casa || item?.uuid,
    data_proposta: item?.data_proposta || item?.createdAt || null,
    data_evento: item?.data_evento || event?.data_inicio || item?.data_inicio || null,
    valor_ofertado: Number(item?.valor_ofertado || item?.valor || 0),
    status: normalizeStatus(item?.status),
    termos: item?.termos || '',
    eventTitle: event?.titulo || item?.titulo || 'Apresentação Musical',
    houseName: house?.nome_fantasia || house?.nome || item?.nome_casa || 'Casa de Show',
    address: event?.local || house?.endereco || item?.local || 'Local não informado',
  };
}

export default function ArtistProposalsScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadProposals = useCallback(async () => {
    const artistId = session?.id_usuario || session?.id;
    if (!artistId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const response = await proposalService.listByArtist(artistId);
      setProposals(Array.isArray(response) ? response.map(normalizeProposal) : []);
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível carregar as propostas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.id_usuario, session?.id]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProposals();
  }

  async function handleProposalAction(id, status) {
    if (!id) {
      Alert.alert('Erro', 'A proposta não possui ID para atualização.');
      return;
    }

    try {
      setUpdatingId(id);
      await proposalService.update(id, { status });
      setProposals((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: normalizeStatus(status) } : item
        )
      );
      Alert.alert('Sucesso', `Proposta ${status === 'ACEITA' ? 'aceita' : 'recusada'} com sucesso.`);
    } catch (requestError) {
      Alert.alert(
        'Erro',
        requestError.message || 'Não foi possível atualizar o status da proposta.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando propostas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/artista')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas do artista</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Todas as propostas</Text>
          </View>
          <Text style={styles.heroText}>
            Consulta rápida das propostas do artista com status, valores e termos.
          </Text>
        </View>

        {error ? (
          <TouchableOpacity
            style={styles.errorCard}
            activeOpacity={0.85}
            onPress={loadProposals}
          >
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        {proposals.length > 0 ? (
          proposals.map((proposal) => (
            <View key={proposal.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{proposal.eventTitle}</Text>
                <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                  <Text style={styles.statusText}>{getStatusLabel(proposal.status)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="storefront-outline" size={14} color={colors.primary} />
                <Text style={[styles.infoText, { fontWeight: '700', color: colors.primary }]}>
                  {proposal.houseName}
                </Text>
              </View>

              {proposal.address ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>Local: {proposal.address}</Text>
                </View>
              ) : null}

              {proposal.data_proposta ? (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Enviada: {formatDateTime(proposal.data_proposta)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  Evento: {formatDateTime(proposal.data_evento)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>
                  Valor ofertado: {formatCurrency(proposal.valor_ofertado)}
                </Text>
              </View>

              {proposal.termos ? (
                <View style={styles.termsBox}>
                  <Text style={styles.termsLabel}>Termos</Text>
                  <Text style={styles.termsText}>{proposal.termos}</Text>
                </View>
              ) : null}

              {isPending(proposal.status) ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.proposalActionButton, styles.acceptButton]}
                    activeOpacity={0.85}
                    disabled={updatingId !== null}
                    onPress={() => handleProposalAction(proposal.id, 'ACEITA')}
                  >
                    {updatingId === proposal.id ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Text style={[styles.proposalActionText, styles.acceptButtonText]}>Aceitar</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.proposalActionButton, styles.rejectButton]}
                    activeOpacity={0.85}
                    disabled={updatingId !== null}
                    onPress={() => handleProposalAction(proposal.id, 'RECUSADA')}
                  >
                    {updatingId === proposal.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Text style={[styles.proposalActionText, styles.rejectButtonText]}>Recusar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Nenhuma proposta recebida</Text>
            <Text style={styles.emptyStateText}>
              Assim que uma casa de show enviar uma proposta para você, ela aparecerá nesta listagem.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  heroText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 8,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusSuccess: {
    backgroundColor: 'rgba(25, 211, 138, 0.14)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  statusDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  termsBox: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  termsLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  proposalActionButton: {
    width: '48%',
    height: 42,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.backgroundLight,
  },
  acceptButton: {
    borderColor: '#047857',
  },
  rejectButton: {
    borderColor: '#B91C1C',
  },
  proposalActionText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  acceptButtonText: {
    color: '#10B981',
  },
  rejectButtonText: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  emptyStateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
