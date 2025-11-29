// ms-usuarios/src/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'user_usuarios',
    password: process.env.DB_PASSWORD || 'password_usuarios',
    database: process.env.DB_NAME || 'db_usuarios',
});

// Opcional: Probar conexión al iniciar
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar con la base de datos PostgreSQL:', err.stack);
        // Considera terminar el proceso si la conexión es crítica al inicio
        // process.exit(1);
    } else {
        console.log('Conexión exitosa a la base de datos PostgreSQL (ms-usuarios)');
        release(); // Liberar el cliente
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool, // Exportar el pool si necesitas transacciones
};