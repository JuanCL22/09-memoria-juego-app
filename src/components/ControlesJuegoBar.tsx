import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface ControlesJuegoBarProps {
  readonly pausado: boolean;
  readonly modoInclinacion: boolean;
  readonly onAlternarPausa: () => void;
  readonly onBarajar: () => void;
  readonly onReiniciar: () => void;
  readonly onVoltearCursor: () => void;
}

export function ControlesJuegoBar(props: ControlesJuegoBarProps): React.ReactElement {
  return (
    <View style={estilos.barra}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.pausado ? "Reanudar partida" : "Pausar partida"}
        onPress={props.onAlternarPausa}
        style={estilos.boton}
      >
        <Text style={estilos.texto}>{props.pausado ? "Reanudar" : "Pausar"}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Barajar cartas restantes"
        onPress={props.onBarajar}
        style={estilos.boton}
      >
        <Text style={estilos.texto}>Barajar</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reiniciar partida"
        onPress={props.onReiniciar}
        style={estilos.botonReiniciar}
      >
        <Text style={estilos.texto}>Reiniciar</Text>
      </Pressable>

      {props.modoInclinacion ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltear carta seleccionada por inclinación"
          onPress={props.onVoltearCursor}
          style={estilos.botonCursor}
        >
          <Text style={estilos.textoCursor}>Voltear cursor</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8
  },
  boton: {
    backgroundColor: "#1e293b",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155"
  },
  botonReiniciar: {
    backgroundColor: "#7f1d1d",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  botonCursor: {
    backgroundColor: "#facc15",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  texto: { color: "#f8fafc", fontSize: 13, fontWeight: "600" },
  textoCursor: { color: "#0f172a", fontSize: 13, fontWeight: "bold" }
});
