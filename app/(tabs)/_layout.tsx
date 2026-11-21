import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        tabBarStyle: { backgroundColor: "#1e293b", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#2dd4bf",
        tabBarInactiveTintColor: "#94a3b8"
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarAccessibilityLabel: "Pestaña Inicio y elección de dificultad"
        }}
      />
      <Tabs.Screen
        name="puntajes"
        options={{
          title: "Puntajes",
          tabBarAccessibilityLabel: "Pestaña Mejores puntajes por dificultad"
        }}
      />
    </Tabs>
  );
}
