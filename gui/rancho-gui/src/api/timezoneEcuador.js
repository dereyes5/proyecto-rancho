// Configuración de timezone para Ecuador
// Quito/Ecuador está en timezone "America/Guayaquil" (ECT - Ecuador Time)
// UTC-5 (sin cambio de horario estacional)

export const TIMEZONE_ECUADOR = "America/Guayaquil";
export const LOCALE_ECUADOR = "es-EC";

// Función principal para obtener fecha/hora actual de Ecuador
export const obtenerFechaHoraEcuador = () => {
  const ahoraEcuador = new Date().toLocaleString("en-US", {timeZone: TIMEZONE_ECUADOR});
  return new Date(ahoraEcuador);
};

// Función para formatear una fecha específica a timezone Ecuador
export const convertirFechaAEcuador = (fecha) => {
  if (!fecha) return obtenerFechaHoraEcuador();
  const fechaEcuador = fecha.toLocaleString("en-US", {timeZone: TIMEZONE_ECUADOR});
  return new Date(fechaEcuador);
};

// Función para obtener fecha formateada (YYYY-MM-DD) en timezone Ecuador
export const obtenerFechaEcuadorFormateada = () => {
  const fechaEcuador = obtenerFechaHoraEcuador();
  const anio = fechaEcuador.getFullYear();
  const mes = String(fechaEcuador.getMonth() + 1).padStart(2, '0');
  const dia = String(fechaEcuador.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

// Función para obtener hora formateada (HH:MM:SS) en timezone Ecuador
export const obtenerHoraEcuadorFormateada = (fecha = null) => {
  const fechaEcuador = fecha ? convertirFechaAEcuador(fecha) : obtenerFechaHoraEcuador();
  return fechaEcuador.toLocaleTimeString(LOCALE_ECUADOR, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Validación de horario usando timezone Ecuador
export const validarHorarioEcuador = (horaLimite) => {
  if (!horaLimite) return true;

  const ahoraEcuador = obtenerFechaHoraEcuador();
  const [h, m] = horaLimite.split(':');
  const limiteEcuador = new Date(ahoraEcuador);
  limiteEcuador.setHours(parseInt(h), parseInt(m), 0, 0);

  return ahoraEcuador <= limiteEcuador;
};

console.log('✅ Configuración de timezone Ecuador inicializada');
console.log('📍 Timezone:', TIMEZONE_ECUADOR);
console.log('🌍 Locale:', LOCALE_ECUADOR);
console.log('🕐 Hora actual Ecuador:', obtenerHoraEcuadorFormateada());
console.log('📅 Fecha actual Ecuador:', obtenerFechaEcuadorFormateada());
