import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function EditProfileScreen() {
  const user = auth.currentUser;

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();

          setName(
            data.name ||
              data.displayName ||
              user.displayName ||
              user.email?.split("@")[0] ||
              ""
          );
        } else {
          setName(
            user.displayName ||
              user.email?.split("@")[0] ||
              ""
          );
        }
      } catch (error) {
        console.log("Profile loading error:", error);

        setName(
          user.displayName ||
            user.email?.split("@")[0] ||
            ""
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const saveProfile = async () => {
    const trimmedName = name.trim();

    if (!user) {
      Alert.alert(
        "Not logged in",
        "Please log in again."
      );
      return;
    }

    if (!trimmedName) {
      Alert.alert(
        "Name required",
        "Please enter your name."
      );
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        name: trimmedName,
      });

      Alert.alert(
        "Profile updated 🌻",
        "Your name has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/profile"),
          },
        ]
      );
    } catch (error) {
      console.log(
        "Profile update error:",
        error
      );

      Alert.alert(
        "Update failed",
        "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
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
    name.trim() || "User";

  const initial =
    displayName.charAt(0).toUpperCase() || "?";

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.headerTitle}>
          Edit Profile
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* PROFILE AVATAR */}

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initial}
          </Text>
        </View>

        <Text style={styles.avatarHint}>
          Profile picture coming soon
        </Text>
      </View>

      {/* FORM */}

      <View style={styles.form}>

        {/* NAME */}

        <Text style={styles.label}>
          Name
        </Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#9A8C7C"
          autoCapitalize="words"
          autoCorrect={false}
          editable={!saving}
        />

        {/* EMAIL */}

        <Text style={styles.label}>
          Email
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.disabledInput,
          ]}
          value={user.email || ""}
          editable={false}
        />

        <Text style={styles.emailHint}>
          Email cannot be changed here.
        </Text>

        {/* SAVE */}

        <Pressable
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Changes
            </Text>
          )}
        </Pressable>

      </View>
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

  /* HEADER */

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

  /* PROFILE */

  profileSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
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

  avatarHint: {
    marginTop: 10,
    fontSize: 13,
    color: "#8A7A68",
  },

  /* FORM */

  form: {
    paddingHorizontal: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3A3025",
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4D8C8",
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#3A3025",
  },

  disabledInput: {
    backgroundColor: "#F3EEE7",
    color: "#8A7A68",
  },

  emailHint: {
    fontSize: 12,
    color: "#9A8C7C",
    marginTop: 6,
  },

  /* SAVE */

  saveButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#3A3025",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },
});