const express = require("express");
const router = express.Router();
const agendaController = require("../controllers/agenda.controller");

router.get(
  "/tutores/:id_tutor/disponibilidad",
  agendaController.getDisponibilidad
);
router.post("/tutores/:id_tutor/bloquear", agendaController.postBloqueo);
router.delete("/bloqueos/:idBloqueo", agendaController.deleteBloqueo);

module.exports = router;
