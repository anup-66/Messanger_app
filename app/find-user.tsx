import { useState } from "react";
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
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";

type FoundUser = {
  uid: string;
  name: string;
  email: string;
};

export default function FindUserScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [foundUser, setFoundUser] =
    useState<FoundUser | null>(null);

  const searchUser = async () => {
    const searchEmail = email.trim().toLowerCase();

    if (!searchEmail) {
      Alert.alert(
        "Enter an email",
        "Please enter the email address of the person you want to find."
      );
      return;
    }

    try {
      setLoading(true);
      setFoundUser(null);

      const usersRef = collection(db, "users");

      const q = query(
        usersRef,
        where("email", "==", searchEmail)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert(
          "User not found",
          "No account was found with this email."
        );
        return;
      }

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();

      setFoundUser({
        uid: data.uid,
        name: data.name || "User",
        email: data.email,
      });

      console.log("User found:", data.uid);
    } catch (error) {
      console.log("Search error:", error);

      Alert.alert(
        "Search failed",
        "Something went wrong while searching."
      );
    } finally {
      setLoading(false);
    }
  };

  const startChat = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser || !foundUser) {
      return;
    }

    if (currentUser.uid === foundUser.uid) {
      Alert.alert(
        "That's you 😄",
        "You cannot start a conversation with yourself."
      );
      return;
    }

    try {
      setChatLoading(true);

      /*
       * Get the current user's profile from Firestore.
       *
       * Firebase Authentication's displayName may be empty,
       * but our users collection contains the real name.
       */
      const currentUserRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const currentUserSnapshot =
        await getDoc(currentUserRef);

      let currentUserName = "User";

      if (currentUserSnapshot.exists()) {
        const currentUserData =
          currentUserSnapshot.data();

        currentUserName =
          currentUserData.name ||
          currentUserData.displayName ||
          currentUser.displayName ||
          "User";
      } else {
        currentUserName =
          currentUser.displayName || "User";
      }

      /*
       * Create a consistent conversation ID
       * regardless of which user starts the chat.
       */
      const participantIds = [
        currentUser.uid,
        foundUser.uid,
      ].sort();

      const conversationId =
        participantIds.join("_");

      const conversationRef = doc(
        db,
        "conversations",
        conversationId
      );

      /*
       * Store BOTH users' names.
       *
       * Example:
       *
       * participantNames: {
       *   "abc123": "Anup",
       *   "xyz789": "Rahul"
       * }
       */
      await setDoc(
        conversationRef,
        {
          participants: participantIds,

          participantNames: {
            [currentUser.uid]: currentUserName,
            [foundUser.uid]: foundUser.name,
          },

          updatedAt: serverTimestamp(),

          /*
           * Only set createdAt if this is a new conversation.
           * merge:true prevents overwriting an existing value.
           */
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        "Conversation ready:",
        conversationId
      );

      console.log(
        "Participants:",
        currentUserName,
        "↔",
        foundUser.name
      );

      router.push({
        pathname: "/chat",
        params: {
          conversationId: conversationId,
          userName: foundUser.name,
        },
      });
    } catch (error) {
      console.log(
        "Conversation error:",
        error
      );

      Alert.alert(
        "Unable to start chat",
        "Something went wrong while creating the conversation."
      );
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* BACK BUTTON */}

      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </Pressable>

      {/* HEADER */}

      <Text style={styles.sunflower}>
        🌻
      </Text>

      <Text style={styles.title}>
        Find someone
      </Text>

      <Text style={styles.subtitle}>
        Search for someone using their email address.
      </Text>

      {/* SEARCH */}

      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />

      <Pressable
        style={styles.button}
        onPress={searchUser}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Search
          </Text>
        )}
      </Pressable>

      {/* FOUND USER */}

      {foundUser && (
        <View style={styles.userCard}>

          {/* AVATAR */}

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {foundUser.name
                ? foundUser.name
                    .charAt(0)
                    .toUpperCase()
                : "?"}
            </Text>
          </View>

          {/* USER INFO */}

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {foundUser.name}
            </Text>

            <Text style={styles.userEmail}>
              {foundUser.email}
            </Text>
          </View>

          {/* CHAT BUTTON */}

          <Pressable
            style={[
              styles.chatButton,
              chatLoading &&
                styles.disabledButton,
            ]}
            onPress={startChat}
            disabled={chatLoading}
          >
            {chatLoading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.chatButtonText}
              >
                Chat
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#FFF9F0",
  },

  backButton: {
    marginBottom: 20,
  },

  backText: {
    fontSize: 16,
    color: "#8A6240",
    fontWeight: "600",
  },

  sunflower: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#3A3025",
  },

  subtitle: {
    fontSize: 15,
    color: "#7A6A58",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4D8C8",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#3A3025",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 14,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  userCard: {
    marginTop: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E4D8C8",
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#F1DFC5",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3A3025",
  },

  userInfo: {
    flex: 1,
    marginLeft: 14,
  },

  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3A3025",
  },

  userEmail: {
    fontSize: 13,
    color: "#7A6A58",
    marginTop: 4,
  },

  chatButton: {
    backgroundColor: "#3A3025",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 55,
    alignItems: "center",
  },

  chatButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },
});