import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import { CartaTablero } from "@/src/components/CartaTablero";
import { ControlesJuegoBar } from "@/src/components/ControlesJuegoBar";
import type { CartaMemoria, Dificultad } from "@/src/services/juego.service";
import { usePartidaMemoria } from "@/src/services/usePartidaMemoria";

function BannerVictoria(props: {
  readonly movimientos: number;
  readonly segundos: number;
  readonly onVerRanking: () => void;
}): React.ReactElement {
  return (
    <View style={estilos.bannerVictoria}>
      <Text style={estilos.textoVictoria}>
        ¡Partida completada en {props.movimientos} movimientos y {props.segundos} s!
        Puntaje guardado.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver tabla de mejores puntajes"
        onPress={props.onVerRanking}
        style={estilos.botonRanking}
      >
        <Text style={estilos.textoBotonRanking}>Ver Ranking Top 10</Text>
      </Pressable>
    </View>
  );
}

function CuadriculaCartas(props: {
  readonly cartas: ReadonlyArray<CartaMemoria>;
  readonly modoInclinacion: boolean;
  readonly cursor: number;
  readonly dificultad: Dificultad;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly onVoltear: (id: string) => void;
}): React.ReactElement {
  return (
    <View
      style={[
        estilos.tablero,
        {
          transform: [{ translateX: props.offsetX }, { translateY: props.offsetY }]
        }
      ]}
    >
      {props.cartas.map((carta, idx) => (
        <CartaTablero
          key={carta.id}
          carta={carta}
          indice={idx}
          esCursorInclinacion={props.modoInclinacion && props.cursor === idx}
          modoDificilArrastre={props.dificultad === "dificil"}
          onVoltear={props.onVoltear}
        />
      ))}
    </View>
  );
}

function EncabezadoPartida(props: {
  readonly jugador: string;
  readonly dificultad: string;
  readonly movimientos: number;
  readonly segundos: number;
  readonly pausado: boolean;
}): React.ReactElement {
  return (
    <>
      <View style={estilos.encabezado}>
        <Text style={estilos.textoInfo}>
          Jugador: {props.jugador} · Nivel: {props.dificultad}
        </Text>
        <Text style={estilos.textoMetricas}>
          Movimientos: {props.movimientos} · Tiempo: {props.segundos} s
        </Text>
      </View>
      {props.pausado ? (
        <Text style={estilos.avisoPausa}>Partida en pausa (pulsación larga o botón)</Text>
      ) : null}
    </>
  );
}

function crearGestosTablero(onBarajar: () => void, onPausar: () => void) {
  const fling = Gesture.Fling().runOnJS(true).direction(Directions.UP).onEnd(onBarajar);
  const longPress = Gesture.LongPress().runOnJS(true).minDuration(600).onEnd(onPausar);
  return Gesture.Simultaneous(fling, longPress);
}

export default function JuegoScreen(): React.ReactElement {
  const router = useRouter();
  const p = usePartidaMemoria();
  const gestos = crearGestosTablero(p.barajarRestantes, p.alternarPausa);
  const voltearCursor = () => {
    const objetivo = p.cartas[p.cursor];
    if (objetivo) p.manejarVolteo(objetivo.id);
  };

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <EncabezadoPartida
        jugador={p.ctx.jugador}
        dificultad={p.ctx.dificultad}
        movimientos={p.movimientos}
        segundos={p.segundos}
        pausado={p.pausado}
      />
      <GestureDetector gesture={gestos}>
        <View>
          <CuadriculaCartas
            cartas={p.cartas}
            modoInclinacion={p.ctx.modoInclinacionActivo}
            cursor={p.cursor}
            dificultad={p.ctx.dificultad}
            offsetX={p.parallax.offsetX}
            offsetY={p.parallax.offsetY}
            onVoltear={p.manejarVolteo}
          />
        </View>
      </GestureDetector>
      <ControlesJuegoBar
        pausado={p.pausado}
        modoInclinacion={p.ctx.modoInclinacionActivo}
        onAlternarPausa={p.alternarPausa}
        onBarajar={p.barajarRestantes}
        onReiniciar={p.confirmarReinicio}
        onVoltearCursor={voltearCursor}
      />
      {p.terminada ? (
        <BannerVictoria
          movimientos={p.movimientos}
          segundos={p.segundos}
          onVerRanking={() => router.push("/(tabs)/puntajes")}
        />
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 16, backgroundColor: "#0f172a", flexGrow: 1 },
  encabezado: { marginBottom: 12 },
  textoInfo: { color: "#94a3b8", fontSize: 14 },
  textoMetricas: { color: "#2dd4bf", fontSize: 18, fontWeight: "bold", marginTop: 4 },
  avisoPausa: {
    color: "#facc15",
    backgroundColor: "#422006",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    textAlign: "center"
  },
  tablero: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    backgroundColor: "#0b1120",
    borderRadius: 14,
    padding: 8
  },
  bannerVictoria: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#064e3b",
    borderWidth: 1,
    borderColor: "#10b981"
  },
  textoVictoria: { color: "#ecfdf5", fontSize: 15, fontWeight: "600", marginBottom: 10 },
  botonRanking: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  textoBotonRanking: { color: "#064e3b", fontWeight: "bold", fontSize: 14 }
});
