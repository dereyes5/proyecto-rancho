# Configuración de Timezone para Ecuador

## Implementación del Horario de Ecuador (Quito)

Esta aplicación está configurada para usar el horario oficial de Ecuador (America/Guayaquil) que corresponde a UTC-5.

### Archivos Principales

#### 1. `src/api/timezoneEcuador.js`
- **Propósito**: Configuración centralizada del timezone de Ecuador
- **Funciones principales**:
  - `obtenerFechaHoraEcuador()`: Obtiene la fecha/hora actual en timezone Ecuador
  - `obtenerHoraEcuadorFormateada()`: Formatea hora en formato ecuatoriano
  - `validarHorarioEcuador()`: Valida horarios límite usando timezone Ecuador

#### 2. `src/api/utils.js`
- **Propósito**: Utilidades generales que usan el timezone Ecuador
- **Funciones actualizadas**:
  - `obtenerFechaAyer()`: Calcula fecha de ayer en timezone Ecuador
  - `obtenerFechaHoy()`: Obtiene fecha de hoy en timezone Ecuador
  - `validarHorario()`: Usa timezone Ecuador para validaciones

#### 3. `src/api/useRaciones.js`
- **Propósito**: Composable principal que maneja fechas en timezone Ecuador
- **Funciones actualizadas**:
  - Generación de PDFs con fechas en horario Ecuador
  - Validaciones de horario usando timezone Ecuador
  - Gestión de fechas de raciones en horario local

### Funciones Clave

```javascript
// Obtener fecha/hora actual de Ecuador
const fechaEcuador = obtenerFechaHoraEcuador();

// Formatear hora en formato ecuatoriano
const horaFormateada = obtenerHoraEcuadorFormateada();

// Validar horario límite usando timezone Ecuador
const puedeOperar = validarHorarioEcuador('14:30');
```

### Beneficios de la Implementación

1. **Consistencia**: Toda la aplicación usa el mismo timezone
2. **Precisión**: Las operaciones se realizan en horario local de Ecuador
3. **Mantenibilidad**: Configuración centralizada fácil de actualizar
4. **Escalabilidad**: Fácil agregar otros timezones si es necesario

### Zonas de Uso

- **Validaciones de horario**: Los límites se evalúan en horario Ecuador
- **Generación de reportes**: PDFs muestran fechas/horas en horario local
- **Logs y auditoría**: Timestamps en horario Ecuador para consistencia
- **Operaciones de personal**: Cambios registrados en horario local

### Notas Técnicas

- Ecuador no cambia horario (no tiene horario de verano)
- UTC-5 es constante durante todo el año
- El timezone "America/Guayaquil" cubre todo Ecuador
- Compatible con todos los navegadores modernos

### Para Desarrolladores

Al agregar nuevas funcionalidades que manejen fechas/horas:

1. Importar las funciones de `timezoneEcuador.js`
2. Usar `obtenerFechaHoraEcuador()` en lugar de `new Date()`
3. Para formateo, usar las utilidades proporcionadas
4. Documentar cualquier excepción o caso especial

### Testing

Para probar la funcionalidad de timezone:

1. Cambiar la hora del sistema a diferente timezone
2. Verificar que la aplicación sigue usando horario Ecuador
3. Confirmar que los logs muestran horas consistentes
4. Validar que las validaciones de horario funcionan correctamente
