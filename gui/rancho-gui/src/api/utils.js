// Importar configuración centralizada de timezone Ecuador
import {
  obtenerFechaHoraEcuador,
  obtenerHoraEcuadorFormateada,
  validarHorarioEcuador
} from './timezoneEcuador.js';

// Utilidades para formateo de fechas
export const formatearFecha = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const obtenerFechaAyer = () => {
  // Usar timezone de Ecuador
  const ayerEcuador = obtenerFechaEcuador();
  ayerEcuador.setDate(ayerEcuador.getDate() - 1);
  return formatearFecha(ayerEcuador);
};

export const obtenerFechaHoy = () => {
  // Usar timezone de Ecuador
  return formatearFecha(obtenerFechaEcuador());
};

// Utilidades para localStorage
export const getToken = () => localStorage.getItem('token');
export const getUsuario = () => localStorage.getItem('usuario');
export const getRol = () => localStorage.getItem('rol');

export const setToken = (token) => localStorage.setItem('token', token);
export const setUsuario = (usuario) => localStorage.setItem('usuario', usuario);
export const setRol = (rol) => localStorage.setItem('rol', rol);

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
};

// Re-exportar funciones de timezone Ecuador para compatibilidad
export const obtenerFechaEcuador = obtenerFechaHoraEcuador;
export const formatearHoraEcuador = obtenerHoraEcuadorFormateada;

// Utilidades para validación
export const validarHorario = validarHorarioEcuador;

// Utilidades para optimización de datos
export const procesarRacionesData = (raciones) => {
  return raciones.map(r => ({
    ...r,
    // Pre-calculamos los valores para evitar accesos anidados repetitivos
    _personal: r.idqr.idusuario.idpersonal,
    _cedula: r.idqr.idusuario.idpersonal.cedula,
    _nombre: r.idqr.idusuario.idpersonal.apellidonombre,
    _grado: r.idqr.idusuario.idpersonal.grado,
    _unidad: r.idqr.idusuario.idpersonal.unidad,
    _novedad: r.idqr.idusuario.idpersonal.novedad,
    // Para PantallaRanchero - valores originales
    desayunoOriginal: r.desayuno,
    almuerzoOriginal: r.almuerzo,
    meriendaOriginal: r.merienda
  }));
};

// Utilidades para filtrado rápido
export const filtrarRaciones = (raciones, busqueda) => {
  if (!busqueda) return raciones;

  const b = busqueda.toLowerCase();
  return raciones.filter(r => {
    return r._nombre.toLowerCase().includes(b) ||
           r._cedula.includes(b) ||
           (r._novedad || '').toLowerCase().includes(b);
  });
};

// Utilidades para ordenamiento optimizado
export const ordenarRaciones = (raciones, campo, ascendente) => {
  if (!campo) return raciones;

  return [...raciones].sort((a, b) => {
    // Usar los campos pre-calculados
    const valA = a[`_${campo}`] || '';
    const valB = b[`_${campo}`] || '';

    const resultado = String(valA).localeCompare(String(valB));
    return ascendente ? resultado : -resultado;
  });
};

// Utilidades para debouncing (para optimizar búsquedas)
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Utilidad para throttle (para optimizar scroll y resize)
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Utilidades para manejo de errores
export const manejarError = (error, toast, mensajeCustom = null) => {
  console.error('Error:', error);

  if (error.response?.status === 401) {
    clearAuth();
    window.location.href = '/login';
    return;
  }

  const mensaje = mensajeCustom ||
    error.response?.data?.message ||
    error.message ||
    'Ha ocurrido un error inesperado';

  toast.error(mensaje);
};

// Utilidad para generar payloads optimizados
export const generarPayloadRaciones = (raciones, incluyeOriginal = false) => {
  return raciones.map(r => {
    const payload = {
      idPersonal: r._personal.id,
      desayuno: r.desayuno,
      almuerzo: r.almuerzo,
      merienda: r.merienda
    };

    // Para PantallaRanchero, usar valores originales cuando están bloqueados
    if (incluyeOriginal) {
      payload.desayuno = r.desayunoOriginal > 0 ? r.desayuno : r.desayunoOriginal;
      payload.almuerzo = r.almuerzoOriginal > 0 ? r.almuerzo : r.almuerzoOriginal;
      payload.merienda = r.meriendaOriginal > 0 ? r.merienda : r.meriendaOriginal;
    }

    return payload;
  });
};
