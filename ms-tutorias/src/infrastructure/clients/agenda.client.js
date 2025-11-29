const axios = require("axios");
const { agendaServiceUrl } = require("../../config");

const verificarDisponibilidad = async (idTutor, fechaHora, correlationId) => {
  const url = `${agendaServiceUrl}/tutores/${idTutor}/disponibilidad?fechaHora=${fechaHora}`;
  const response = await axios.get(url, {
    headers: { "X-Correlation-ID": correlationId },
  });
  return response.data.disponible;
};

const bloquearAgenda = async (idTutor, payload, correlationId) => {
  const url = `${agendaServiceUrl}/tutores/${idTutor}/bloquear`;
  // Se añade el header a la petición POST
  const response = await axios.post(url, payload, {
    headers: { "X-Correlation-ID": correlationId },
  });
  return response.data;
};

const cancelarBloqueo = async (idBloqueo, correlationId) => {
  try {
    const url = `${agendaServiceUrl}/bloqueos/${idBloqueo}`;
    const response = await axios.delete(url, {
      headers: { "X-Correlation-ID": correlationId },
    });
    return response.data;
  } catch (error) {
    // Log adicional para errores en compensación
    console.error(
      `Error en compensación para bloqueo ${idBloqueo}:`,
      error.message
    );
    throw error;
  }
};

// La función ahora acepta correlationId como parámetro
const getUsuario = async (tipo, id, correlationId) => {
  try {
    const url = `${usuariosServiceUrl}/${tipo}/${id}`;
    // Se añade el header a la petición de axios
    const response = await axios.get(url, {
      headers: { "X-Correlation-ID": correlationId },
    });
    return response.data;
  } catch (error) {
    // Manejo básico del error, puedes personalizarlo según tus necesidades
    throw error;
  }
};
module.exports = {
  verificarDisponibilidad,
  bloquearAgenda,
  getUsuario,
  cancelarBloqueo,
};
