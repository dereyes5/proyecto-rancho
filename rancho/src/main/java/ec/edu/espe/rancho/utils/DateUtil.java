package ec.edu.espe.rancho.utils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Utilidad para manejo de fechas con zona horaria de Ecuador
 * Asegura que todas las fechas se generen consistentemente en la zona horaria local
 */
public class DateUtil {

    // Zona horaria de Ecuador
    private static final ZoneId ECUADOR_ZONE = ZoneId.of("America/Guayaquil");

    /**
     * Obtiene la fecha actual en la zona horaria de Ecuador
     * @return LocalDate con la fecha actual en Ecuador
     */
    public static LocalDate nowEcuador() {
        return ZonedDateTime.now(ECUADOR_ZONE).toLocalDate();
    }

    /**
     * Método de respaldo que usa la zona horaria del sistema
     * Mantiene compatibilidad pero se recomienda usar nowEcuador()
     * @return LocalDate con la fecha actual del sistema
     */
    @Deprecated
    public static LocalDate nowSystem() {
        return LocalDate.now();
    }
}
