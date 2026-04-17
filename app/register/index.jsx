import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={34} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Junte-se ao Night Out hoje</Text>
      </View>

      <Text style={styles.sectionTitle}>Selecione o tipo de conta</Text>

      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push('/register/client')}>
        <MaterialIcons name="person" size={72} color="#6EE56B" />
        <Text style={styles.cardLabel}>Cliente</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push('/register/artista')}>
        <MaterialCommunityIcons name="music-note" size={72} color="#C26AA0" />
        <Text style={styles.cardLabel}>Artista</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push('/register/casashow')}>
        <MaterialCommunityIcons name="office-building" size={72} color="#5B8CFF" />
        <Text style={styles.cardLabel}>Casa de Show</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#031533',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 48,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'center',
    marginBottom: 20,
  },
  card: {
    height: 152,
    borderWidth: 1,
    borderColor: '#5A6478',
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
});