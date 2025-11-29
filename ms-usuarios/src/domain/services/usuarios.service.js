// src/domain/services/usuarios.service.js

const usuariosRepository = require('../../infrastructure/repositories/usuarios.repository');

const getEstudiante = async (id) => {
    const estudiante = await usuariosRepository.findEstudianteById(id);
    if (!estudiante) {
        // Lanzamos un error que será capturado por el controlador/middleware
        const error = new Error('Estudiante no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return estudiante;
};

const getTutor = async (id) => {
    const tutor = await usuariosRepository.findTutorById(id);
    if (!tutor) {
        const error = new Error('Tutor no encontrado');
        error.statusCode = 404;
        throw error;
    }
    return tutor;
};

module.exports = {
    getEstudiante,
    getTutor
};