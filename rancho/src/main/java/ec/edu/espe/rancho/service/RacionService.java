package ec.edu.espe.rancho.service;

import ec.edu.espe.rancho.controller.RacionController;
import ec.edu.espe.rancho.dto.RacionPersonalDTO;
import ec.edu.espe.rancho.dto.RacionSimpleDTO;
import ec.edu.espe.rancho.model.Qr;
import ec.edu.espe.rancho.model.Racion;
import ec.edu.espe.rancho.repository.PersonalRepository;
import ec.edu.espe.rancho.repository.QrRepository;
import ec.edu.espe.rancho.repository.RacionRepository;
import ec.edu.espe.rancho.utils.DateUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RacionService {

    private final QrRepository qrRepository;
    private final RacionRepository racionRepository;

    @Autowired
    private PersonalRepository personalRepository;

    public RacionService(QrRepository qrRepository, RacionRepository racionRepository) {
        this.qrRepository = qrRepository;
        this.racionRepository = racionRepository;
    }

    @Transactional
    public List<RacionSimpleDTO> guardarOActualizarRaciones(List<RacionController.RacionRequest> requests) {
        if (requests.isEmpty()) return List.of();

        LocalDate fechaActual = DateUtil.nowEcuador();

        // Obtener todos los idPersonal de las solicitudes
        List<Integer> idsPersonal = requests.stream()
                .map(RacionController.RacionRequest::getIdPersonal)
                .collect(Collectors.toList());

        // Consultar todas las raciones existentes para los idPersonal y la fecha actual
        List<Racion> racionesExistentes = racionRepository.findAllByFechaAndIdPersonalIn(fechaActual, idsPersonal);

        // Mapear las raciones existentes por idPersonal
        Map<Integer, Racion> racionesMap = racionesExistentes.stream()
                .collect(Collectors.toMap(r -> r.getIdqr().getIdusuario().getIdpersonal().getId(), r -> r));

        // Consultar todos los QR activos para los idPersonal en una sola llamada
        List<Qr> qrsActivos = qrRepository.findActiveQrByIdPersonalIn(idsPersonal);
        Map<Integer, Qr> qrMap = qrsActivos.stream()
                .collect(Collectors.toMap(q -> q.getIdusuario().getIdpersonal().getId(), q -> q));

        // Procesar las solicitudes
        List<Racion> racionesParaGuardar = requests.stream().map(req -> {
            Racion racionExistente = racionesMap.get(req.getIdPersonal());
            if (racionExistente != null) {
                // Actualizar ración existente
                racionExistente.setDesayuno(req.getDesayuno());
                racionExistente.setAlmuerzo(req.getAlmuerzo());
                racionExistente.setMerienda(req.getMerienda());
                return racionExistente;
            } else {
                // Obtener el QR del Map en vez de consultar por cada uno
                Qr qr = qrMap.get(req.getIdPersonal());
                if (qr == null) {
                    throw new RuntimeException("No se encontró QR activo para el personal con ID: " + req.getIdPersonal());
                }
                // Crear nueva ración
                Racion nuevaRacion = new Racion(null, req.getDesayuno(), req.getAlmuerzo(), req.getMerienda());
                nuevaRacion.setFecha(fechaActual);
                nuevaRacion.setIdqr(qr);
                return nuevaRacion;
            }
        }).collect(Collectors.toList());

        // Guardar todas las raciones en una sola operación
        List<Racion> guardadas = racionRepository.saveAll(racionesParaGuardar);

        // Mapear a DTO simple para evitar selects extra al serializar
        return guardadas.stream().map(r -> new RacionSimpleDTO(
                r.getId(),
                r.getIdqr() != null ? r.getIdqr().getId() : null,
                r.getIdqr() != null && r.getIdqr().getIdusuario() != null && r.getIdqr().getIdusuario().getIdpersonal() != null ? r.getIdqr().getIdusuario().getIdpersonal().getId() : null,
                r.getDesayuno(),
                r.getAlmuerzo(),
                r.getMerienda()
        )).collect(Collectors.toList());
    }

    public List<RacionPersonalDTO> obtenerRacionesPorFecha(LocalDate fecha, String unidad) {
        return racionRepository.findAllRacionPersonalByFechaAndUnidad(fecha, unidad);
    }

    public Map<String, Map<String, Integer>> obtenerRacionesConsumidasPorUnidad(LocalDate fecha) {
        List<String> unidades = personalRepository.findDistinctUnidades();
        List<Racion> raciones = racionRepository.findAllByFecha(fecha);
        Map<String, Map<String, Integer>> resultado = new java.util.HashMap<>();

        // Inicializar todas las unidades en 0, excluyendo valores null
        for (String unidad : unidades) {
            if (unidad != null && !unidad.trim().isEmpty()) {
                Map<String, Integer> consumos = new java.util.HashMap<>();
                consumos.put("desayunos", 0);
                consumos.put("almuerzos", 0);
                consumos.put("meriendas", 0);
                resultado.put(unidad, consumos);
            }
        }

        // Procesar raciones
        for (Racion r : raciones) {
            String unidad = null;
            try {
                unidad = r.getIdqr().getIdusuario().getIdpersonal().getUnidad();
            } catch (Exception e) {
                continue;
            }

            // Si la unidad es null o vacía, ignorar esta ración
            if (unidad == null || unidad.trim().isEmpty()) {
                continue;
            }

            Map<String, Integer> consumos = resultado.get(unidad);
            if (consumos == null) continue;

            // Tanto 1 como -1 cuentan como "1" en la suma, solo 0 no cuenta
            if (r.getDesayuno() == 1 || r.getDesayuno() == -1) {
                consumos.put("desayunos", consumos.get("desayunos") + 1);
            }
            if (r.getAlmuerzo() == 1 || r.getAlmuerzo() == -1) {
                consumos.put("almuerzos", consumos.get("almuerzos") + 1);
            }
            if (r.getMerienda() == 1 || r.getMerienda() == -1) {
                consumos.put("meriendas", consumos.get("meriendas") + 1);
            }
        }

        return resultado;
    }
}
