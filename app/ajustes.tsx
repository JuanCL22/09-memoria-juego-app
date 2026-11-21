import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { DEFAULT_API_URL, obtenerBaseUrlApi } from "@/src/api/client";
import { useAppContext } from "@/src/components/AppProvider";

function FilaInterruptor(props: {
  readonly etiqueta: string;
  readonly labelAccesible: string;
  readonly valor: boolean;
  readonly onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <View style={estilos.fila}>
      <Text style={estilos.etiqueta}>{props.etiqueta}</Text>
      <Switch
        accessibilityLabel={props.labelAccesible}
        value={props.valor}
        onValueChange={props.onChange}
      />
    </View>
  );
}

export default function AjustesScreen(): React.ReactElement {
  const ctx = useAppContext();
  const urlApi = obtenerBaseUrlApi(DEFAULT_API_URL);

  const restaurar = () => {
    ctx.setSonidoActivo(true);
    ctx.setVibracionActiva(true);
    ctx.setModoInclinacionActivo(false);
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Ajustes de Juego y Accesibilidad</Text>
      <FilaInterruptor
        etiqueta="Efectos de sonido (expo-audio)"
        labelAccesible="Interruptor de efectos de sonido"
        valor={ctx.sonidoActivo}
        onChange={ctx.setSonidoActivo}
      />
      <FilaInterruptor
        etiqueta="Vibración háptica (expo-haptics)"
        labelAccesible="Interruptor de vibración al acertar o fallar"
        valor={ctx.vibracionActiva}
        onChange={ctx.setVibracionActiva}
      />
      <FilaInterruptor
        etiqueta="Modo inclinación con Giroscopio"
        labelAccesible="Interruptor de modo inclinación con giroscopio"
        valor={ctx.modoInclinacionActivo}
        onChange={ctx.setModoInclinacionActivo}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restaurar ajustes predeterminados"
        onPress={restaurar}
        style={estilos.botonReset}
      >
        <Text style={estilos.textoBoton}>Restaurar valores por defecto</Text>
      </Pressable>
      <View style={estilos.cajaInfo}>
        <Text style={estilos.infoTitulo}>Conexión segura con la API</Text>
        <Text style={estilos.infoTexto}>EXPO_PUBLIC_API_URL: {urlApi}</Text>
        <Text style={estilos.infoTexto}>
          Almacenamiento de sesión: expo-secure-store (Cero secretos en el APK).
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, backgroundColor: "#0f172a" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#2dd4bf", marginBottom: 16 },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12
  },
  etiqueta: { color: "#f8fafc", fontSize: 15, flex: 1, marginRight: 10 },
  botonReset: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8
  },
  textoBoton: { color: "#f8fafc", fontWeight: "600", fontSize: 14 },
  cajaInfo: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: "#1e293b"
  },
  infoTitulo: { color: "#38bdf8", fontWeight: "bold", marginBottom: 6 },
  infoTexto: { color: "#94a3b8", fontSize: 12, marginBottom: 4 }
});
