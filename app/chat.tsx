import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../services/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};

export default function ChatScreen() {
  const {
    conversationId,
    userName,
  } = useLocalSearchParams<{
    conversationId: string;
    userName: string;
  }>();

  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>(
    []
  );

  const [text, setText] = useState("");

  const [sending, setSending] = useState(false);

  /*
   * Reference to the ScrollView.
   *
   * We use this to automatically move
   * the chat to the newest message.
   */
  const scrollViewRef =
    useRef<ScrollView>(null);

  /*
   * Listen for real-time messages.
   */
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    const messagesQuery = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages: Message[] =
          snapshot.docs.map((messageDoc) => ({
            id: messageDoc.id,
            ...(messageDoc.data() as Omit<
              Message,
              "id"
            >),
          }));

        setMessages(loadedMessages);
      },
      (error) => {
        console.log(
          "Messages error:",
          error
        );
      }
    );

    return unsubscribe;
  }, [conversationId]);

  /*
   * Automatically scroll to the newest
   * message whenever messages change.
   */
  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    /*
     * Small delay allows React Native to
     * finish rendering the new message first.
     */
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [messages]);

  /*
   * Format Firebase timestamp.
   */
  const formatMessageTime = (
    timestamp: any
  ) => {
    if (!timestamp) {
      return "";
    }

    try {
      const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  /*
   * Send message.
   */
  const sendMessage = async () => {
    const messageText = text.trim();

    if (
      !messageText ||
      !conversationId
    ) {
      return;
    }

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      return;
    }

    try {
      setSending(true);

      /*
       * Add message to:
       *
       * conversations/{conversationId}/messages
       */
      await addDoc(
        collection(
          db,
          "conversations",
          conversationId,
          "messages"
        ),
        {
          text: messageText,
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
        }
      );

      /*
       * Update conversation preview.
       */
      await updateDoc(
        doc(
          db,
          "conversations",
          conversationId
        ),
        {
          lastMessage: messageText,
          lastMessageSenderId:
            currentUser.uid,
          updatedAt:
            serverTimestamp(),
        }
      );

      setText("");
    } catch (error) {
      console.log(
        "Send message error:",
        error
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 8,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.replace("/")
          }
          style={styles.backButton}
          hitSlop={10}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View
          style={styles.headerInfo}
        >
          <Text
            style={styles.headerName}
            numberOfLines={1}
          >
            {userName || "Chat"}
          </Text>

          <Text
            style={styles.headerStatus}
          >
            Messages are private
          </Text>
        </View>

        <Text
          style={styles.headerIcon}
        >
          🌻
        </Text>
      </View>

      {/* CHAT */}

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        {/* MESSAGES */}

        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingBottom: 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {messages.length === 0 ? (
            <View
              style={styles.emptyState}
            >
              <Text
                style={styles.emptyIcon}
              >
                💬
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                Start your conversation
              </Text>

              <Text
                style={styles.emptySubtitle}
              >
                Send the first message ❤️
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMine =
                message.senderId ===
                auth.currentUser?.uid;

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    isMine
                      ? styles.myMessageRow
                      : styles.theirMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMine
                        ? styles.myBubble
                        : styles.theirBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isMine
                          ? styles.myMessageText
                          : styles.theirMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>

                    {/* TIMESTAMP */}

                    <Text
                      style={[
                        styles.messageTime,
                        isMine
                          ? styles.myMessageTime
                          : styles.theirMessageTime,
                      ]}
                    >
                      {formatMessageTime(
                        message.createdAt
                      )}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* INPUT AREA */}

        <View
          style={[
            styles.inputWrapper,
            {
              paddingBottom: Math.max(
                insets.bottom,
                10
              ),
            },
          ]}
        >
          <View
            style={styles.inputArea}
          >
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#9A8C7C"
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="center"
              editable={!sending}
            />

            <Pressable
              style={[
                styles.sendButton,
                sending &&
                  styles.disabledButton,
              ]}
              onPress={sendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.sendText}
                >
                  ➤
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF9F0",
  },

  /* HEADER */

  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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

  headerInfo: {
    flex: 1,
    marginLeft: 4,
  },

  headerName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#3A3025",
  },

  headerStatus: {
    fontSize: 12,
    color: "#8A7A68",
    marginTop: 2,
  },

  headerIcon: {
    fontSize: 30,
    marginLeft: 10,
  },

  /* KEYBOARD */

  keyboardContainer: {
    flex: 1,
  },

  /* MESSAGES */

  messages: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingBottom: 70,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3A3025",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#7A6A58",
    marginTop: 6,
  },

  /* MESSAGE BUBBLES */

  messageRow: {
    width: "100%",
    marginVertical: 4,
  },

  myMessageRow: {
    alignItems: "flex-end",
  },

  theirMessageRow: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 8,
    borderRadius: 18,
  },

  myBubble: {
    backgroundColor: "#3A3025",
    borderBottomRightRadius: 5,
  },

  theirBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#E4D8C8",
  },

  messageText: {
    fontSize: 16,
    lineHeight: 21,
  },

  myMessageText: {
    color: "#FFFFFF",
  },

  theirMessageText: {
    color: "#3A3025",
  },

  /* MESSAGE TIME */

  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  myMessageTime: {
    color: "#D8CCC0",
  },

  theirMessageTime: {
    color: "#9A8C7C",
  },

  /* INPUT */

  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4D8C8",
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  messageInput: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: "#FFF9F0",
    borderRadius: 23,
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: "#3A3025",
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#3A3025",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 21,
    marginLeft: 2,
  },

  disabledButton: {
    opacity: 0.6,
  },
});