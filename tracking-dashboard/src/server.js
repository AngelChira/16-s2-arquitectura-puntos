// tracking-dashboard/src/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const amqp = require('amqplib');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 9000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'tracking_events_exchange';

// 1. Servir el HTML estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// 2. Configurar el Consumidor de RabbitMQ
const startAmqpConsumer = async () => {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Declaramos un exchange de tipo 'fanout'
        // fanout = envía a todas las colas que estén suscritas
        await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

        // Declaramos una cola anónima y exclusiva (se borra al desconectar)
        // y la vinculamos al exchange
        const { queue } = await channel.assertQueue('', { exclusive: true });
        console.log(`[Dashboard] Cola anónima creada: ${queue}`);

        await channel.bindQueue(queue, EXCHANGE_NAME, ''); // '' = routing key (ignorado en fanout)

        console.log(`[Dashboard] Esperando eventos del exchange '${EXCHANGE_NAME}'...`);

        channel.consume(queue, (msg) => {
            if (msg.content) {
                try {
                    const evento = JSON.parse(msg.content.toString());
                    console.log("[Dashboard] Evento recibido:", evento);
                    // 3. Retransmitir el evento a TODOS los clientes WebSocket
                    io.emit('tracking_event', evento);
                } catch (e) {
                    console.error("Error al parsear evento de RabbitMQ:", e);
                }
            }
        }, { noAck: true }); // noAck: true = los mensajes se borran al recibirlos

    } catch (error) {
        console.error('[Dashboard] Error al conectar/consumir de RabbitMQ:', error.message);
        setTimeout(startAmqpConsumer, 5000); // Reintentar
    }
};

// 4. Iniciar todo
server.listen(PORT, () => {
    console.log(`Dashboard de Trazabilidad corriendo en http://localhost:${PORT}`);
    startAmqpConsumer();
});