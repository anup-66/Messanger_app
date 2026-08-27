import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { auth, db } from "../../services/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type Conversation = {
  id: string;
  participants: string[];
  participantNames?: {
    [key: string]: string;
  };
  lastMessage?: string;
  lastMessageSenderId?: string;
  updatedAt?: any;
};

export default function HomeScreen() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const conversationsRef = collection(
      db,
      "conversations"
    );

    const conversationsQuery = query(
      conversationsRef,
      where(
        "participants",
        "array-contains",
        currentUser.uid
      ),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const loadedConversations: Conversation[] =
          snapshot.docs.map((conversationDoc) => ({
            id: conversationDoc.id,
            ...(conversationDoc.data() as Omit<
              Conversation,
              "id"
            >),
          }));

        setConversations(loadedConversations);
        setLoading(false);
      },
      (error) => {
        console.log(
          "Conversations error:",
          error
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getOtherUserId = (
    conversation: Conversation
  ) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return null;
    }

    return conversation.participants.find(
      (id) => id !== currentUser.uid
    );
  };

  const getOtherUserName = (
    conversation: Conversation
  ) => {
    const otherUserId =
      getOtherUserId(conversation);

    if (!otherUserId) {
      return "Unknown user";
    }

    return (
      conversation.participantNames?.[
        otherUserId
      ] || "User"
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) {
      return "";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      const now = new Date();

      if (
        date.toDateString() ===
        now.toDateString()
      ) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const openConversation = (
    conversation: Conversation
  ) => {
    const otherUserName =
      getOtherUserName(conversation);

    router.push({
      pathname: "/chat",
      params: {
        conversationId: conversation.id,
        userName: otherUserName,
      },
    });
  };

  const renderConversation = ({
    item,
  }: {
    item: Conversation;
  }) => {
    const otherUserName =
      getOtherUserName(item);

    const initial =
      otherUserName
        .charAt(0)
        .toUpperCase() || "?";

    return (
      <Pressable
        style={styles.chatItem}
        onPress={() =>
          openConversation(item)
        }
      >
        {/* AVATAR */}

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initial}
          </Text>
        </View>

        {/* CHAT INFORMATION */}

        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text
              style={styles.chatName}
              numberOfLines={1}
            >
              {otherUserName}
            </Text>

            <Text style={styles.time}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>

          <Text
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.lastMessage ||
              "Start a conversation ❤️"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Messenger
          </Text>

          <Text style={styles.subtitle}>
            Your conversations ❤️
          </Text>
        </View>

        <Pressable
          style={styles.profileButton}
          onPress={() =>
            router.push("/profile")
          }
        >
          <Text style={styles.profileIcon}>
            👤
          </Text>
        </Pressable>
      </View>

      {/* CHAT TITLE */}

      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>
          Chats
        </Text>

        {conversations.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {conversations.length}
            </Text>
          </View>
        )}
      </View>

      {/* CONTENT */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#3A3025"
          />

          <Text style={styles.loadingText}>
            Loading conversations...
          </Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            💬
          </Text>

          <Text style={styles.emptyTitle}>
            No conversations yet
          </Text>

          <Text style={styles.emptySubtitle}>
            Find someone and start chatting.
          </Text>

          <Pressable
            style={styles.findButton}
            onPress={() =>
              router.push("/find-user")
            }
          >
            <Text style={styles.findButtonText}>
              Find someone
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={renderConversation}
          contentContainerStyle={
            styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FLOATING ADD BUTTON */}

      <Pressable
        style={styles.floatingButton}
        onPress={() =>
          router.push("/find-user")
        }
      >
        <Text style={styles.plusText}>
          +
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F0",
  },

  /* HEADER */

  header: {
    paddingTop: 65,
    paddingHorizontal: 22,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4D8C8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3A3025",
  },

  subtitle: {
    fontSize: 13,
    color: "#8A7A68",
    marginTop: 3,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF3DD",
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    fontSize: 22,
  },

  /* CHAT HEADER */

  chatHeader: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  chatTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3A3025",
  },

  countBadge: {
    marginLeft: 8,
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#E8D7BD",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
  },

  countText: {
    color: "#5A4634",
    fontSize: 13,
    fontWeight: "700",
  },

  /* CHAT LIST */

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },

  chatItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE2D3",
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
    fontSize: 22,
    fontWeight: "700",
    color: "#3A3025",
  },

  chatInfo: {
    flex: 1,
    marginLeft: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chatName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#3A3025",
    marginRight: 10,
  },

  time: {
    fontSize: 11,
    color: "#8A7A68",
  },

  lastMessage: {
    fontSize: 14,
    color: "#7A6A58",
    marginTop: 5,
  },

  /* LOADING */

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#7A6A58",
  },

  /* EMPTY */

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 80,
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#3A3025",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#7A6A58",
    marginTop: 7,
    textAlign: "center",
  },

  findButton: {
    marginTop: 22,
    backgroundColor: "#3A3025",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 25,
  },

  findButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  /* FLOATING BUTTON */

  floatingButton: {
    position: "absolute",
    right: 22,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3A3025",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  plusText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    marginTop: -2,
  },
});