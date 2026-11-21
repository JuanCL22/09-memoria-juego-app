import path from "node:path";

const PATRONES_ARCHIVOS_PROHIBIDOS = [
  /(^|[\\/])\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /firebase-adminsdk.*\.json$/i,
  /\.keystore$/i,
  /\.jks$/i,
  /(^|[\\/])\.claude([\\/]|$)/i
];

const PATRONES_COMANDOS_PROHIBIDOS = [
  /\b(sudo|curl|wget)\b/i,
  /\/usr\/bin\/(curl|wget|sudo)/i,
  /\brm\s+-rf\b/i,
  /\bgit\s+push\s+(--force|-f)\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bvercel\s+env\s+pull\b/i,
  /\.env(\.|\b)/i,
  /\bCANARIO\b/i
];

export function evaluarAccion(payload, directorioRaiz = process.cwd()) {
  if (!payload || typeof payload !== "object") {
    return { permitido: true, motivo: "" };
  }

  const entrada = payload.tool_input ?? {};
  const rutaObjetivo = entrada.file_path ?? entrada.path ?? "";

  if (typeof rutaObjetivo === "string" && rutaObjetivo.trim() !== "") {
    if (rutaObjetivo.startsWith("~")) {
      return {
        permitido: false,
        motivo: "Bloqueado por hook PreToolUse: acceso a directorio personal (~) prohibido."
      };
    }

    const absoluta = path.resolve(directorioRaiz, rutaObjetivo);
    const raizNormalizada = path.resolve(directorioRaiz);
    const relativa = path.relative(raizNormalizada, absoluta);

    if (relativa.startsWith("..") || path.isAbsolute(relativa)) {
      return {
        permitido: false,
        motivo: "Bloqueado por hook PreToolUse: no se permite salir de la carpeta del repositorio."
      };
    }

    for (const patron of PATRONES_ARCHIVOS_PROHIBIDOS) {
      if (patron.test(relativa) || patron.test(rutaObjetivo)) {
        return {
          permitido: false,
          motivo: `Bloqueado por hook PreToolUse: archivo protegido (${rutaObjetivo}).`
        };
      }
    }
  }

  const comando = entrada.command ?? "";
  if (typeof comando === "string" && comando.trim() !== "") {
    if (/(^|\s)(\.\.([\\/]|$)|~[\\/])/i.test(comando)) {
      return {
        permitido: false,
        motivo: "Bloqueado por hook PreToolUse: comando intenta acceder fuera del repositorio."
      };
    }

    for (const patron of PATRONES_COMANDOS_PROHIBIDOS) {
      if (patron.test(comando)) {
        return {
          permitido: false,
          motivo: `Bloqueado por hook PreToolUse: comando restringido (${comando}).`
        };
      }
    }
  }

  return { permitido: true, motivo: "" };
}

async function ejecutarDesdeStdin() {
  const partes = [];
  for await (const chunk of process.stdin) {
    partes.push(Buffer.from(chunk));
  }
  const texto = Buffer.concat(partes).toString("utf8").trim();
  if (!texto) {
    process.exit(0);
  }

  try {
    const payload = JSON.parse(texto);
    const resultado = evaluarAccion(payload);
    if (!resultado.permitido) {
      process.stderr.write(`${resultado.motivo}\n`);
      process.exit(2);
    }
    process.exit(0);
  } catch {
    process.stderr.write("Bloqueado por hook PreToolUse: entrada JSON inválida.\n");
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  await ejecutarDesdeStdin();
}
