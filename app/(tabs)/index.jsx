import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

const featuredEvents = [
  {
    id: 1,
    title: 'Du e bielzin',
    date: '24 fev',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop&auto=format',
  },
  {
    id: 2,
    title: 'Terapia sem f...',
    date: '27 fev',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=300&fit=crop&auto=format',
  },
  {
    id: 3,
    title: 'Festa',
    date: '28 fev',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c9c3b6f2?w=300&h=300&fit=crop&auto=format',
  },
];

const recentActivities = [
  { id: 1, month: 'NOV.', day: '24', title: 'Terapia sem fim com Nattan', time: 'Há duas semanas' },
  { id: 2, month: 'NOV.', day: '25', title: 'Festa', time: 'Há três semanas' },
  { id: 3, month: 'NOV.', day: '26', title: 'After com Nattan', time: 'Há quatro semanas' },
];

export default function ClientDashboardScreen() {
  const { width } = useWindowDimensions();
  const isWebWide = width > 480;
  const contentWidth = isWebWide ? 420 : width;
  const mainImageHeight = isWebWide ? 190 : 160;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenWrapper}>
        <View style={[styles.mobileFrame, { width: contentWidth }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} activeOpacity={0.8}>
                <ChevronLeft size={34} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.header}>
              <Text style={styles.greeting}>Olá Carlos!</Text>
              <Text style={styles.subtitle}>Descubra os melhores eventos para você</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.featuredItem} activeOpacity={0.8}>
                  <Image source={{ uri: event.image }} style={styles.featuredImage} />
                  <Text style={styles.featuredTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.featuredDate}>{event.date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eventos perto de você</Text>

              <View style={styles.mainCard}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=500&fit=crop&auto=format',
                  }}
                  style={[styles.mainCardImage, { height: mainImageHeight }]}
                />

                <View style={styles.mainCardContent}>
                  <View style={styles.mainCardHeaderRow}>
                    <View style={styles.mainTextArea}>
                      <Text style={styles.mainCardTitle}>Terapia sem fim com Nattan</Text>

                      <View style={styles.infoRow}>
                        <MapPin size={15} color={colors.textSecondary} />
                        <Text style={styles.infoText}>Av. Bezerra de Menezes</Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Clock size={15} color={colors.textSecondary} />
                        <Text style={styles.infoText}>23:00</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.arrowButton} activeOpacity={0.8}>
                      <ChevronRight size={42} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.detailsButton} activeOpacity={0.8}>
                    <Text style={styles.detailsButtonText}>Ver detalhes</Text>
                  </TouchableOpacity>

                  <View style={styles.pagination}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Atividade Recente</Text>

              {recentActivities.map((item) => (
                <View key={item.id} style={styles.activityCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{item.month}</Text>
                    <Text style={styles.dateDay}>{item.day}</Text>
                  </View>

                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                  </View>

                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenWrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  mobileFrame: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  topBar: {
    backgroundColor: '#0B2A73',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#8B8FA3',
    maxWidth: 280,
  },
  featuredList: {
    paddingHorizontal: spacing.md,
    gap: 18,
    paddingBottom: spacing.lg,
  },
  featuredItem: {
    width: 88,
    alignItems: 'center',
  },
  featuredImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
    marginBottom: 8,
  },
  featuredTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  featuredDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  mainCard: {
    borderWidth: 1,
    borderColor: '#7E7E93',
    borderRadius: borderRadius.lg,
    padding: 12,
    backgroundColor: colors.background,
  },
  mainCardImage: {
    width: '100%',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  mainCardContent: {
    gap: spacing.md,
  },
  mainCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainTextArea: {
    flex: 1,
  },
  mainCardTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  arrowButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  detailsButton: {
    alignSelf: 'center',
    backgroundColor: '#1A2957',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  detailsButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
  },
  dot: {
    width: 30,
    height: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#7E7E93',
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  dateBox: {
    width: 52,
    height: 58,
    borderRadius: borderRadius.md,
    backgroundColor: '#2B3150',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    color: '#7FA1FF',
    fontSize: 10,
    fontWeight: '700',
  },
  dateDay: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  activityTime: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 90,
    textAlign: 'right',
  },
});