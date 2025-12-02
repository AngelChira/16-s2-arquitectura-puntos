// // ms-tutorias/src/infrastructure/clients/usuarios.client.js
// const axios = require("axios");
// const CircuitBreaker = require("opossum");
// const { usuariosServiceUrl } = require("../../config");
// // const { track } = require("../../utils/metrics");

// const {
//   publishTrackingEvent: track,
// } = require("../messaging/message.producer");

// const circuitBreakerOptions = {
//   timeout: 1500, // 1.5 segundos de timeout
//   errorThresholdPercentage: 50, // Se abre después de que el 50% de las requests fallen
//   resetTimeout: 30000, // 30 segundos para intentar cerrarse nuevamente
//   rollingCountTimeout: 10000, // Ventana de 10 segundos para contar errores
//   rollingCountBuckets: 10, // 10 buckets en la ventana de tiempo
//   name: "ms-usuarios-circuit-breaker",
//   volumeThreshold: 4, // <-- IMPORTANTE: Mínimo de peticiones antes de calcular errorThresholdPercentage
// };

// // Crear el Circuit Breaker para la llamada a ms-usuarios
// const callMsUsuarios = async (args) => {
//   const { url, correlationId } = args;
//   const response = await axios.get(url, {
//     headers: { "X-Correlation-ID": correlationId },
//     timeout: 1500, // Timeout específico para axios también
//   });
//   return response.data;
// };

// const breaker = new CircuitBreaker(callMsUsuarios, circuitBreakerOptions);

// // Eventos del Circuit Breaker para monitoreo
// breaker.on("open", () => {
//   console.log("[CIRCUIT-BREAKER] Circuit Breaker ABIERTO para ms-usuarios");
//   // No tenemos correlationId aquí, así que solo logueamos en consola o usamos un track genérico si es necesario
// });

// breaker.on("halfOpen", () => {
//   console.log(
//     "[CIRCUIT-BREAKER] Circuit Breaker en estado HALF-OPEN para ms-usuarios"
//   );
// });

// breaker.on("close", () => {
//   console.log("[CIRCUIT-BREAKER] Circuit Breaker CERRADO para ms-usuarios");
// });

// breaker.on("failure", (error) => {
//   console.log(`[CIRCUIT-BREAKER] Fallo detectado: ${error.message}`);
// });

// breaker.on("success", () => {
//   console.log("[CIRCUIT-BREAKER] Llamada exitosa a través del Circuit Breaker");
// });

// const getUsuario = async (tipo, id, correlationId) => {
//   // Construimos la URL
//   const url = `${usuariosServiceUrl}/${tipo}/${id}`;

//   // --- LOGS DE DEPURACIÓN ---
//   console.log(
//     `[SUPER-DEBUG] Iniciando llamada a getUsuario con Correlation-ID: ${correlationId}`
//   );
//   console.log(`[SUPER-DEBUG] URL de destino: ${url}`);
//   console.log(`[SUPER-DEBUG] Tipo: ${tipo}, ID: ${id}`);
//   // --- FIN LOGS DE DEPURACIÓN ---

//   try {
//     // Usar el Circuit Breaker para hacer la llamada
//     const usuarioData = await breaker.fire({ url, correlationId });
//     console.log(`[SUPER-DEBUG] Éxito en la llamada a ${url}`);
//     return usuarioData;
//   } catch (error) {
//     // --- LOGS DE ERROR DETALLADOS ---
//     console.error(
//       `[SUPER-DEBUG] FALLO en la llamada a ${url} a través del Circuit Breaker.`
//     );

//     // Verificar si el error es por el Circuit Breaker abierto
//     if (breaker.opened) {
//       console.error(
//         "[SUPER-DEBUG] Circuit Breaker está ABIERTO - llamada rechazada"
//       );
//       track(
//         correlationId,
//         "Circuit Breaker ABIERTO para ms-usuarios - Llamada rechazada",
//         "ERROR"
//       );

