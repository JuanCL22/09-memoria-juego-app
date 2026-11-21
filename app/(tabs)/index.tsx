import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAppContext } from "@/src/components/AppProvider";
import {
  obtenerCantidadParejas,
  validarNombreJugador,
  type Dificultad
} from "@/src/services/juego.service";

const NIVELES: ReadonlyArray<{ readonly id: Dificultad; readonly etiqueta: string }> = [
  { id: "facil", etiqueta: "Fácil (4 parejas)" },
  { id: "medio", etiqueta: "Medio (6 parejas)" },
  { id: "dificil", etiqueta: "Difícil (12 parejas)" }
];

function SelectorDificultad(props: {
  readonly actual: Dificultad;
  readonly onSelect: (d: Dificultad) => void;
}): React.ReactElement {
  return (
    <>
      {NIVELES.map((nivel) => (
        <Pressable
          key={nivel.id}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar dificultad ${nivel.etiqueta}`}
          onPress={() => props.onSelect(nivel.id)}
          style={[
            estilos.botonNivel,
            props.actual === nivel.id ? estilos.botonNivelActivo : null
          ]}
        >
          <Text style={estilos.textoNivel}>
            {nivel.etiqueta} · {obtenerCantidadParejas(nivel.id) * 2} cartas
          </Text>
        </Pressable>
      ))}
    </>
  );
}

function BotonesInicio(props: {
  readonly onJugar: () => void;
  readonly onAjustes: () => void;
}): React.ReactElement {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Comenzar partida de memoria"
        onPress={props.onJugar}
        style={estilos.botonJugar}
      >
        <Text style={estilos.textoBotonJugar}>Jugar ahora</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir pantalla de ajustes de sonido y vibración"
        onPress={props.onAjustes}
        style={estilos.botonSecundario}
      >
        <Text style={estilos.textoSecundario}>Ajustes de sonido y sensores</Text>
      </Pressable>
    </>
  );
}

export default function InicioScreen(): React.ReactElement {
  const router = useRouter();
  const { jugador, setJugador, dificultad, setDificultad } = useAppContext();
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  const iniciarPartida = () => {
    const validacion = validarNombreJugador(jugador);
    if (!validacion.valido) {
      setErrorNombre(validacion.error);
      return;
    }
    setErrorNombre(null);
    setJugador(validacion.limpio);
    router.push("/juego");
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>09 · Juego de Memoria</Text>
      <Text style={estilos.subtitulo}>
        Encuentra todas las parejas en el menor número de movimientos y segundos.
      </Text>
      <Text style={estilos.etiqueta}>Nombre del jugador (2–15 caracteres):</Text>
      <TextInput
        value={jugador}
        onChangeText={setJugador}
        maxLength={15}
        placeholder="Tu nombre"
        placeholderTextColor="#64748b"
        accessibilityLabel="Campo de texto para nombre del jugador"
        style={estilos.input}
      />
      {errorNombre ? <Text style={estilos.textoError}>{errorNombre}</Text> : null}
      <Text style={estilos.etiqueta}>Selecciona la dificultad:</Text>
      <SelectorDificultad actual={dificultad} onSelect={setDificultad} />
      <BotonesInicio onJugar={iniciarPartida} onAjustes={() => router.push("/ajustes")} />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 20, backgroundColor: "#0f172a" },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#2dd4bf", marginBottom: 6 },
  subtitulo: { fontSize: 14, color: "#94a3b8", marginBottom: 20 },
  etiqueta: { fontSize: 14, fontWeight: "600", color: "#e2e8f0", marginBottom: 8 },
  input: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 12
  },
  textoError: { color: "#f87171", marginBottom: 12, fontSize: 13 },
  botonNivel: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 10
  },
  botonNivelActivo: { backgroundColor: "#0f766e", borderColor: "#2dd4bf" },
  textoNivel: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
  botonJugar: {
    backgroundColor: "#14b8a6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14
  },
  textoBotonJugar: { color: "#0f172a", fontSize: 16, fontWeight: "bold" },
  botonSecundario: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#334155"
  },
  textoSecundario: { color: "#38bdf8", fontSize: 14, fontWeight: "600" }
});
