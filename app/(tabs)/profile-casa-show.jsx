import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import LogoutModal from "../../components/logoutModal";
import { getCasaShowById } from "../../services/api";

export default function ProfileCasaShowScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [casaData, setCasaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const stored = await AsyncStorage.getItem("user_session");
        if (!stored) return;

        const session = JSON.parse(stored);
        const sessionId = session.id || session.id_usuario || session.id_casa;

        if (sessionId && session.token) {
          const casaRes = await getCasaShowById(sessionId, session.token);
          if (casaRes && (casaRes.id || casaRes.id_usuario || casaRes.id_casa)) {
            setCasaData({
              nome: casaRes.nome_fantasia || casaRes.nome || session.nome,
              email: casaRes.email || casaRes.usuario?.email || session.email,
              cnpj: casaRes.cnpj || "Não informado",
              endereco: casaRes.endereco || "Não informado",
              telefone: casaRes.telefone || casaRes.usuario?.telefone || "Não informado",
              capacidade: casaRes.capacidade ? `${casaRes.capacidade} Pessoas` : "Não informado",
              status: "Ativo",
              image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
            });
          }
        }
      } catch (err) {
        console.log("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user_session");
      setModalVisible(false);
      router.replace("/login");
    } catch (error) {
      console.log("Erro ao fazer logout:", error);
    }
  };

  if (loading || !casaData) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image source={{ uri: casaData.image }} style={styles.avatar} />

          <Text style={styles.name}>{casaData.nome}</Text>
          <Text style={styles.email}>{casaData.email}</Text>

          <View style={styles.badges}>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeText}>Casa de Show</Text>
            </View>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeText}>{casaData.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Informações de Casa de Show</Text>

          {renderItem("Nome Fantasia", casaData.nome)}
          {renderItem("CNPJ", casaData.cnpj)}
          {renderItem("Endereço", casaData.endereco)}
          {renderItem("Email", casaData.email)}
          {renderItem("Telefone", casaData.telefone)}
          {renderItem("Capacidade", casaData.capacidade)}
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LogoutModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

function renderItem(label, value) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02142b",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  avatar: {
    width: 180,
    height: 180,
    borderRadius: 100,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#5b8cff",
    shadowColor: "#5b8cff",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },

  email: {
    color: "#9aa4b2",
    marginBottom: 15,
  },

  badges: {
    flexDirection: "row",
    gap: 12,
  },

  badgeBlue: {
    backgroundColor: "#3b82f6",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  badgeGreen: {
    backgroundColor: "#22c55e",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "600",
  },

  infoContainer: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 15,
  },

  item: {
    borderBottomWidth: 1,
    borderBottomColor: "#2a3a5a",
    paddingVertical: 14,
  },

  label: {
    color: "#b0bac9",
    fontSize: 15,
    fontWeight: "600",
  },

  value: {
    color: "#e4e9f2",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },

  footer: {
    marginTop: 30,
    alignItems: "center",
  },

  logoutButton: {
    backgroundColor: "#ff3b3b",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
    alignItems: "center",
  },

  logoutButtonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: "#cc2f2f",
    opacity: 0.9,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