//       // Puedes retornar un valor por defecto o lanzar un error específico
//       throw new Error(
//         "Servicio ms-usuarios no disponible temporalmente (Circuit Breaker abierto)"
//       );
//     }

//     if (error.response) {
//       // Este bloque se ejecuta si el servidor SÍ respondió, pero con un error (4xx, 5xx)
//       console.error(
//         `[SUPER-DEBUG] El servidor respondió con Status: ${error.response.status}`
//       );
//       console.error(
//         `[SUPER-DEBUG] Data del error:`,
//         JSON.stringify(error.response.data)
//       );
//       if (error.response.status === 404) {
//         return null;
//       }
//     } else if (error.request) {
//       // Este bloque se ejecuta si la petición se hizo pero NUNCA se recibió respuesta (error de red)
//       console.error(
//         "[SUPER-DEBUG] La petición fue enviada pero no se recibió respuesta. Error de red (timeout, DNS, etc)."
//       );
//     } else if (
//       error.code === "ECONNABORTED" ||
//       error.message.includes("timeout")
//     ) {
//       // Timeout específico
//       console.error("[SUPER-DEBUG] Timeout de la petición (1.5s) excedido");
//     } else {
//       // Este bloque se ejecuta si hubo un error al configurar la petición antes de enviarla
//       console.error(
//         "[SUPER-DEBUG] Error fatal al configurar la petición axios:",
//         error.message
//       );
//     }
//     console.error(
//       "[SUPER-DEBUG] Objeto de error completo:",
//       error.code,
//       error.message
//     );
//     // --- FIN LOGS DE ERROR DETALLADOS ---
//     throw error;
//   }
// };

// module.exports = { getUsuario };

// ms-tutorias/src/infrastructure/clients/usuarios.client.js
const axios = require("axios");
const CircuitBreaker = require("opossum");
const { usuariosServiceUrl } = require("../../config");

// --- CORRECCIÓN AQUÍ ---
// Importamos la función de tracking desde el productor de mensajes
// Usamos '../messaging' porque estamos en la carpeta 'clients' y subimos un nivel a 'infrastructure'
const {
  publishTrackingEvent: track,
} = require("../messaging/message.producer");

const circuitBreakerOptions = {
  timeout: 1500,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  name: "ms-usuarios-circuit-breaker",
  volumeThreshold: 4,
};

const callMsUsuarios = async (args) => {
  const { url, correlationId } = args;
  const response = await axios.get(url, {
    headers: { "X-Correlation-ID": correlationId },
    timeout: 1500,
  });
  return response.data;
};

const breaker = new CircuitBreaker(callMsUsuarios, circuitBreakerOptions);

// --- Eventos del Circuit Breaker (Logs) ---
breaker.on("open", () =>
  console.log("[CIRCUIT-BREAKER] Abierto para ms-usuarios")
);
breaker.on("halfOpen", () =>
  console.log("[CIRCUIT-BREAKER] Half-Open para ms-usuarios")
);
breaker.on("close", () =>
  console.log("[CIRCUIT-BREAKER] Cerrado para ms-usuarios")
);
breaker.on("fallback", () =>
  console.log("[CIRCUIT-BREAKER] Ejecutando Fallback")
);

const getUsuario = async (tipo, id, correlationId) => {
  const url = `${usuariosServiceUrl}/${tipo}/${id}`;

  try {
    const usuarioData = await breaker.fire({ url, correlationId });
    return usuarioData;
  } catch (error) {
    console.error(
      `[Cliente Usuarios] Error al obtener ${tipo}/${id}: ${error.message}`
    );

    if (breaker.opened) {
      track(
        correlationId,
        "Circuit Breaker ABIERTO para ms-usuarios - Llamada rechazada",
        "ERROR"
      );
      throw new Error(
        "Servicio ms-usuarios no disponible temporalmente (Circuit Breaker abierto)"
      );
    }

    if (error.response && error.response.status === 404) {
      return null; // Usuario no encontrado no es un error de sistema
    }

    throw error;
  }
};

module.exports = { getUsuario };
