package ec.edu.espe.rancho.service;

import ec.edu.espe.rancho.model.Qr;
import ec.edu.espe.rancho.model.Usuario;
import ec.edu.espe.rancho.repository.QrRepository;
import ec.edu.espe.rancho.repository.UsuarioRepository;
import ec.edu.espe.rancho.utils.DateUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
public class QrService {

    private final QrRepository qrRepository;
    private final UsuarioRepository usuarioRepository;

    public QrService(QrRepository qrRepository, UsuarioRepository usuarioRepository) {
        this.qrRepository = qrRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void actualizarQrMensualmente() {
        LocalDate fechaActual = DateUtil.nowEcuador();
        if (fechaActual.getDayOfMonth() == 1) { // Verificar si es el primer día del mes
            ejecutarActualizacionQr();
        }
    }

    @Transactional
    public String ejecutarActualizacionQr() {
        LocalDate fechaActual = DateUtil.nowEcuador();
        YearMonth mesActual = YearMonth.from(fechaActual);
        LocalDate fechaExpiracion = mesActual.atEndOfMonth(); // Último día del mes

        // Obtener todos los usuarios
        List<Usuario> todosLosUsuarios = usuarioRepository.findAll();

        int qrsActualizados = 0;
        int qrsCreados = 0;

        for (Usuario usuario : todosLosUsuarios) {
            // Buscar QR existente para el usuario
            Qr qrExistente = qrRepository.findByIdusuario_Id(usuario.getId());

            if (qrExistente != null) {
                // Si existe, actualizar QR data y fecha de expiración
                qrExistente.setQrData(UUID.randomUUID().toString());
                qrExistente.setExpirationDate(fechaExpiracion);
                qrRepository.save(qrExistente);
                qrsActualizados++;
            } else {
                // Si no existe, crear nuevo QR
                Qr nuevoQr = new Qr();
                nuevoQr.setIdusuario(usuario);
                nuevoQr.setQrData(UUID.randomUUID().toString());
                nuevoQr.setCreatedAt(fechaActual);
                nuevoQr.setExpirationDate(fechaExpiracion);
                nuevoQr.setIsActive((byte) 1);
                qrRepository.save(nuevoQr);
                qrsCreados++;
            }
        }

        return String.format("Actualización completada: %d QRs actualizados, %d QRs nuevos creados",
                           qrsActualizados, qrsCreados);
    }
}