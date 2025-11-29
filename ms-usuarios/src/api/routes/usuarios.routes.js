// src/api/routes/usuarios.routes.js

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

router.get('/estudiantes/:id', usuariosController.obtenerEstudiante);
router.get('/tutores/:id', usuariosController.obtenerTutor);

module.exports = router;