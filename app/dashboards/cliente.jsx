import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, usersService } from '../../services/api';
import {
  formatDateOnly,
  formatDateTime,
  getEventId,
  normalizeEvent,
  parseApiDate,
} from '../../utils/casaShowData';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80';

function getAvatarLetter(nome) {
  if (!nome || typeof nome !== 'string') return 'C';
  return nome.trim().charAt(0).toUpperCase() || 'C';
}

function formatMonthBadge(value) {
  const date = parseApiDate(value);

  if (!date) {
    return {
      month: '--',
      day: '--',
    };
  }

  return {
    month: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function normalizeGenreValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getGenreLabel(value) {
  const normalized = normalizeGenreValue(value);

  const map = {
    forro: 'Forró',
    trap: 'Trap',
    funk: 'Funk',
    sertanejo: 'Sertanejo',
    pagode: 'Pagode',
    samba: 'Samba',
    rock: 'Rock',
    pop: 'Pop',
    eletronica: 'Eletrônica',
    eletronico: 'Eletrônico',
    mpb: 'MPB',
    rap: 'Rap',
    reggae: 'Reggae',
    piseiro: 'Piseiro',
    axe: 'Axé',
    outros: 'Outros',
  };

  return map[normalized] || value || 'Sem gênero';
}

function parseClientPreferences(preferences) {
  if (!preferences) return [];

  if (Array.isArray(preferences)) {
    return preferences
      .map((item) => normalizeGenreValue(item))
      .filter(Boolean);
  }

  if (typeof preferences !== 'string') return [];

  return preferences
    .split(/[;,/|]/)
    .map((item) => normalizeGenreValue(item))
    .filter(Boolean);
}

function eventMatchesClientGenres(eventItem, clientGenres) {
  if (!clientGenres.length) return false;

  const eventGenre = normalizeGenreValue(eventItem?.genero);

  if (!eventGenre) return false;

  return clientGenres.some((clientGenre) => {
    if (!clientGenre) return false;

    return (
      eventGenre === clientGenre ||
      eventGenre.includes(clientGenre) ||
      clientGenre.includes(eventGenre)
    );
  });
}

function getPreferenceText(clientGenres) {
  if (!clientGenres.length) return '';

  return clientGenres.map(getGenreLabel).join(', ');
}

function normalizeClient(cliente = {}, session = {}) {
  return {
    ...cliente,
    id: cliente.id || cliente.id_usuario || session.id_usuario || session.id || '',
    nome: cliente.nome || cliente.usuario?.nome || session.nome || 'Cliente',
    email: cliente.email || cliente.usuario?.email || session.email || '',
    telefone: cliente.telefone || cliente.usuario?.telefone || '',
    apelido: cliente.apelido || '',
    preferencias: cliente.preferencias || session.preferencias || '',
    data_nascimento: cliente.data_nascimento || '',
  };
}

export default function ClientDashboardScreen() {
  const { session } = useAuth();
  const [client, setClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const clientId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadDashboard = useCallback(async () => {
    if (!clientId) {
      setClient(normalizeClient({}, session || {}));
      setEvents([]);
      setError('Sessão inválida.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');

      console.log('CLIENTE ID USADO NA DASHBOARD:', clientId);
      console.log('SESSION DO CLIENTE:', JSON.stringify(session, null, 2));

      const [clientResult, eventsResult] = await Promise.allSettled([
        usersService.getCliente(clientId),
        eventService.list({ page: 1, pageSize: 50 }),
      ]);

      if (clientResult.status === 'fulfilled') {
        console.log('CLIENTE DA API:', JSON.stringify(clientResult.value, null, 2));

        setClient(normalizeClient(clientResult.value, session));
      } else {
        console.log('ERRO AO BUSCAR CLIENTE:', clientResult.reason);

        setClient(normalizeClient({}, session));
      }

      if (eventsResult.status === 'fulfilled') {
        console.log('EVENTOS DO CLIENTE - API:', JSON.stringify(eventsResult.value, null, 2));

        const normalizedEvents = Array.isArray(eventsResult.value)
          ? eventsResult.value.map(normalizeEvent)
          : [];

        console.log(
          'EVENTOS DO CLIENTE - NORMALIZADOS:',
          JSON.stringify(normalizedEvents, null, 2)
        );

        setEvents(normalizedEvents);
      } else {
        console.log('ERRO AO BUSCAR EVENTOS DO CLIENTE:', eventsResult.reason);

        setEvents([]);
      }

      if (clientResult.status === 'rejected' || eventsResult.status === 'rejected') {
        setError('Alguns dados nao puderam ser carregados. Puxe para atualizar.');
      }
    } catch (requestError) {
      console.log('ERRO AO CARREGAR DASHBOARD DO CLIENTE:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar eventos.');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId, session]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const clientData = client || normalizeClient({}, session || {});

  const clientGenres = useMemo(() => {
    const rawPreferences =
      clientData?.preferencias ||
      session?.preferencias ||
      '';

    const parsed = parseClientPreferences(rawPreferences);

    console.log('PREFERENCIAS DO CLIENTE - RAW:', rawPreferences);
    console.log('PREFERENCIAS DO CLIENTE - NORMALIZADAS:', parsed);

    return parsed;
  }, [clientData?.preferencias, session?.preferencias]);

  const dashboard = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
      const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;

      return dateA - dateB;
    });

    const now = Date.now();

    const upcomingEvents = sortedEvents.filter((eventItem) => {
      const date = parseApiDate(eventItem.data_inicio);

      return date ? date.getTime() >= now : true;
    });

    const preferenceMatches = upcomingEvents.filter((eventItem) =>
      eventMatchesClientGenres(eventItem, clientGenres)
    );

    const nonMatchingUpcoming = upcomingEvents.filter(
      (eventItem) => !eventMatchesClientGenres(eventItem, clientGenres)
    );

    const prioritizedEvents =
      clientGenres.length > 0
        ? [...preferenceMatches, ...nonMatchingUpcoming]
        : upcomingEvents;

    const recommendationEvents =
      clientGenres.length > 0 ? preferenceMatches : [];

    console.log(
      'EVENTOS QUE BATEM COM AS PREFERENCIAS:',
      JSON.stringify(preferenceMatches, null, 2)
    );

    return {
      preferred: recommendationEvents.slice(0, 10),
      highlighted: prioritizedEvents.slice(0, 3),
      mainEvent: prioritizedEvents[0] || sortedEvents[0] || null,
      recent: prioritizedEvents.slice(0, 4),
      hasPreferences: clientGenres.length > 0,
      hasMatches: preferenceMatches.length > 0,
      preferenceText: getPreferenceText(clientGenres),
    };
  }, [events, clientGenres]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
  }

  const nome = clientData?.nome || session?.nome || 'Cliente';

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

  const recommendationList = dashboard.preferred;

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
          <View style={styles.iconPlaceholder} />

          <Text style={styles.topBarTitle}>Dashboard do Cliente</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarLetter(nome)}</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Ola, {nome}!</Text>

            <Text style={styles.heroSubtitle}>
              Eventos recomendados com base nos seus gêneros favoritos.
            </Text>

            <Text style={styles.heroLocation}>{clientData?.email || session?.email}</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadDashboard}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/events')}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Eventos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Recomendações por gênero</Text>
          </View>

          {!dashboard.hasPreferences ? (
            <View style={styles.noPreferencesBox}>
              <Ionicons name="musical-notes-outline" size={24} color={colors.primary} />

              <Text style={styles.noPreferencesTitle}>
                Você ainda não tem preferências musicais.
              </Text>

              <Text style={styles.noPreferencesText}>
                Caso queira receber recomendações personalizadas, adicione seus gêneros favoritos na edição de perfil.
              </Text>

              <TouchableOpacity
                style={styles.profileEditShortcut}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
                <Text style={styles.profileEditShortcutText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.helperText}>
                Baseado em: {dashboard.preferenceText}
              </Text>

              {!dashboard.hasMatches ? (
                <Text style={styles.warningText}>
                  Ainda não encontramos eventos com os gêneros marcados no seu perfil.
                </Text>
              ) : null}

              {recommendationList.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.preferenceRow}
                >
                  {recommendationList.map((eventItem) => {
                    const badge = formatMonthBadge(eventItem.data_inicio);
                    const isRecommended = eventMatchesClientGenres(eventItem, clientGenres);

                    return (
                      <TouchableOpacity
                        key={getEventId(eventItem)}
                        style={styles.preferenceItem}
                        activeOpacity={0.85}
                        onPress={() => router.push('/(tabs)/events')}
                      >
                        <View style={styles.preferenceImageBox}>
                          <Image
                            source={{ uri: eventItem.foto_evento || FALLBACK_EVENT_IMAGE }}
                            style={styles.preferenceImage}
                          />

                          {isRecommended ? (
                            <View style={styles.recommendedBadge}>
                              <Ionicons name="star" size={11} color="#FFF" />
                              <Text style={styles.recommendedBadgeText}>Match</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.preferenceTitle} numberOfLines={1}>
                          {eventItem.titulo}
                        </Text>

                        <View style={styles.smallMetaRow}>
                          <Ionicons name="musical-notes-outline" size={12} color={colors.primary} />
                          <Text style={styles.preferenceGenre} numberOfLines={1}>
                            {getGenreLabel(eventItem.genero)}
                          </Text>
                        </View>

                        <View style={styles.smallMetaRow}>
                          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                          <Text style={styles.preferenceDate}>
                            {badge.day} {badge.month}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>
                  Nenhum evento recomendado no momento.
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Eventos em destaque</Text>
          </View>

          {dashboard.highlighted.length > 0 ? (
            <View style={styles.highlightRow}>
              {dashboard.highlighted.map((eventItem) => {
                const badge = formatMonthBadge(eventItem.data_inicio);
                const isRecommended = eventMatchesClientGenres(eventItem, clientGenres);

                return (
                  <TouchableOpacity
                    key={getEventId(eventItem)}
                    style={styles.highlightItem}
                    activeOpacity={0.85}
                    onPress={() => router.push('/(tabs)/events')}
                  >
                    <View style={styles.highlightImageBox}>
                      <Image
                        source={{ uri: eventItem.foto_evento || FALLBACK_EVENT_IMAGE }}
                        style={styles.highlightImage}
                      />

                      {isRecommended ? (
                        <View style={styles.highlightMatchDot} />
                      ) : null}
                    </View>

                    <Text style={styles.highlightTitle} numberOfLines={1}>
                      {eventItem.titulo}
                    </Text>

                    <Text style={styles.highlightGenre} numberOfLines={1}>
                      {getGenreLabel(eventItem.genero)}
                    </Text>

                    <Text style={styles.highlightDate}>
                      {badge.day} {badge.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento retornado pela API.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Proximo evento recomendado</Text>
          </View>

          {dashboard.mainEvent ? (
            <TouchableOpacity
              style={styles.mainEventCard}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/events')}
            >
              <Image
                source={{ uri: dashboard.mainEvent.foto_evento || FALLBACK_EVENT_IMAGE }}
                style={styles.mainEventImage}
              />

              <View style={styles.mainEventHeader}>
                <Text style={styles.mainEventTitle}>{dashboard.mainEvent.titulo}</Text>

                <Ionicons name="chevron-forward" size={26} color={colors.text} />
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="musical-notes-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.mainEventInfo}>
                  {getGenreLabel(dashboard.mainEvent.genero)}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.mainEventInfo}>{dashboard.mainEvent.local}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.mainEventInfo}>
                  {formatDateTime(dashboard.mainEvent.data_inicio)}
                </Text>
              </View>

              <View style={styles.detailsButton}>
                <Text style={styles.detailsText}>Ver detalhes</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento disponivel.</Text>
          )}
        </View>

        <View style={styles.activityWrapper}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pulse-outline" size={18} color={colors.primary} />
            <Text style={styles.activitySectionTitle}>Atividade recente</Text>
          </View>

          {dashboard.recent.length > 0 ? (
            dashboard.recent.map((eventItem) => {
              const badge = formatMonthBadge(eventItem.data_inicio);
              const isRecommended = eventMatchesClientGenres(eventItem, clientGenres);

              return (
                <TouchableOpacity
                  key={getEventId(eventItem)}
                  style={styles.activityCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/events')}
                >
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{badge.month}</Text>
                    <Text style={styles.dateDay}>{badge.day}</Text>
                  </View>

                  <View style={styles.activityTextArea}>
                    <View style={styles.activityTitleRow}>
                      <Text style={styles.activityTitle}>{eventItem.titulo}</Text>

                      {isRecommended ? (
                        <Ionicons name="star" size={13} color={colors.primary} />
                      ) : null}
                    </View>

                    <Text style={styles.activityMeta}>
                      {getGenreLabel(eventItem.genero)} • {eventItem.local}
                    </Text>
                  </View>

                  <Text style={styles.activityTime}>
                    {formatDateOnly(eventItem.data_inicio)}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topBarTitle: {
    color: colors.text,
    fontWeight: '700',
    ...typography.body,
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
    ...shadows.small,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
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
    marginBottom: 4,
    fontWeight: '600',
  },
  heroLocation: {
    ...typography.caption,
    color: colors.textMuted,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  actionText: {
    color: colors.text,
    fontWeight: '600',
    ...typography.bodySmall,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
    ...typography.body,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.bodySmall,
    color: '#F59E0B',
    marginBottom: spacing.md,
  },
  noPreferencesBox: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noPreferencesTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  noPreferencesText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileEditShortcut: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEditShortcutText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 6,
  },
  preferenceRow: {
    paddingRight: spacing.sm,
  },
  preferenceItem: {
    width: 132,
    marginRight: spacing.md,
  },
  preferenceImageBox: {
    width: 132,
    height: 132,
    borderRadius: 18,
    marginBottom: 8,
  },
  preferenceImage: {
    width: 132,
    height: 132,
    borderRadius: 18,
    backgroundColor: '#101728',
  },
  recommendedBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendedBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  preferenceTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  smallMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  preferenceGenre: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },
  preferenceDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  highlightItem: {
    alignItems: 'center',
    width: '30%',
  },
  highlightImageBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  highlightImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#101728',
  },
  highlightMatchDot: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.backgroundCard,
  },
  highlightTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  highlightGenre: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  highlightDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  mainEventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mainEventImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundCard,
  },
  mainEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  mainEventTitle: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mainEventInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  detailsButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  detailsText: {
    color: '#FFF',
    fontWeight: '600',
    ...typography.bodySmall,
  },
  activityWrapper: {
    marginTop: spacing.xs,
  },
  activitySectionTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 18,
    marginLeft: 8,
  },
  activityCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    fontSize: 10,
    color: '#B9C1D9',
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  activityTextArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 6,
    flexShrink: 1,
  },
  activityMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    maxWidth: 90,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});