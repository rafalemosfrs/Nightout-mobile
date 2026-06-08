import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
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
import { eventService, proposalService, usersService } from '../../services/api';
import {
  formatDateTime,
  getEventId,
  isAcceptedProposal,
  normalizeEvent,
  normalizeProposal,
  parseApiDate,
} from '../../utils/casaShowData';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80';

function getEventType(eventItem) {
  return (
    eventItem.tipo ||
    eventItem.categoria ||
    eventItem.genero_musical ||
    eventItem.genero ||
    eventItem.status ||
    'Evento'
  );
}

function normalizeStatus(status) {
  return String(status || 'PENDENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isConfirmedArtist(eventArtist) {
  const status = normalizeStatus(eventArtist?.status || 'CONFIRMADO');

  return ['ACEITA', 'ACEITO', 'CONFIRMADO', 'CONFIRMADA', 'APROVADO', 'APROVADA'].includes(
    status
  );
}

function getArtistNameFromObject(artistItem) {
  const artista = artistItem?.artista || artistItem?.Artista || artistItem || {};
  const usuario = artista?.usuario || {};

  return (
    artista.nome_artista ||
    artista.nome ||
    usuario.nome ||
    artista.email ||
    usuario.email ||
    'Artista confirmado'
  );
}

function getCasaNameFromObject(casaItem) {
  const casa = casaItem?.casaDeShow || casaItem?.CasaDeShow || casaItem?.casa || casaItem || {};
  const usuario = casa?.usuario || {};

  return (
    casa.nome_fantasia ||
    casa.nome ||
    usuario.nome ||
    casa.email ||
    usuario.email ||
    'Casa de show'
  );
}

function getProposalEventId(proposal) {
  return (
    proposal?.id_evento ||
    proposal?.idEvento ||
    proposal?.evento?.id_evento ||
    proposal?.evento?.id ||
    ''
  );
}

function getProposalArtistId(proposal) {
  return (
    proposal?.id_artista ||
    proposal?.idArtista ||
    proposal?.artista?.id_usuario ||
    proposal?.artista?.id ||
    ''
  );
}

function getProposalCasaId(proposal) {
  return (
    proposal?.id_casa_show ||
    proposal?.idCasaShow ||
    proposal?.casaDeShow?.id_usuario ||
    proposal?.casaDeShow?.id ||
    proposal?.casa?.id_usuario ||
    proposal?.casa?.id ||
    ''
  );
}

function getEventCasaId(eventItem) {
  return (
    eventItem?.id_casa_show ||
    eventItem?.idCasaShow ||
    eventItem?.id_usuario ||
    eventItem?.idUsuario ||
    eventItem?.casaDeShow?.id_usuario ||
    eventItem?.casaDeShow?.id ||
    eventItem?.casa?.id_usuario ||
    eventItem?.casa?.id ||
    ''
  );
}

function getArtistNameFromProposal(proposal) {
  return (
    proposal?.artista_nome ||
    proposal?.nome_artista ||
    proposal?.artista?.nome_artista ||
    proposal?.artista?.nome ||
    proposal?.artista?.usuario?.nome ||
    proposal?.Artista?.nome_artista ||
    proposal?.Artista?.nome ||
    proposal?.Artista?.usuario?.nome ||
    ''
  );
}

function getCasaNameFromProposal(proposal) {
  return (
    proposal?.casa_nome ||
    proposal?.nome_casa ||
    proposal?.casa_show_nome ||
    proposal?.casaDeShow?.nome_fantasia ||
    proposal?.casaDeShow?.nome ||
    proposal?.casaDeShow?.usuario?.nome ||
    proposal?.casa?.nome_fantasia ||
    proposal?.casa?.nome ||
    proposal?.casa?.usuario?.nome ||
    ''
  );
}

async function enrichAcceptedProposal(proposal) {
  const normalizedProposal = normalizeProposal(proposal);
  const artistId = getProposalArtistId(normalizedProposal);
  const casaId = getProposalCasaId(normalizedProposal);

  const [artistResult, casaResult] = await Promise.allSettled([
    artistId ? usersService.getArtist(artistId) : Promise.resolve(null),
    casaId ? usersService.getCasaShow(casaId) : Promise.resolve(null),
  ]);

  const artista =
    artistResult.status === 'fulfilled' && artistResult.value
      ? artistResult.value
      : null;

  const casa =
    casaResult.status === 'fulfilled' && casaResult.value
      ? casaResult.value
      : null;

  return {
    ...normalizedProposal,
    artista,
    casaDeShow: casa,
    artista_nome:
      getArtistNameFromObject(artista) ||
      getArtistNameFromProposal(normalizedProposal) ||
      'Artista confirmado',
    casa_nome:
      getCasaNameFromObject(casa) ||
      getCasaNameFromProposal(normalizedProposal) ||
      'Casa de show',
  };
}

async function enrichEventWithCasa(eventItem, proposalsForEvent = []) {
  const normalizedEvent = normalizeEvent(eventItem);

  const eventCasaId = getEventCasaId(normalizedEvent);
  const proposalCasaId = proposalsForEvent.length > 0 ? getProposalCasaId(proposalsForEvent[0]) : '';
  const casaId = eventCasaId || proposalCasaId;

  if (!casaId) {
    return {
      ...normalizedEvent,
      casa_nome: 'Casa de show',
    };
  }

  try {
    const casa = await usersService.getCasaShow(casaId);

    return {
      ...normalizedEvent,
      casaDeShow: casa,
      casa_nome: getCasaNameFromObject(casa),
    };
  } catch (requestError) {
    console.log('ERRO AO BUSCAR CASA DO EVENTO:', requestError);

    return {
      ...normalizedEvent,
      casa_nome:
        getCasaNameFromProposal(proposalsForEvent[0]) ||
        getCasaNameFromObject(normalizedEvent?.casaDeShow) ||
        'Casa de show',
    };
  }
}

export default function PublicEventsScreen() {
  const [events, setEvents] = useState([]);
  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setError('');

      const [eventsResult, proposalsResult] = await Promise.allSettled([
        eventService.list({ page: 1, pageSize: 50 }),
        proposalService.list(),
      ]);

      let enrichedAcceptedProposals = [];

      if (proposalsResult.status === 'fulfilled') {
        console.log('PROPOSTAS PUBLICAS - API:', JSON.stringify(proposalsResult.value, null, 2));

        const proposalList = Array.isArray(proposalsResult.value)
          ? proposalsResult.value
          : [];

        const onlyAccepted = proposalList
          .map(normalizeProposal)
          .filter((proposal) => isAcceptedProposal(proposal.status));

        enrichedAcceptedProposals = await Promise.all(
          onlyAccepted.map((proposal) => enrichAcceptedProposal(proposal))
        );

        console.log(
          'PROPOSTAS ACEITAS COM ARTISTAS E CASAS:',
          JSON.stringify(enrichedAcceptedProposals, null, 2)
        );

        setAcceptedProposals(enrichedAcceptedProposals);
      } else {
        console.log('ERRO AO BUSCAR PROPOSTAS PUBLICAS:', proposalsResult.reason);
        setAcceptedProposals([]);
      }

      if (eventsResult.status === 'fulfilled') {
        console.log('EVENTOS PUBLICOS - API:', JSON.stringify(eventsResult.value, null, 2));

        const eventList = Array.isArray(eventsResult.value)
          ? eventsResult.value
          : [];

        const enrichedEvents = await Promise.all(
          eventList.map((eventItem) => {
            const normalizedEvent = normalizeEvent(eventItem);
            const eventId = getEventId(normalizedEvent);

            const proposalsForEvent = enrichedAcceptedProposals.filter(
              (proposal) => getProposalEventId(proposal) === eventId
            );

            return enrichEventWithCasa(normalizedEvent, proposalsForEvent);
          })
        );

        console.log(
          'EVENTOS PUBLICOS - ENRIQUECIDOS COM CASA:',
          JSON.stringify(enrichedEvents, null, 2)
        );

        setEvents(enrichedEvents);
      } else {
        console.log('ERRO AO BUSCAR EVENTOS PUBLICOS:', eventsResult.reason);
        setEvents([]);
      }

      if (eventsResult.status === 'rejected' || proposalsResult.status === 'rejected') {
        setError('Alguns dados nao puderam ser carregados. Puxe para atualizar.');
      }
    } catch (requestError) {
      console.log('ERRO AO CARREGAR EVENTOS PUBLICOS:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar os eventos.');
      setEvents([]);
      setAcceptedProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const proposalsByEventId = useMemo(() => {
    return acceptedProposals.reduce((acc, proposal) => {
      const eventId = getProposalEventId(proposal);

      if (!eventId) return acc;

      acc[eventId] = acc[eventId] || [];
      acc[eventId].push(proposal);

      return acc;
    }, {});
  }, [acceptedProposals]);

  const eventTypes = useMemo(() => {
    const values = events.map(getEventType).filter(Boolean);
    return ['TODOS', ...Array.from(new Set(values))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();

    return events
      .filter((eventItem) => {
        const eventDate = parseApiDate(eventItem.data_inicio);
        const formattedDate = eventDate ? eventDate.toISOString().slice(0, 10) : '';
        const eventType = getEventType(eventItem);

        const title = String(eventItem.titulo || '').toLowerCase();
        const description = String(eventItem.descricao || '').toLowerCase();
        const local = String(eventItem.local || '').toLowerCase();
        const casaNome = String(eventItem.casa_nome || '').toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch) ||
          local.includes(normalizedSearch) ||
          casaNome.includes(normalizedSearch);

        const matchesDate = !dateFilter.trim() || formattedDate === dateFilter.trim();
        const matchesLocation = !normalizedLocation || local.includes(normalizedLocation);
        const matchesType = typeFilter === 'TODOS' || eventType === typeFilter;

        return matchesSearch && matchesDate && matchesLocation && matchesType;
      })
      .sort((a, b) => {
        const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
        const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;
        return dateA - dateB;
      });
  }, [dateFilter, events, locationFilter, search, typeFilter]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
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
            onPress={() => router.push('/dashboards/cliente')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Eventos</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={loadEvents}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={28}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Eventos disponiveis</Text>
            <Text style={styles.heroSubtitle}>
              Veja eventos, casas de show e artistas confirmados.
            </Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadEvents}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.filterCard}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nome, descricao, casa ou local"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={dateFilter}
              onChangeText={setDateFilter}
            />

            <TextInput
              style={styles.filterInput}
              placeholder="Local"
              placeholderTextColor={colors.textMuted}
              value={locationFilter}
              onChangeText={setLocationFilter}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFilters}
          >
            {eventTypes.map((type) => {
              const isSelected = typeFilter === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                  activeOpacity={0.85}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.eventsList}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((eventItem) => {
              const eventId = getEventId(eventItem);
              const isSelected = selectedEventId === eventId;

              const confirmedArtistsFromEvent = Array.isArray(eventItem.eventoArtistas)
                ? eventItem.eventoArtistas.filter(isConfirmedArtist)
                : [];

              const confirmedArtistsFromProposals = proposalsByEventId[eventId] || [];

              const confirmedArtists =
                confirmedArtistsFromProposals.length > 0
                  ? confirmedArtistsFromProposals
                  : confirmedArtistsFromEvent;

              return (
                <TouchableOpacity
                  key={eventId}
                  style={styles.eventCard}
                  activeOpacity={0.9}
                  onPress={() => setSelectedEventId(isSelected ? '' : eventId)}
                >
                  <Image
                    source={{ uri: eventItem.foto_evento || FALLBACK_EVENT_IMAGE }}
                    style={styles.eventImage}
                  />

                  <View style={styles.eventBody}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {eventItem.titulo}
                      </Text>

                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{getEventType(eventItem)}</Text>
                      </View>
                    </View>

                    <View style={styles.casaPreviewRow}>
                      <Ionicons name="business-outline" size={14} color={colors.primary} />
                      <Text style={styles.casaPreviewText} numberOfLines={1}>
                        {eventItem.casa_nome || 'Casa de show'}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{formatDateTime(eventItem.data_inicio)}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{eventItem.local}</Text>
                    </View>

                    {eventItem.descricao ? (
                      <Text style={styles.eventDescription} numberOfLines={isSelected ? 5 : 2}>
                        {eventItem.descricao}
                      </Text>
                    ) : null}

                    {isSelected ? (
                      <View style={styles.artistBox}>
                        <View style={styles.artistBoxHeader}>
                          <Ionicons
                            name="people-circle-outline"
                            size={17}
                            color={colors.primary}
                          />
                          <Text style={styles.artistBoxTitle}>Artistas confirmados</Text>
                        </View>

                        {confirmedArtists.length > 0 ? (
                          confirmedArtists.map((artistItem, index) => {
                            const artistName =
                              artistItem?.artista_nome ||
                              getArtistNameFromProposal(artistItem) ||
                              getArtistNameFromObject(artistItem?.artista || artistItem);

                            return (
                              <View key={`${eventId}-artist-${index}`} style={styles.artistRow}>
                                <Ionicons
                                  name="musical-notes-outline"
                                  size={14}
                                  color={colors.primary}
                                />
                                <Text style={styles.artistName}>{artistName}</Text>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.emptyText}>
                            Nenhum artista confirmado retornado pela API.
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-search" size={46} color={colors.textMuted} />
              <Text style={styles.emptyStateTitle}>Nenhum evento encontrado</Text>
              <Text style={styles.emptyStateText}>
                Ajuste os filtros ou puxe para atualizar a lista.
              </Text>
            </View>
          )}
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  filterCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
  },
  typeFilters: {
    paddingVertical: 2,
  },
  typeChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginRight: spacing.sm,
    backgroundColor: '#101728',
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
  },
  typeChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  typeChipTextSelected: {
    color: colors.primary,
  },
  eventsList: {
    gap: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.small,
  },
  eventImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#101728',
  },
  eventBody: {
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  casaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(0, 102, 255, 0.08)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.16)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  casaPreviewText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  artistBox: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  artistBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  artistBoxTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 6,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  artistName: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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