import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "@/src/components/AppProvider";
import { obtenerCiudadDispositivo } from "@/src/sensors/useSensoresJuego";
import type { Dificultad } from "@/src/services/juego.service";
import { filtrarYOrdenarRanking } from "@/src/services/ranking.service";

const DIFICULTADES: ReadonlyArray<Dificultad> = ["facil", "medio", "dificil"];

function FilaPuntaje(props: {
  readonly item: {
    readonly jugador: string;
    readonly ciudad: string | null;
    readonly movimientos: number;
    readonly segundos: number;
  };
  readonly index: number;
}): React.ReactElement {
  return (
    <View style={estilos.filaItem}>
      <Text style={estilos.posicion}>#{props.index + 1}</Text>
      <View style={estilos.columnaJugador}>
        <Text style={estilos.nombre}>{props.item.jugador}</Text>
        <Text style={estilos.meta}>{props.item.ciudad ?? "Global"}</Text>
      </View>
      <Text style={estilos.puntaje}>
        {props.item.movimientos} mov · {props.item.segundos} s
      </Text>
    </View>
  );
}

function FiltrosRanking(props: {
  readonly actual: Dificultad;
  readonly onSelect: (d: Dificultad) => void;
  readonly textoCiudad: string;
  readonly onToggleCiudad: () => void;
}): React.ReactElement {
  return (
    <>
      <View style={estilos.filaFiltros}>
        {DIFICULTADES.map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`Ver ranking de dificultad ${d}`}
            onPress={() => props.onSelect(d)}
            style={[estilos.chip, props.actual === d ? estilos.chipActivo : null]}
          >
            <Text style={estilos.textoChip}>{d.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Alternar filtro de ranking por ciudad actual"
        onPress={props.onToggleCiudad}
        style={estilos.botonCiudad}
      >
        <Text style={estilos.textoCiudad}>{props.textoCiudad}</Text>
      </Pressable>
    </>
  );
}

export default function PuntajesScreen(): React.ReactElement {
  const { puntajesLocales, ciudadActual, setCiudadActual } = useAppContext();
  const [filtroDif, setFiltroDif] = useState<Dificultad>("facil");
  const [soloCiudad, setSoloCiudad] = useState<boolean>(false);

  const activarFiltroCiudad = async () => {
    if (soloCiudad) {
      setSoloCiudad(false);
      return;
    }
    const ciudad = ciudadActual ?? (await obtenerCiudadDispositivo());
    if (ciudad) {
      setCiudadActual(ciudad);
      setSoloCiudad(true);
    }
  };

  const ranking = filtrarYOrdenarRanking(
    puntajesLocales,
    filtroDif,
    soloCiudad ? ciudadActual : null
  );
  const etiquetaCiudad =
    soloCiudad && ciudadActual
      ? `Filtrando por ciudad: ${ciudadActual} (Toca para ver Global)`
      : "Ranking Global (Toca para filtrar por tu ciudad)";

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Top 10 · Mejores Puntajes</Text>
      <FiltrosRanking
        actual={filtroDif}
        onSelect={setFiltroDif}
        textoCiudad={etiquetaCiudad}
        onToggleCiudad={() => void activarFiltroCiudad()}
      />
      <FlatList
        data={ranking}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={estilos.vacio}>No hay puntajes registrados en este nivel.</Text>
        }
        renderItem={({ item, index }) => <FilaPuntaje item={item} index={index} />}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, backgroundColor: "#0f172a" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#2dd4bf", marginBottom: 12 },
  filaFiltros: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155"
  },
  chipActivo: { backgroundColor: "#0f766e", borderColor: "#2dd4bf" },
  textoChip: { color: "#f8fafc", fontWeight: "bold", fontSize: 12 },
  botonCiudad: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#38bdf8"
  },
  textoCiudad: { color: "#38bdf8", fontSize: 13, textAlign: "center" },
  vacio: { color: "#94a3b8", textAlign: "center", marginTop: 24 },
  filaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8
  },
  posicion: { color: "#2dd4bf", fontWeight: "bold", width: 36, fontSize: 16 },
  columnaJugador: { flex: 1 },
  nombre: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
  meta: { color: "#94a3b8", fontSize: 12 },
  puntaje: { color: "#38bdf8", fontWeight: "bold", fontSize: 14 }
});
