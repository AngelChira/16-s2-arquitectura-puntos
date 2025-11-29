const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

// --- Configuración de Swagger ---

// 1. Opciones para la generación del spec
const swaggerOptions = {
  definition: {
    // Info principal de la API
    openapi: "3.0.0",
    info: {
      title: "API de Tutorías",
      version: "1.0.0",
      description:
        "Documentación de los endpoints del microservicio de tutorías.",
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1", // Ajusta el puerto y la base de tu ruta
      },
    ],
  },
  // 2. Rutas a los archivos que contienen las anotaciones JSDoc para generar el spec
  // Esto buscará en la carpeta 'src' y sus subcarpetas archivos que terminen en .js
  apis: ["./dcos/**/*.js"],
};

// 3. Genera la especificación a partir de las opciones
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// 4. Sirve la documentación
// Asume que 'app' es tu instancia de Express
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Fin de Configuración ---

// ... Tu código de Express continúa aquí ...
