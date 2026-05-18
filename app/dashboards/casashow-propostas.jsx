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

  const initialEventId = params?.id_evento
    ? String(params.id_evento)
    : '';

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
    if (!session?.id) return;

    try {
      setError('');

      const [eventsResponse, artistsResponse] = await Promise.all([
        eventService.listByCasaShow(session.id),
        usersService.listArtists(),
      ]);

      setEvents(
        Array.isArray(eventsResponse)
          ? eventsResponse.map(normalizeEvent)
          : []
      );

      setArtists(
        Array.isArray(artistsResponse)
          ? artistsResponse
          : []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          'Nao foi possivel carregar os dados.'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvent = useMemo(
    () =>
      events.find(
        (eventItem) =>
          getEventId(eventItem) === selectedEventId
      ),
    [events, selectedEventId]
  );

  const selectedArtist = useMemo(
    () =>
      artists.find(
        (artist) =>
          getArtistId(artist) === selectedArtistId
      ),
    [artists, selectedArtistId]
  );

  async function handleCreateProposal() {
    setFormError('');

    if (!selectedEvent) {
      setFormError('Selecione um evento.');
      return;
    }

    if (!selectedArtist) {
      setFormError('Selecione um artista.');
      return;
    }

    const numericValue = Number(
      valorOfertado
        .replace(/\./g, '')
        .replace(',', '.')
    );

    if (
      !numericValue ||
      Number.isNaN(numericValue) ||
      numericValue <= 0
    ) {
      setFormError('Informe um valor válido.');
      return;
    }

    if (!termos.trim()) {
      setFormError('Informe os termos.');
      return;
    }

    try {
      setSubmitting(true);

      await proposalService.create({
        id_artista: getArtistId(selectedArtist),
        id_evento: getEventId(selectedEvent),
        data_proposta: new Date().toISOString(),
        id_casa_show: session.id,
        data_evento: selectedEvent.data_inicio,
        valor_ofertado: numericValue.toFixed(2),
        status: 'DISPONÍVEL',
        termos: termos.trim(),
      });

      Alert.alert(
        'Sucesso',
        'Proposta enviada com sucesso.'
      );

      router.push('/dashboards/casashow');
    } catch (requestError) {
      setFormError(
        requestError.message ||
          'Erro ao enviar proposta.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Carregando dados...
          </Text>
        </View>
      </SafeAreaView>
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
            activeOpacity={0.8}
            onPress={() =>
              router.push('/dashboards/casashow')
            }
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>
            Nova Proposta
          </Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/profile-casa-show')
            }
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={30}
            color={colors.primary}
          />

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>
              Criar proposta
            </Text>

            <Text style={styles.heroSubtitle}>
              Selecione um evento e artista.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Evento
          </Text>

          {events.map((eventItem) => {
            const eventId = getEventId(eventItem);

            const isSelected =
              selectedEventId === eventId;

            return (
              <TouchableOpacity
                key={eventId}
                style={[
                  styles.optionCard,
                  isSelected &&
                    styles.optionCardSelected,
                ]}
                onPress={() =>
                  setSelectedEventId(eventId)
                }
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>
                    {eventItem.titulo}
                  </Text>

                  <Text style={styles.optionSubtitle}>
                    {formatDateTime(
                      eventItem.data_inicio
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Artista
          </Text>

          {artists.map((artist) => {
            const artistId = getArtistId(artist);

            const isSelected =
              selectedArtistId === artistId;

            return (
              <TouchableOpacity
                key={artistId}
                style={[
                  styles.optionCard,
                  isSelected &&
                    styles.optionCardSelected,
                ]}
                onPress={() =>
                  setSelectedArtistId(artistId)
                }
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>
                    {getArtistName(artist)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>
            Valor ofertado
          </Text>

          <TextInput
            style={styles.input}
            placeholder="1500,00"
            placeholderTextColor={colors.textMuted}
            value={valorOfertado}
            onChangeText={setValorOfertado}
          />

          <Text style={styles.fieldLabel}>
            Termos
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={termos}
            onChangeText={setTermos}
          />

          {formError ? (
            <Text style={styles.formErrorText}>
              {formError}
            </Text>
          ) : null}

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
  },

  loadingText: {
    color: colors.text,
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
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorCard: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },

  errorText: {
    color: colors.error,
  },

  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  heroInfo: {
    marginLeft: spacing.md,
  },

  heroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },

  heroSubtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },

  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  optionCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  optionCardSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    color: colors.text,
    fontWeight: '700',
  },

  optionSubtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },

  fieldLabel: {
    color: colors.text,
    marginBottom: 8,
    marginTop: spacing.sm,
  },

  input: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },

  formErrorText: {
    color: colors.error,
    marginTop: spacing.sm,
  },

  submitButton: {
    marginTop: spacing.md,
  },
});