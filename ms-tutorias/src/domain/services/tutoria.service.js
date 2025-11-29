// ms-tutorias/src/domain/services/tutoria.service.js
const tutoriaRepository = require("../../infrastructure/repositories/tutoria.repository");
const usuariosClient = require("../../infrastructure/clients/usuarios.client");
const agendaClient = require("../../infrastructure/clients/agenda.client");
const {
  publishToQueue,
  publishTrackingEvent,
} = require("../../infrastructure/messaging/message.producer");

// Función helper para publicar tracking
const track = (cid, message, status = "INFO") => {
  publishTrackingEvent({
    service: "MS_Tutorias",
    message,
    cid,
    timestamp: new Date(),
    status,
  });
};

const solicitarTutoria = async (datosSolicitud, correlationId) => {
  const { idEstudiante, idTutor, fechaSolicitada, duracionMinutos, materia } =
    datosSolicitud;
  let nuevaTutoria;
  let idBloqueoGuardado = null; // <-- NUEVA VARIABLE PARA GUARDAR ID DE BLOQUEO

  try {
    // --- 1. Validar usuarios ---
    track(correlationId, "Validando usuarios...");
    const [estudiante, tutor] = await Promise.all([
      usuariosClient.getUsuario("estudiantes", idEstudiante, correlationId),
      usuariosClient.getUsuario("tutores", idTutor, correlationId),
    ]);
    if (!estudiante)
      throw { statusCode: 404, message: "Estudiante no encontrado" };
    if (!tutor) throw { statusCode: 404, message: "Tutor no encontrado" };
    track(correlationId, "Usuarios validados exitosamente.");

    // --- 2. Verificar agenda ---
    track(correlationId, "Verificando disponibilidad de agenda...");
    const disponible = await agendaClient.verificarDisponibilidad(
      idTutor,
      fechaSolicitada,
      correlationId
    );
    if (!disponible)
      throw { statusCode: 409, message: "Horario no disponible" };
    track(correlationId, "Agenda verificada (disponible).");

    // --- 3. Crear PENDIENTE ---
    track(correlationId, "Creando tutoría en estado PENDIENTE...");
    const tutoriaPendienteData = {
      idEstudiante,
      idTutor,
      fecha: new Date(fechaSolicitada),
      materia,
      estado: "PENDIENTE",
    };
    nuevaTutoria = await tutoriaRepository.save(tutoriaPendienteData);
    track(
      correlationId,
      `Tutoría PENDIENTE guardada (ID: ${nuevaTutoria.idtutoria}).`
    );

    // --- 4. Comandos de la Saga ---
    track(correlationId, "Bloqueando horario en agenda...");
    const payloadAgenda = {
      fechaInicio: fechaSolicitada,
      duracionMinutos,
      idEstudiante,
    };
    const bloqueoResultado = await agendaClient.bloquearAgenda(
      idTutor,
      payloadAgenda,
      correlationId
    );

    // --- GUARDAR EL ID DEL BLOQUEO PARA POSIBLE COMPENSACIÓN ---
    idBloqueoGuardado =
      bloqueoResultado.idbloqueo || bloqueoResultado.idBloqueo;
    track(
      correlationId,
      `Bloqueo de agenda exitoso. ID Bloqueo: ${idBloqueoGuardado}`
    );

    // --- 5. Actualizar tutoría con ID de bloqueo ---
    if (idBloqueoGuardado) {
      track(correlationId, "Actualizando tutoría con ID de bloqueo...");
      await tutoriaRepository.save({
        idTutoria: nuevaTutoria.idtutoria,
        idBloqueo: idBloqueoGuardado,
      });
    }

    track(correlationId, "Publicando evento de notificación en RabbitMQ...");
    const payloadNotificacion = {
      destinatario: estudiante.email,
      asunto: `Tutoría de ${materia} confirmada`,
      cuerpo: `Hola ${
        estudiante.nombrecompleto || estudiante.nombreCompleto
      }, tu tutoría con ${
        tutor.nombrecompleto || tutor.nombreCompleto
      } ha sido confirmada...`,
      correlationId: correlationId,
    };
    publishToQueue("notificaciones_email_queue", payloadNotificacion);
    track(correlationId, "Evento de notificación publicado.");

    // --- 6. Confirmar ---
    track(correlationId, "Actualizando estado a CONFIRMADA...");
    const tutoriaConfirmadaPayload = {
      idTutoria: nuevaTutoria.idtutoria,
      estado: "CONFIRMADA",
      error: null,
    };
    const tutoriaConfirmada = await tutoriaRepository.save(
      tutoriaConfirmadaPayload
    );
    track(correlationId, "Actualización a CONFIRMADA exitosa.");
    return tutoriaConfirmada;
  } catch (error) {
    // --- COMPENSACIÓN MEJORADA ---
    console.error(
      `[MS_Tutorias Service] - CID: ${correlationId} - ERROR CAPTURADO: ${error.message}`
    );
    track(correlationId, `ERROR: ${error.message}`, "ERROR");

    // --- COMPENSACIÓN: DESBLOQUEAR AGENDA SI SE BLOQUEÓ ---
    if (idBloqueoGuardado) {
      try {
        track(correlationId, "COMPENSACIÓN: Desbloqueando agenda...", "ERROR");
        await agendaClient.cancelarBloqueo(idBloqueoGuardado, correlationId);
        track(
          correlationId,
          "COMPENSACIÓN: Agenda desbloqueada exitosamente",
          "ERROR"
        );
      } catch (compError) {
        // Log adicional si falla la compensación
        track(
          correlationId,
          `ERROR CRÍTICO en compensación de agenda: ${compError.message}`,
          "ERROR"
        );
      }
    }

    // --- MARCAR COMO FALLIDA (con o sin éxito en compensación) ---
    if (nuevaTutoria && nuevaTutoria.idtutoria) {
      track(correlationId, "Marcando tutoría como FALLIDA.", "ERROR");
      const compensacionPayload = {
        idTutoria: nuevaTutoria.idtutoria,
        estado: "FALLIDA",
        error: error.message,
        idBloqueo: idBloqueoGuardado, // Guardar referencia incluso en fallo
      };
      try {
        await tutoriaRepository.save(compensacionPayload);
        track(
          correlationId,
          "Compensación (FALLIDA) guardada exitosamente.",
          "ERROR"
        );
      } catch (compensacionError) {
        track(
          correlationId,
          `¡¡ERROR CRÍTICO EN COMPENSACIÓN!!: ${compensacionError.message}`,
          "ERROR"
        );
      }
    } else if (idBloqueoGuardado) {
      // Caso especial: se creó el bloqueo pero no la tutoría PENDIENTE
      track(
        correlationId,
        "Creando registro FALLIDA sin tutoría previa.",
        "ERROR"
      );
      const tutoriaFallidaData = {
        idEstudiante,
        idTutor,
        fecha: new Date(fechaSolicitada),
        materia,
        estado: "FALLIDA",
        error: error.message,
        idBloqueo: idBloqueoGuardado,
      };
      try {
        await tutoriaRepository.save(tutoriaFallidaData);
        track(correlationId, "Registro FALLIDA creado exitosamente.", "ERROR");
      } catch (fallbackError) {
        track(
          correlationId,
          `Error creando registro FALLIDA: ${fallbackError.message}`,
          "ERROR"
        );
      }
    }

    // Relanzar el error original
    throw {
      statusCode: error.statusCode || 500,
      message: `No se pudo completar la solicitud: ${error.message}`,
    };
  }
};

module.exports = { solicitarTutoria };
