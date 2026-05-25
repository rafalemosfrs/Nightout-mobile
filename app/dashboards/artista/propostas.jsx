import React, { useState } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../../constants/theme';

const mockProposals = [
  {
    id: '1',
    data_proposta: '2026-05-19T14:30:00Z',
    data_evento: '2026-06-15T20:00:00Z',
    valor_ofertado: 5200,
    status: 'PENDENTE',
    termos: 'Apresentacao de 60 minutos com PA e backline basico.',
  },
  {
    id: '2',
    data_proposta: '2026-05-10T10:15:00Z',
    data_evento: '2026-06-22T21:30:00Z',
    valor_ofertado: 7600,
    status: 'PENDENTE',
    termos: 'Show com setlist intimista, 2 musicos de apoio e divulgação conjunta.',
  },
  {
    id: '3',
    data_proposta: '2026-05-12T09:00:00Z',
    data_evento: '2026-07-02T19:00:00Z',
    valor_ofertado: 4300,
    status: 'PENDENTE',
    termos: 'Show acustico de 45 minutos + meet & greet opcional.',
  },
];

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

  if (!date) return 'Data nao informada';

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

export default function ArtistProposalsScreen() {
  const [proposals, setProposals] = useState(mockProposals);

  function updateProposalStatus(id, status) {
    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === id ? { ...proposal, status } : proposal
      )
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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

        {proposals.map((proposal) => (
          <View key={proposal.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Proposta do artista</Text>
              <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                <Text style={styles.statusText}>{getStatusLabel(proposal.status)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Proposta: {formatDateTime(proposal.data_proposta)}
              </Text>
            </View>

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
                  onPress={() => updateProposalStatus(proposal.id, 'ACEITA')}
                >
                  <Text style={[styles.proposalActionText, styles.acceptButtonText]}>Aceitar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.proposalActionButton, styles.rejectButton]}
                  activeOpacity={0.85}
                  onPress={() => updateProposalStatus(proposal.id, 'RECUSADA')}
                >
                  <Text style={[styles.proposalActionText, styles.rejectButtonText]}>Recusar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
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
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
});
