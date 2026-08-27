import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  View,
  ActivityIndicator,
} from "react-native";

export default function RootLayout() {
  const segments = useSegments();

  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  /*
   * Listen for Firebase authentication changes.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /*
   * Protect application routes.
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    const currentRoute = segments[0];

    /*
     * These pages are accessible even when
     * the user is NOT logged in.
     */
    const isAuthScreen =
      currentRoute === "login" ||
      currentRoute === "register" ||
      currentRoute === "forgot-password";

    /*
     * User is NOT logged in.
     *
     * Allow:
     * - login
     * - register
     * - forgot password
     *
     * Everything else goes to login.
     */
    if (!user && !isAuthScreen) {
      router.replace("/login");
      return;
    }

    /*
     * User IS logged in.
     *
     * Don't allow them to stay on:
     * - login
     * - register
     * - forgot password
     */
    if (user && isAuthScreen) {
      router.replace("/");
    }
  }, [user, loading, segments]);

  /*
   * Wait for Firebase to determine
   * the authentication state.
   */
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF9F0",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#3A3025"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* MAIN APP */}

      <Stack.Screen name="index" />

      <Stack.Screen name="find-user" />

      <Stack.Screen name="chat" />

      <Stack.Screen name="profile" />

      <Stack.Screen name="edit-profile" />

      {/* AUTHENTICATION */}

      <Stack.Screen name="login" />

      <Stack.Screen name="register" />

      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}