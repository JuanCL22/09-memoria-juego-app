import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { CartaMemoria } from "@/src/services/juego.service";

export interface CartaTableroProps {
  readonly carta: CartaMemoria;
  readonly indice: number;
  readonly esCursorInclinacion: boolean;
  readonly modoDificilArrastre: boolean;
  readonly onVoltear: (cartaId: string) => void;
}

export function CartaTablero(props: CartaTableroProps): React.ReactElement {
  const { carta, indice, esCursorInclinacion, modoDificilArrastre, onVoltear } = props;
  const visible = carta.volteada || carta.encontrada;

  const gestoTap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      onVoltear(carta.id);
    });

  const gestoPan = Gesture.Pan()
    .runOnJS(true)
    .onEnd((evento) => {
      const distancia = Math.hypot(evento.translationX, evento.translationY);
      if (modoDificilArrastre && distancia > 18) {
        onVoltear(carta.id);
      }
    });

  const gestoCompuesto = Gesture.Exclusive(gestoPan, gestoTap);

  return (
    <GestureDetector gesture={gestoCompuesto}>
      <View
        style={[
          estilos.contenedorCarta,
          visible ? estilos.cartaAbierta : estilos.cartaCerrada,
          carta.encontrada ? estilos.cartaEncontrada : null,
          esCursorInclinacion ? estilos.cartaCursor : null
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            visible
              ? `Carta ${indice + 1} descubierta ${carta.simbolo}`
              : `Voltear carta posición ${indice + 1}`
          }
          onPress={() => onVoltear(carta.id)}
          style={estilos.botonAccesible}
        >
          <Text style={estilos.simboloTexto}>{visible ? carta.simbolo : "❓"}</Text>
        </Pressable>
      </View>
    </GestureDetector>
  );
}

const estilos = StyleSheet.create({
  contenedorCarta: {
    width: "22%",
    aspectRatio: 1,
    margin: "1.5%",
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  cartaCerrada: {
    backgroundColor: "#1e293b",
    borderColor: "#334155"
  },
  cartaAbierta: {
    backgroundColor: "#0f766e",
    borderColor: "#2dd4bf"
  },
  cartaEncontrada: {
    backgroundColor: "#15803d",
    borderColor: "#4ade80"
  },
  cartaCursor: {
    borderColor: "#facc15",
    borderWidth: 3
  },
  botonAccesible: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },
  simboloTexto: {
    fontSize: 26,
    color: "#f8fafc"
  }
});
