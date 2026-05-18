import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const STATUS_OPTIONS = ['TODAS', 'ACEITA', 'PENDENTE'];

const MOCK_PROPOSTAS = [
  {
    id: 'prop-001',
    data: 'NOV. 24',
    titulo: 'Terapia sem fim com Nattan',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'ACEITA',
  },
  {
    id: 'prop-002',
    data: 'NOV. 24',
    titulo: 'Festa',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'ACEITA',
  },
  {
    id: 'prop-003',
    data: 'NOV. 24',
    titulo: 'After com Nattan',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'PENDENTE',
  },
];

function getStatusStyles(status) {
  if (status === 'ACEITA') {
    return {
      badge: styles.statusAcceptedBadge,
      text: styles.statusAcceptedText,
    };
  }

  return {
    badge: styles.statusPendingBadge,
    text: styles.statusPendingText,
  };
}

export default function CasaShowPropostasScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODAS');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPropostas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return MOCK_PROPOSTAS.filter((proposta) => {
      const matchesStatus =
        selectedStatus === 'TODAS' || proposta.status === selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        proposta.titulo.toLowerCase().includes(normalizedSearch) ||
        proposta.local.toLowerCase().includes(normalizedSearch) ||
        proposta.status.toLowerCase().includes(normalizedSearch) ||
        proposta.valor.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, selectedStatus]);
 
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Novas propostas enviadas para artistas
            </Text>

            <Text style={styles.heroSubtitle}>
              Visualize, filtre e acompanhe as propostas enviadas pela casa.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newProposalButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/casashow-eventos')}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.newProposalButtonText}>Nova Proposta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{MOCK_PROPOSTAS.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {MOCK_PROPOSTAS.filter((item) => item.status === 'ACEITA').length}
            </Text>
            <Text style={styles.summaryLabel}>Aceitas</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {MOCK_PROPOSTAS.filter((item) => item.status === 'PENDENTE').length}
            </Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.listTitle}>Lista de Propostas</Text>
            </View>

            <View style={styles.actionsColumn}>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />

                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por data, local ou status..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.85}
                onPress={() => setShowFilters((prevState) => !prevState)}
              >
                <Ionicons name="options-outline" size={18} color={colors.text} />
                <Text style={styles.filterButtonText}>Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showFilters ? (
            <View style={styles.filtersContainer}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.proposalsList}>
            {filteredPropostas.length > 0 ? (
              filteredPropostas.map((proposta) => {
                const statusStyles = getStatusStyles(proposta.status);

                return (
                  <TouchableOpacity
                    key={proposta.id}
                    style={styles.proposalCard}
                    activeOpacity={0.85}
                    onPress={() => router.push('/dashboards/casashow-eventos')}
                  >
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMonth}>
                        {proposta.data.split(' ')[0]}
                      </Text>
                      <Text style={styles.dateDay}>
                        {proposta.data.split(' ')[1]}
                      </Text>
                    </View>

                    <View style={styles.proposalContent}>
                      <Text style={styles.proposalTitle} numberOfLines={1}>
                        {proposta.titulo}
                      </Text>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{proposta.local}</Text>
                      </View>

                      <View style={styles.proposalFooter}>
                        <View style={styles.metaRow}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText}>{proposta.horario}</Text>
                        </View>

                        <Text style={styles.proposalValue}>{proposta.valor}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusBadge, statusStyles.badge]}>
                      <Text style={[styles.statusText, statusStyles.text]}>
                        {proposta.status === 'ACEITA' ? 'Aceita' : 'Pendente'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={46}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyStateTitle}>
                  Nenhuma proposta encontrada
                </Text>
                <Text style={styles.emptyStateText}>
                  Ajuste a busca ou altere os filtros para visualizar propostas.
                </Text>
              </View>
            )}
          </View>
        </View>
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
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroTextContainer: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  newProposalButton: {
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    ...shadows.small,
  },
  newProposalButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCard: {
    width: '31.5%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  searchBox: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  filterButton: {
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.primary,
  },
  proposalsList: {
    marginTop: spacing.xs,
  },
  proposalCard: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateBox: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  proposalContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  proposalTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flexShrink: 1,
  },
  proposalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proposalValue: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusAcceptedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusAcceptedText: {
    color: colors.success,
  },
  statusPendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  statusPendingText: {
    color: '#F59E0B',
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