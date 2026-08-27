import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function ProfileScreen() {
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();

          setName(
            data.name ||
              data.displayName ||
              user.displayName ||
              user.email?.split("@")[0] ||
              "User"
          );
        } else {
          setName(
            user.displayName ||
              user.email?.split("@")[0] ||
              "User"
          );
        }
      } catch (error) {
        console.log(
          "Profile loading error:",
          error
        );

        setName(
          user.displayName ||
            user.email?.split("@")[0] ||
            "User"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.log(
                "Logout error:",
                error
              );

              Alert.alert(
                "Logout failed",
                "Something went wrong. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#3A3025"
        />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    name || "User";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Profile
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* PROFILE */}

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initial}
          </Text>
        </View>

        <Text style={styles.name}>
          {displayName}
        </Text>

        <Text style={styles.email}>
          {user.email}
        </Text>
      </View>

      {/* ACCOUNT */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Name
            </Text>

            <Text style={styles.infoValue}>
              {displayName}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Email
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>
        </View>
      </View>

      {/* LOGOUT */}

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutIcon}>
          🚪
        </Text>

        <Text style={styles.logoutText}>
          Log out
        </Text>
      </Pressable>

      <Text style={styles.footer}>
        Messenger 🌻
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF9F0",
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 18,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4D8C8",
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 38,
    lineHeight: 38,
    color: "#3A3025",
    fontWeight: "300",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#3A3025",
  },

  headerSpacer: {
    width: 42,
  },

  profileSection: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 30,
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#F1DFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 38,
    fontWeight: "700",
    color: "#3A3025",
  },

  name: {
    marginTop: 15,
    fontSize: 25,
    fontWeight: "700",
    color: "#3A3025",
  },

  email: {
    marginTop: 5,
    fontSize: 14,
    color: "#7A6A58",
  },

  section: {
    paddingHorizontal: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3A3025",
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EDE2D3",
    overflow: "hidden",
  },

  infoRow: {
    minHeight: 60,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoLabel: {
    fontSize: 14,
    color: "#8A7A68",
  },

  infoValue: {
    flex: 1,
    textAlign: "right",
    marginLeft: 20,
    fontSize: 15,
    fontWeight: "600",
    color: "#3A3025",
  },

  divider: {
    height: 1,
    backgroundColor: "#EDE2D3",
  },

  logoutButton: {
    marginHorizontal: 18,
    marginTop: 30,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4D8C8",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8A6240",
  },

  footer: {
    position: "absolute",
    bottom: 25,
    width: "100%",
    textAlign: "center",
    fontSize: 13,
    color: "#A49482",
  },
});