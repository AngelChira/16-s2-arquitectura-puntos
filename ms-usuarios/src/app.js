// ms-usuarios/src/app.js
const express = require('express');
const config = require('./config'); // <-- USAR EL NUEVO CONFIG
const usuariosRouter = require('./api/routes/usuarios.routes');
const errorHandler = require('./api/middlewares/errorHandler');
const correlationIdMiddleware = require('./api/middlewares/correlationId.middleware.js');
const messageProducer = require('./infrastructure/messaging/message.producer'); // <-- IMPORTAR PRODUCTOR

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);

app.use('/usuarios', usuariosRouter);

app.use(errorHandler);

app.listen(config.port, () => { // <-- Usar config.port
    console.log(`MS_Usuarios escuchando en el puerto ${config.port}`);
    messageProducer.connect(); // <-- INICIAR CONEXIÓN A RABBITMQ
});