-- Mision 1: Falla de Concurrencia ("Doble Reserva")
-- Solucion: Implementa una Restricción de Unicidad a nivel de base de datos.
-- Esto previene que se pueda insertar un bloqueo para el mismo tutor a la misma hora de inicio.

ALTER TABLE bloqueos
ADD CONSTRAINT unique_tutor_fecha_inicio UNIQUE (idTutor, fechaInicio);
