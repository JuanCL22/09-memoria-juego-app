import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/src/components/AppProvider";

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={estilos.raiz}>
      <AppProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0f172a" },
            headerTintColor: "#f8fafc",
            contentStyle: { backgroundColor: "#0f172a" }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="juego" options={{ title: "Tablero de Memoria" }} />
          <Stack.Screen name="ajustes" options={{ title: "Ajustes" }} />
        </Stack>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: "#0f172a"
  }
});
