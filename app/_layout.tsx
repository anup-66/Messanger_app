import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const segments = useSegments();

  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentRoute = segments[0];

    const isAuthScreen =
      currentRoute === "login" ||
      currentRoute === "register";

    if (!user && !isAuthScreen) {
      router.replace("/login");
      return;
    }

    if (
      user &&
      (currentRoute === "login" ||
        currentRoute === "register")
    ) {
      router.replace("/");
    }
  }, [user, loading, segments]);

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
      <Stack.Screen name="index" />

      <Stack.Screen name="login" />

      <Stack.Screen name="register" />

      <Stack.Screen name="find-user" />

      <Stack.Screen name="chat" />

      <Stack.Screen name="profile" />
    </Stack>
  );
}