import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { auth } from "../services/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("Logged in:", userCredential.user.uid);

      router.replace("/");
    } catch (error: any) {
      console.log("Login error:", error);

      let message = "Unable to log in.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message = "Incorrect email or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email.";
      }

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sunflower}>🌻</Text>

      <Text style={styles.title}>Welcome back ❤️</Text>

      <Text style={styles.subtitle}>
        Good to see you again.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </Pressable>
      <Pressable
  onPress={() => router.push("/forgot-password")}
  style={styles.forgotLink}
>
  <Text style={styles.forgotText}>
    Forgot password?
  </Text>
</Pressable>

      <Pressable
        onPress={() => router.push("/register")}
        style={styles.registerLink}
      >
        <Text style={styles.linkText}>
          Don't have an account? Create one
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "#FFF9F0",
  },

  sunflower: {
    fontSize: 55,
    textAlign: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#3A3025",
  },

  subtitle: {
    textAlign: "center",
    color: "#7A6A58",
    marginTop: 8,
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
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#3A3025",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  registerLink: {
    marginTop: 20,
  },
  forgotLink: {
  marginTop: 18,
  alignItems: "center",
},

forgotText: {
  color: "#8A6240",
  fontWeight: "600",
  fontSize: 14,
},

  linkText: {
    textAlign: "center",
    color: "#8A6240",
    fontWeight: "600",
  },
});