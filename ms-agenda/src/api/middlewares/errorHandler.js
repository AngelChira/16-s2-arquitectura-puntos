// src/api/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}: ${err.message}`);

  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Ocurrió un error inesperado en el servidor.';

  // Check for Postgres Unique Violation code
  if (err.code === '23505') {
    statusCode = 409;
    errorMessage = 'Ya existe un bloqueo para este tutor en la fecha y hora especificadas.';
  }

  res.status(statusCode).json({
    error: {
      message: errorMessage,
      statusCode: statusCode,
    },
  });
};

module.exports = errorHandler;
