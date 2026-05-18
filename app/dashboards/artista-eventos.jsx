import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
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

const STATUS_OPTIONS = ['TODOS', 'CONFIRMADO', 'PENDENTE'];

const MOCK_EVENTOS_ARTISTA = [
  {
    id: 'evt-artista-001',
    titulo: 'Terapia sem fim com Nattan',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'CONFIRMADO',
    termos: 'Cache confirmado mediante acordo com a casa de show.',
    imagem:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'evt-artista-002',
    titulo: 'Festa',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'CONFIRMADO',
    termos: 'Apresentação confirmada para o horário combinado.',
    imagem:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'evt-artista-003',
    titulo: 'After com Nattan',
    local: 'Living Music Hall',
    horario: '23:30',
    valor: 'R$ 18.000',
    status: 'PENDENTE',
    termos: 'Aguardando confirmação final da casa de show.',
    imagem:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
  },
];

function getStatusStyles(status) {
  if (status === 'CONFIRMADO') {
    return {
      text: styles.statusConfirmedText,
      icon: 'checkmark-outline',
      color: colors.success,
      label: 'Confirmado',
    };
  }

  return {
    text: styles.statusPendingText,
    icon: 'time-outline',
    color: '#F59E0B',
    label: 'Pendente',
  };
}

export default function ArtistaEventosScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return MOCK_EVENTOS_ARTISTA.filter((evento) => {
      const matchesStatus =
        selectedStatus === 'TODOS' || evento.status === selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        evento.titulo.toLowerCase().includes(normalizedSearch) ||
        evento.local.toLowerCase().includes(normalizedSearch) ||
        evento.status.toLowerCase().includes(normalizedSearch) ||
        evento.valor.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, selectedStatus]);

  const totalConfirmados = MOCK_EVENTOS_ARTISTA.filter(
    (evento) => evento.status === 'CONFIRMADO'
  ).length;

  const totalPendentes = MOCK_EVENTOS_ARTISTA.filter(
    (evento) => evento.status === 'PENDENTE'
  ).length;

  const selectedEventStatus = selectedEvent
    ? getStatusStyles(selectedEvent.status)
    : null;

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
            onPress={() => router.push('/dashboards/artista')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Eventos do Artista</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="music-note-eighth"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.heroTitle}>Meus Eventos</Text>
          </View>

          <Text style={styles.heroSubtitle}>
            Eventos confirmados onde você irá se apresentar.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{MOCK_EVENTOS_ARTISTA.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalConfirmados}</Text>
            <Text style={styles.summaryLabel}>Confirmados</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalPendentes}</Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textMuted}
              style={styles.searchIcon}
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por evento, local ou status..."
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

          {showFilters ? (
            <View style={styles.filtersContainer}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.85}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
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
        </View>

        <View style={styles.eventsList}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((evento) => {
              const statusStyles = getStatusStyles(evento.status);

              return (
                <TouchableOpacity
                  key={evento.id}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                  onPress={() => setSelectedEvent(evento)}
                >
                  <Image
                    source={{ uri: evento.imagem }}
                    style={styles.eventImage}
                    resizeMode="cover"
                  />

                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{evento.titulo}</Text>

                    <View style={styles.metaRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.metaText}>{evento.local}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.metaText}>{evento.horario}</Text>
                    </View>

                    <Text style={styles.eventValue}>{evento.valor}</Text>

                    <Text style={styles.termsLabel}>Termos:</Text>
                    <Text style={styles.termsText}>{evento.termos}</Text>

                    <View style={styles.statusRow}>
                      <Text style={[styles.statusText, statusStyles.text]}>
                        {statusStyles.label}
                      </Text>

                      <Ionicons
                        name={statusStyles.icon}
                        size={16}
                        color={statusStyles.color}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="calendar-search"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyStateTitle}>Nenhum evento encontrado</Text>
              <Text style={styles.emptyStateText}>
                Tente ajustar a busca ou alterar o filtro selecionado.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedEvent}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Evento</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedEvent(null)}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedEvent ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{ uri: selectedEvent.imagem }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />

                <Text style={styles.modalEventTitle}>{selectedEvent.titulo}</Text>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.modalInfoText}>{selectedEvent.local}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.modalInfoText}>{selectedEvent.horario}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={colors.success}
                  />
                  <Text style={styles.modalValue}>{selectedEvent.valor}</Text>
                </View>

                <Text style={styles.modalSectionLabel}>Termos</Text>
                <Text style={styles.modalTerms}>{selectedEvent.termos}</Text>

                <View style={styles.modalStatusBox}>
                  <Text
                    style={[
                      styles.modalStatusText,
                      selectedEventStatus?.text,
                    ]}
                  >
                    {selectedEventStatus?.label}
                  </Text>

                  <Ionicons
                    name={selectedEventStatus?.icon}
                    size={16}
                    color={selectedEventStatus?.color}
                  />
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginLeft: 8,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  actionsCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
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
    marginTop: spacing.md,
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
  eventsList: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  eventImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: '#101728',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
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
    flex: 1,
  },
  eventValue: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  termsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  termsText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginRight: 4,
  },
  statusConfirmedText: {
    color: colors.success,
  },
  statusPendingText: {
    color: '#F59E0B',
  },
  emptyState: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    backgroundColor: '#101728',
    marginBottom: spacing.md,
  },
  modalEventTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalInfoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  modalValue: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalSectionLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  modalTerms: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalStatusBox: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  modalStatusText: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginRight: 6,
  },
});