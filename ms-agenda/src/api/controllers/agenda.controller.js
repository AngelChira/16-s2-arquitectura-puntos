// ms-agenda/src/api/controllers/agenda.controller.js
const agendaService = require("../../domain/services/agenda.service");
const { track } = require("../../infrastructure/messaging/message.producer"); // <-- IMPORTAR TRACK

const getDisponibilidad = async (req, res, next) => {
  const cid = req.correlationId; // <-- Obtener Correlation ID
  try {
    track(cid, `Verificando disponibilidad para tutor: ${req.params.id_tutor}`);
    const { id_tutor } = req.params;
    const { fechaHora } = req.query;

    if (!fechaHora) {
      throw {
        statusCode: 400,
        message: 'El parámetro "fechaHora" es requerido.',
      };
    }

    const resultado = await agendaService.verificarDisponibilidad(
      id_tutor,
      fechaHora
    );
    track(
      cid,
      `Disponibilidad para tutor ${id_tutor}: ${resultado.disponible}`
    );
    res.status(200).json(resultado);
  } catch (error) {
    track(cid, `Error en getDisponibilidad: ${error.message}`, "ERROR");
    next(error);
  }
};

const postBloqueo = async (req, res, next) => {
  const cid = req.correlationId; // <-- Obtener Correlation ID
  try {
    track(cid, `Intentando bloquear agenda para tutor: ${req.params.id_tutor}`);
    const { id_tutor } = req.params;
    const datosBloqueo = req.body;

    const nuevoBloqueo = await agendaService.crearBloqueo(
      id_tutor,
      datosBloqueo
    );
    track(
      cid,
      `Agenda bloqueada exitosamente. Bloqueo ID: ${nuevoBloqueo.idbloqueo}`
    );
    res.status(201).json(nuevoBloqueo);
  } catch (error) {
    track(cid, `Error en postBloqueo: ${error.message}`, "ERROR");
    next(error);
  }
};

const deleteBloqueo = async (req, res, next) => {
  const cid = req.correlationId;
  try {
    track(
      cid,
      `Iniciando compensación - Eliminando bloqueo: ${req.params.idBloqueo}`
    );
    const { idBloqueo } = req.params;

    const resultado = await agendaService.eliminarBloqueo(idBloqueo);
    track(cid, `Compensación exitosa - Bloqueo ${idBloqueo} eliminado`);
    res.status(200).json({
      message: "Bloqueo eliminado exitosamente durante compensación",
      idBloqueo,
    });
  } catch (error) {
    track(
      cid,
      `Error en compensación deleteBloqueo: ${error.message}`,
      "ERROR"
    );
    next(error);
  }
};

module.exports = {
  getDisponibilidad,
  postBloqueo,
  deleteBloqueo,
};
