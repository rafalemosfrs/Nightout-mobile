import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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
import { useAuth } from '../../contexts/AuthContext';
import {
  formatDateTime,
  getEventId,
  normalizeEvent,
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

const WHATSAPP_NUMBER = '558897140476';
const WHATSAPP_MESSAGE = 'Quero saber mais informações do evento';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeGenreValue(value) {
  const normalized = normalizeText(value);

  const genreMap = {
    forro: 'forro',
    forró: 'forro',
    trap: 'trap',
    funk: 'funk',
    sertanejo: 'sertanejo',
    pagode: 'pagode',
    samba: 'samba',
    rock: 'rock',
    pop: 'pop',
    eletronica: 'eletronica',
    eletronico: 'eletronica',
    eletrônico: 'eletronica',
    eletrônica: 'eletronica',
    mpb: 'mpb',
    rap: 'rap',
    reggae: 'reggae',
    piseiro: 'piseiro',
    axe: 'axe',
    axé: 'axe',
    outros: 'outros',
    outro: 'outros',
  };

  return genreMap[normalized] || normalized;
}

function parseClientPreferences(preferences) {
  if (!preferences) return [];

  if (Array.isArray(preferences)) {
    return preferences.map(normalizeGenreValue).filter(Boolean);
  }

  if (typeof preferences !== 'string') return [];

  return preferences
    .split(/[;,/|]/)
    .map(normalizeGenreValue)
    .filter(Boolean);
}

function getEventType(eventItem) {
  return (
    eventItem.tipo ||
    eventItem.categoria ||
    eventItem.genero ||
    eventItem.genero_musical ||
    eventItem.status ||
    'Evento'
  );
}

function getEventGenres(eventItem) {
  return [
    eventItem?.genero,
    eventItem?.genero_musical,
    eventItem?.tipo,
    eventItem?.categoria,
  ]
    .map(normalizeGenreValue)
    .filter(Boolean);
}

function eventMatchesClientGenres(eventItem, clientGenres) {
  if (!clientGenres.length) return false;

  const eventGenres = getEventGenres(eventItem);

  return clientGenres.some((genre) => eventGenres.includes(genre));
}

function normalizeStatus(status) {
  return String(status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isAcceptedStatus(status) {
  const normalized = normalizeStatus(status);

  return [
    'ACEITA',
    'ACEITO',
    'CONFIRMADO',
    'CONFIRMADA',
    'APROVADO',
    'APROVADA',
  ].includes(normalized);
}

function getProposalEventId(proposal) {
  return (
    proposal?.id_evento ||
    proposal?.idEvento ||
    proposal?.evento?.id_evento ||
    proposal?.evento?.id ||
    proposal?.Evento?.id_evento ||
    proposal?.Evento?.id ||
    ''
  );
}

function getProposalArtistId(proposal) {
  return (
    proposal?.id_artista ||
    proposal?.idArtista ||
    proposal?.artista?.id_usuario ||
    proposal?.artista?.id ||
    proposal?.Artista?.id_usuario ||
    proposal?.Artista?.id ||
    ''
  );
}

function getProposalCasaId(proposal) {
  return (
    proposal?.id_casa_show ||
    proposal?.idCasaShow ||
    proposal?.casaDeShow?.id_usuario ||
    proposal?.casaDeShow?.id ||
    proposal?.CasaDeShow?.id_usuario ||
    proposal?.CasaDeShow?.id ||
    proposal?.casa?.id_usuario ||
    proposal?.casa?.id ||
    proposal?.evento?.id_casa_show ||
    proposal?.evento?.id_usuario ||
    proposal?.Evento?.id_casa_show ||
    proposal?.Evento?.id_usuario ||
    ''
  );
}

function getCasaIdFromEvent(eventItem) {
  return (
    eventItem?.id_casa_show ||
    eventItem?.idCasaShow ||
    eventItem?.id_usuario ||
    eventItem?.casaDeShow?.id_usuario ||
    eventItem?.casaDeShow?.id ||
    eventItem?.CasaDeShow?.id_usuario ||
    eventItem?.CasaDeShow?.id ||
    eventItem?.casa?.id_usuario ||
    eventItem?.casa?.id ||
    ''
  );
}

function getArtistNameFromObject(artistItem) {
  const artista = artistItem?.artista || artistItem?.Artista || artistItem || {};

  return (
    artista?.nome_artista ||
    artista?.nome ||
    artista?.usuario?.nome ||
    artista?.email ||
    artista?.usuario?.email ||
    'Artista confirmado'
  );
}

function getCasaNameFromObject(casaItem) {
  const casa =
    casaItem?.casaDeShow ||
    casaItem?.CasaDeShow ||
    casaItem?.casa ||
    casaItem ||
    {};
  const usuario = casa?.usuario || {};

  return (
    casa?.nome_fantasia ||
    casa?.nome ||
    usuario?.nome ||
    casa?.email ||
    usuario?.email ||
    ''
  );
}

function getCasaNameFromEvent(eventItem) {
  return (
    eventItem?.casa_nome ||
    eventItem?.nome_casa ||
    eventItem?.casa_show_nome ||
    eventItem?.casaDeShow?.nome_fantasia ||
    eventItem?.casaDeShow?.nome ||
    eventItem?.casaDeShow?.usuario?.nome ||
    eventItem?.CasaDeShow?.nome_fantasia ||
    eventItem?.CasaDeShow?.nome ||
    eventItem?.CasaDeShow?.usuario?.nome ||
    eventItem?.casa?.nome_fantasia ||
    eventItem?.casa?.nome ||
    eventItem?.casa?.usuario?.nome ||
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
    proposal?.CasaDeShow?.nome_fantasia ||
    proposal?.CasaDeShow?.nome ||
    proposal?.CasaDeShow?.usuario?.nome ||
    proposal?.casa?.nome_fantasia ||
    proposal?.casa?.nome ||
    proposal?.casa?.usuario?.nome ||
    ''
  );
}

function getArtistName(eventArtist) {
  return getArtistNameFromObject(eventArtist);
}

function isConfirmedArtist(eventArtist) {
  const status = String(eventArtist?.status || 'CONFIRMADO').toUpperCase();

  return [
    'ACEITA',
    'ACEITO',
    'CONFIRMADO',
    'CONFIRMADA',
    'APROVADO',
    'APROVADA',
  ].includes(status);
}

async function enrichAcceptedProposal(proposal) {
  const artistId = getProposalArtistId(proposal);
  const casaId = getProposalCasaId(proposal);

  const [artistResult, casaResult] = await Promise.allSettled([
    artistId ? usersService.getArtist(artistId) : Promise.resolve(null),
    casaId ? usersService.getCasaShow(casaId) : Promise.resolve(null),
  ]);

  const artist =
    artistResult.status === 'fulfilled' && artistResult.value
      ? artistResult.value
      : null;

  const casa =
    casaResult.status === 'fulfilled' && casaResult.value
      ? casaResult.value
      : null;

  return {
    ...proposal,
    id_evento: getProposalEventId(proposal),
    id_artista: artistId,
    id_casa_show: casaId,
    artista: artist || proposal?.artista || proposal?.Artista || null,
    casaDeShow:
      casa || proposal?.casaDeShow || proposal?.CasaDeShow || proposal?.casa || null,
    artista_nome:
      getArtistNameFromObject(artist) ||
      getArtistNameFromObject(proposal?.artista || proposal?.Artista) ||
      'Artista confirmado',
    casa_nome:
      getCasaNameFromObject(casa) ||
      getCasaNameFromProposal(proposal) ||
      'Casa de show',
  };
}

async function enrichEventWithCasa(eventItem, acceptedProposalsForEvent = []) {
  const eventCasaName = getCasaNameFromEvent(eventItem);

  if (eventCasaName) {
    return {
      ...eventItem,
      casa_nome: eventCasaName,
    };
  }

  const proposalCasaName = acceptedProposalsForEvent.find(
    (proposal) => proposal.casa_nome
  )?.casa_nome;

  if (proposalCasaName) {
    return {
      ...eventItem,
      casa_nome: proposalCasaName,
    };
  }

  const casaId =
    getCasaIdFromEvent(eventItem) ||
    acceptedProposalsForEvent.find((proposal) => proposal.id_casa_show)
      ?.id_casa_show ||
    '';

  if (!casaId) {
    return {
      ...eventItem,
      casa_nome: '',
    };
  }

  try {
    const casa = await usersService.getCasaShow(casaId);

    return {
      ...eventItem,
      casa_nome: getCasaNameFromObject(casa),
    };
  } catch (requestError) {
    console.log('ERRO AO BUSCAR CASA DO EVENTO PUBLICO:', requestError);

    return {
      ...eventItem,
      casa_nome: '',
    };
  }
}

export default function PublicEventsScreen() {
  const { session } = useAuth();

  const [events, setEvents] = useState([]);
  const [acceptedProposals, setAcceptedProposals] = useState([]);
  const [clientPreferences, setClientPreferences] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const clientId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadEvents = useCallback(async () => {
    try {
      setError('');

      console.log('CLIENTE ID USADO EM EVENTOS PUBLICOS:', clientId);

      const [eventsResult, proposalsResult, clientResult] =
        await Promise.allSettled([
          eventService.list({ page: 1, pageSize: 50 }),
          proposalService.list(),
          clientId ? usersService.getCliente(clientId) : Promise.resolve(null),
        ]);

      const eventList =
        eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value)
          ? eventsResult.value.map(normalizeEvent)
          : [];

      const proposalList =
        proposalsResult.status === 'fulfilled' && Array.isArray(proposalsResult.value)
          ? proposalsResult.value
          : [];

      if (eventsResult.status === 'rejected') {
        console.log('ERRO AO BUSCAR EVENTOS PUBLICOS:', eventsResult.reason);
        setError('Nao foi possivel carregar os eventos.');
      }

      if (proposalsResult.status === 'rejected') {
        console.log('ERRO AO BUSCAR PROPOSTAS PUBLICAS:', proposalsResult.reason);
      }

      const enrichedAcceptedProposals = await Promise.all(
        proposalList
          .filter((proposal) => isAcceptedStatus(proposal?.status))
          .map((proposal) => enrichAcceptedProposal(proposal))
      );

      const proposalsByEventId = enrichedAcceptedProposals.reduce((acc, proposal) => {
        const eventId = getProposalEventId(proposal);

        if (!eventId) return acc;

        acc[eventId] = acc[eventId] || [];
        acc[eventId].push(proposal);

        return acc;
      }, {});

      const enrichedEvents = await Promise.all(
        eventList.map((eventItem) => {
          const eventId = getEventId(eventItem);
          const eventProposals = proposalsByEventId[eventId] || [];

          return enrichEventWithCasa(eventItem, eventProposals);
        })
      );

      console.log(
        'EVENTOS PUBLICOS - ENRIQUECIDOS:',
        JSON.stringify(enrichedEvents, null, 2)
      );

      console.log(
        'PROPOSTAS ACEITAS PUBLICAS - ENRIQUECIDAS:',
        JSON.stringify(enrichedAcceptedProposals, null, 2)
      );

      setEvents(enrichedEvents);
      setAcceptedProposals(enrichedAcceptedProposals);

      if (clientResult.status === 'fulfilled') {
        const cliente = clientResult.value || {};
        const rawPreferences = cliente?.preferencias || session?.preferencias || '';
        const parsedPreferences = parseClientPreferences(rawPreferences);

        console.log('PREFERENCIAS DO CLIENTE - EVENTOS PUBLICOS:', rawPreferences);
        console.log(
          'PREFERENCIAS NORMALIZADAS - EVENTOS PUBLICOS:',
          parsedPreferences
        );

        setClientPreferences(parsedPreferences);
      } else {
        console.log('ERRO AO BUSCAR CLIENTE EM EVENTOS PUBLICOS:', clientResult.reason);
        setClientPreferences(parseClientPreferences(session?.preferencias || ''));
      }
    } catch (requestError) {
      console.log('ERRO GERAL EM EVENTOS PUBLICOS:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar os eventos.');
      setEvents([]);
      setAcceptedProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId, session?.preferencias]);

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

  const preferenceEvents = useMemo(() => {
    if (!clientPreferences.length) return [];

    return events
      .filter((eventItem) => eventMatchesClientGenres(eventItem, clientPreferences))
      .sort((a, b) => {
        const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
        const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;

        return dateA - dateB;
      });
  }, [clientPreferences, events]);

  useEffect(() => {
    if (activeBanner >= preferenceEvents.length) {
      setActiveBanner(0);
    }
  }, [activeBanner, preferenceEvents.length]);

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

        const matchesSearch =
          !normalizedSearch ||
          eventItem.titulo.toLowerCase().includes(normalizedSearch) ||
          eventItem.descricao.toLowerCase().includes(normalizedSearch) ||
          eventItem.local.toLowerCase().includes(normalizedSearch);

        const matchesDate = !dateFilter.trim() || formattedDate === dateFilter.trim();

        const matchesLocation =
          !normalizedLocation || eventItem.local.toLowerCase().includes(normalizedLocation);

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

  async function handleOpenWhatsApp() {
    const message = encodeURIComponent(WHATSAPP_MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    try {
      await Linking.openURL(url);
    } catch (requestError) {
      console.log('ERRO AO ABRIR WHATSAPP:', requestError);
    }
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
              Lista carregada diretamente do microservico de eventos.
            </Text>
          </View>
        </View>

        {preferenceEvents.length > 0 ? (
          <View style={styles.bannerContainer}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerHeaderIcon}>
                <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
              </View>

              <View style={styles.bannerHeaderTextBox}>
                <Text style={styles.bannerSectionTitle}>
                  De acordo com suas preferências
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const slideSize = event.nativeEvent.layoutMeasurement.width;
                const index = event.nativeEvent.contentOffset.x / slideSize;
                const roundIndex = Math.round(index);

                setActiveBanner(roundIndex);
              }}
              scrollEventThrottle={16}
            >
              {preferenceEvents.map((eventItem) => {
                const eventId = getEventId(eventItem);

                return (
                  <TouchableOpacity
                    key={`banner-${eventId}`}
                    activeOpacity={0.9}
                    style={styles.bannerCard}
                    onPress={() => setSelectedEventId(eventId)}
                  >
                    <Image
                      source={{
                        uri: eventItem.foto_evento || FALLBACK_EVENT_IMAGE,
                      }}
                      style={styles.bannerImage}
                    />

                    <View style={styles.bannerOverlay}>
                      <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>
                          {getEventType(eventItem)}
                        </Text>
                      </View>

                      <Text style={styles.bannerTitle} numberOfLines={2}>
                        {eventItem.titulo}
                      </Text>

                      {eventItem.casa_nome ? (
                        <Text style={styles.bannerHouse} numberOfLines={1}>
                          {eventItem.casa_nome}
                        </Text>
                      ) : null}

                      <Text style={styles.bannerDate}>
                        {formatDateTime(eventItem.data_inicio)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.pagination}>
              {preferenceEvents.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.paginationDot,
                    activeBanner === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}

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
              placeholder="Buscar por nome, descricao ou local"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterInput}
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  color: selectedDate ? colors.text : colors.textMuted,
                }}
              >
                {selectedDate
                  ? selectedDate.toISOString().split('T')[0]
                  : 'Selecionar data'}
              </Text>
            </TouchableOpacity>

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

              const confirmedArtistsFromProposals = proposalsByEventId[eventId] || [];

              const confirmedArtistsFromEvent = Array.isArray(eventItem.eventoArtistas)
                ? eventItem.eventoArtistas.filter(isConfirmedArtist)
                : [];

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

                    {eventItem.casa_nome ? (
                      <View style={styles.metaRow}>
                        <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{eventItem.casa_nome}</Text>
                      </View>
                    ) : null}

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
                      <>
                        <View style={styles.artistBox}>
                          <Text style={styles.artistBoxTitle}>Artistas confirmados</Text>

                          {confirmedArtists.length > 0 ? (
                            confirmedArtists.map((artistItem, index) => (
                              <View key={`${eventId}-artist-${index}`} style={styles.artistRow}>
                                <Ionicons
                                  name="musical-notes-outline"
                                  size={14}
                                  color={colors.primary}
                                />
                                <Text style={styles.artistName}>{getArtistName(artistItem)}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.emptyText}>
                              Nenhum artista confirmado retornado pela API.
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          style={styles.contactButton}
                          activeOpacity={0.85}
                          onPress={handleOpenWhatsApp}
                        >
                          <Ionicons name="logo-whatsapp" size={18} color={colors.text} />
                          <Text style={styles.contactButtonText}>Entrar em contato</Text>
                        </TouchableOpacity>
                      </>
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
    maxWidth: 150,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
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
  artistBoxTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.sm,
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
  contactButton: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  contactButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
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
  bannerContainer: {
    marginBottom: spacing.lg,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bannerHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bannerHeaderTextBox: {
    flex: 1,
  },
  bannerSectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  bannerCard: {
    width: 340,
    height: 200,
    marginRight: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundCard,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerHouse: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerDate: {
    color: '#ddd',
    fontSize: 13,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});