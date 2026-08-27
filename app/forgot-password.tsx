import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Alert.alert(
        "Email required",
        "Please enter the email address associated with your account."
      );
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        trimmedEmail
      );

      Alert.alert(
        "Check your email 📩",
        "We've sent you a password reset link. Please check your inbox and follow the instructions.",
        [
          {
            text: "Back to Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "Password reset error:",
        error
      );

      let message =
        "Something went wrong. Please try again.";

      if (
        error.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      } else if (
        error.code ===
        "auth/user-not-found"
      ) {
        message =
          "No account was found with this email address.";
      } else if (
        error.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many attempts. Please wait a while and try again.";
      }

      Alert.alert(
        "Password reset failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <View style={styles.container}>
        {/* BACK BUTTON */}

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        {/* HEADER */}

        <Text style={styles.sunflower}>
          🌻
        </Text>

        <Text style={styles.title}>
          Forgot your password?
        </Text>

        <Text style={styles.subtitle}>
          No worries. Enter your email and
          we'll send you a link to reset your
          password.
        </Text>

        {/* EMAIL */}

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9A8C7C"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          editable={!loading}
        />

        {/* RESET BUTTON */}

        <Pressable
          style={[
            styles.button,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text
                style={styles.buttonText}
              >
                Sending...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              Send reset link
            </Text>
          )}
        </Pressable>

        {/* BACK TO LOGIN */}

        <Pressable
          onPress={() => router.replace("/login")}
          style={styles.loginLink}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            ← Back to Login
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#FFF9F0",
  },

  backButton: {
    position: "absolute",
    top: 55,
    left: 20,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 38,
    lineHeight: 38,
    color: "#3A3025",
    fontWeight: "300",
  },

  sunflower: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#3A3025",
  },

  subtitle: {
    textAlign: "center",
    color: "#7A6A58",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4D8C8",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#3A3025",
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#3A3025",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  loginLink: {
    marginTop: 22,
    alignItems: "center",
  },

  linkText: {
    color: "#8A6240",
    fontWeight: "600",
    fontSize: 15,
  },
});