import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, proposalService, usersService } from '../../services/api';
import {
  formatCurrency,
  formatDateTime,
  getEventId,
  normalizeEvent,
} from '../../utils/casaShowData';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

function getArtistId(artist) {
  return artist?.id_usuario || artist?.id || artist?.uuid;
}

function getArtistName(artist) {
  return artist?.nome_artista || artist?.nome || artist?.email || 'Artista';
}

export default function CasaShowPropostasScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const initialEventId = params?.id_evento ? String(params.id_evento) : '';
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [valorOfertado, setValorOfertado] = useState('');
  const [termos, setTermos] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!session?.id_usuario) return;

    try {
      setError('');
      const [eventsResponse, artistsResponse] = await Promise.all([
        eventService.listByCasaShow(session.id_usuario),
        usersService.listArtists(),
      ]);

      setEvents(Array.isArray(eventsResponse) ? eventsResponse.map(normalizeEvent) : []);
      setArtists(Array.isArray(artistsResponse) ? artistsResponse : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar dados para proposta.');
    } finally {
      setLoading(false);
    }
  }, [session?.id_usuario]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvent = useMemo(
    () => events.find((eventItem) => getEventId(eventItem) === selectedEventId),
    [events, selectedEventId]
  );

  const selectedArtist = useMemo(
    () => artists.find((artist) => getArtistId(artist) === selectedArtistId),
    [artists, selectedArtistId]
  );

  async function handleCreateProposal() {
    setFormError('');

    if (!selectedEvent) {
      setFormError('Selecione o evento da proposta.');
      return;
    }

    if (!selectedArtist) {
      setFormError('Selecione o artista que recebera a proposta.');
      return;
    }

    const numericValue = Number(valorOfertado.replace(/\./g, '').replace(',', '.'));

    if (!numericValue || Number.isNaN(numericValue) || numericValue <= 0) {
      setFormError('Informe um valor ofertado valido.');
      return;
    }

    if (!termos.trim()) {
      setFormError('Informe os termos da proposta.');
      return;
    }

    try {
      setSubmitting(true);
      await proposalService.create({
        id_artista: getArtistId(selectedArtist),
        id_casa_show: session.id_usuario,
        id_evento: getEventId(selectedEvent),
        data_proposta: new Date().toISOString(),
        data_evento: selectedEvent.data_inicio,
        valor_ofertado: numericValue,
        termos: termos.trim(),
      });

      Alert.alert('Sucesso', 'Proposta enviada com sucesso.');
      router.push('/dashboards/casashow');
    } catch (requestError) {
      setFormError(requestError.message || 'Nao foi possivel enviar a proposta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Nova Proposta</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile-casa-show')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadData}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={30}
            color={colors.primary}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Criar proposta</Text>
            <Text style={styles.heroSubtitle}>
              Selecione um evento, escolha um artista e envie os termos.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Evento</Text>

          {events.length > 0 ? (
            events.map((eventItem) => {
              const eventId = getEventId(eventItem);
              const isSelected = selectedEventId === eventId;

              return (
                <TouchableOpacity
                  key={eventId}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedEventId(eventId)}
                >
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{eventItem.titulo}</Text>
                    <Text style={styles.optionSubtitle}>
                      {formatDateTime(eventItem.data_inicio)}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum evento cadastrado para esta casa.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Artista</Text>

          {artists.length > 0 ? (
            artists.map((artist) => {
              const artistId = getArtistId(artist);
              const isSelected = selectedArtistId === artistId;

              return (
                <TouchableOpacity
                  key={artistId}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedArtistId(artistId)}
                >
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{getArtistName(artist)}</Text>
                    <Text style={styles.optionSubtitle}>
                      {artist.genero_musical || 'Genero nao informado'}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum artista retornado pela API.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalhes da proposta</Text>

          <Text style={styles.fieldLabel}>Valor ofertado</Text>
          <TextInput
            style={styles.input}
            placeholder="1500,00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={valorOfertado}
            onChangeText={(value) => {
              setValorOfertado(value);
              setFormError('');
            }}
          />

          {valorOfertado ? (
            <Text style={styles.helperText}>
              {formatCurrency(Number(valorOfertado.replace(/\./g, '').replace(',', '.')))}
            </Text>
          ) : null}

          <Text style={styles.fieldLabel}>Termos</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cache, horario de chegada, duracao do show, estrutura..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={termos}
            onChangeText={(value) => {
              setTermos(value);
              setFormError('');
            }}
          />

          {selectedEvent ? (
            <Text style={styles.helperText}>
              Data do evento: {formatDateTime(selectedEvent.data_inicio)}
            </Text>
          ) : null}

          {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

          <Button
            title="Enviar Proposta"
            onPress={handleCreateProposal}
            loading={submitting}
            style={styles.submitButton}
          />
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
    justifyContent: 'center',
    alignItems: 'center',
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
  heroInfo: {
    flex: 1,
    marginLeft: spacing.md,
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
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  optionCard: {
    minHeight: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
  },
  optionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  formErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
