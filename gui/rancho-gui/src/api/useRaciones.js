import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import ApiService from '../api/apiService.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { obtenerFechaEcuador, formatearHoraEcuador } from './utils.js';
import { obtenerFechaHoraEcuador } from './timezoneEcuador.js';

// Importar logos
import brigadaLogo from '../assets/brigada_logo.png';
import gae44Logo from '../assets/gae44_logo.png';
import iwiasLogo from '../assets/iwias.png';

export function useRaciones() {
  const toast = useToast();

  // Estado reactivo
  const raciones = ref([]);
  const busqueda = ref('');
  const cargando = ref(false);
  const unidades = ref([]);
  const racionSeleccionada = ref(null);
  const fechaRacionesActuales = ref(null); // Para saber qué fecha estamos usando
  const yaSeGuardoHoy = ref(false); // Para saber si ya se guardó al menos una vez hoy
  const racionesOriginales = ref(new Map()); // Para trackear los valores originales después del primer guardado
  const racionesEnCache = ref(new Map()); // Para PantallaRanchero: cambios solo en memoria

  // Ordenamiento
  const orden = ref({ campo: '', ascendente: true });
  const camposOrden = [
    { key: 'cedula', label: 'Cédula' },
    { key: 'apellidonombre', label: 'Nombre' },
    { key: 'grado', label: 'Grado' },
    { key: 'unidad', label: 'Unidad' },
    { key: 'novedad', label: 'Novedad' },
    { key: 'subunidad', label: 'Subunidad' }
  ];

  // Computed properties optimizadas
  const racionesFiltradas = computed(() => {
    if (!busqueda.value) return raciones.value;

    const b = busqueda.value.toLowerCase();

    // Usar los campos pre-calculados para mejor performance
    return raciones.value.filter(r => {
      return r._nombre.toLowerCase().includes(b) ||
             r._cedula.includes(b) ||
             (r._novedad || '').toLowerCase().includes(b) ||
             (r._subunidad || '').toLowerCase().includes(b);
    });
  });

  const racionesOrdenadas = computed(() => {
    const campo = orden.value.campo;
    if (!campo) return racionesFiltradas.value;

    return [...racionesFiltradas.value].sort((a, b) => {
      // Mapear los campos de ordenamiento a los campos pre-calculados
      let valA, valB;

      switch (campo) {
        case 'apellidonombre':
          valA = a._nombre || '';
          valB = b._nombre || '';
          break;
        case 'cedula':
          valA = a._cedula || '';
          valB = b._cedula || '';
          break;
        case 'grado':
          valA = a._grado || '';
          valB = b._grado || '';
          break;
        case 'unidad':
          valA = a._unidad || '';
          valB = b._unidad || '';
          break;
        case 'novedad':
          valA = a._novedad || '';
          valB = b._novedad || '';
          break;
        case 'subunidad':
          valA = a._subunidad || '';
          valB = b._subunidad || '';
          break;
        default:
          valA = a[campo] || '';
          valB = b[campo] || '';
      }

      const resultado = String(valA).localeCompare(String(valB));
      return orden.value.ascendente ? resultado : -resultado;
    });
  });

  // Utilidades de fecha usando timezone de Ecuador
  const formatearFecha = (fecha) => {
    // Si no se proporciona fecha, usar la fecha actual de Ecuador
    const fechaEcuador = fecha || obtenerFechaEcuador();
    const anio = fechaEcuador.getFullYear();
    const mes = String(fechaEcuador.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaEcuador.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const fechaHoy = formatearFecha();
  const fechaAyer = (() => {
    const ayerEcuador = obtenerFechaEcuador();
    ayerEcuador.setDate(ayerEcuador.getDate() - 1);
    return formatearFecha(ayerEcuador);
  })();

  // Métodos principales
  const buscarRacionesHaciaAtras = async (unidad, diasMaximos = 7) => {
    const hoyEcuador = obtenerFechaEcuador();

    for (let i = 0; i < diasMaximos; i++) {
      const fecha = new Date(hoyEcuador);
      fecha.setDate(hoyEcuador.getDate() - i);
      const fechaStr = formatearFecha(fecha);

      try {
        // Determinar si se debe normalizar las raciones consumidas (-1 -> 1)
        const esHoy = fechaStr === fechaHoy;
        const normalizarConsumidas = !esHoy;

        console.log(`🔍 Buscando raciones para ${fechaStr}:`, {
          esHoy,
          normalizarConsumidas,
          iteration: i
        });

        const data = await ApiService.obtenerRaciones(fechaStr, unidad, true, normalizarConsumidas);
        if (data && data.length > 0) {
          fechaRacionesActuales.value = fechaStr;

          // Si encontramos raciones del día de hoy, significa que ya se guardó al menos una vez
          if (fechaStr === fechaHoy) {
            yaSeGuardoHoy.value = true;
            console.log(`Raciones encontradas para HOY (${fechaStr}) - Ya se guardó anteriormente`);
          } else {
            yaSeGuardoHoy.value = false;
            console.log(`Raciones encontradas para fecha anterior (${fechaStr}) - Aún no se ha guardado hoy`);
          }

          // Guardar el estado original si ya se guardó hoy
          if (yaSeGuardoHoy.value) {
            // Necesitamos esperar un tick para que las raciones se asignen
            setTimeout(() => guardarEstadoOriginal(), 0);
          }

          return data;
        }
      } catch (error) {
        console.log(`No hay raciones para la fecha: ${fechaStr}`);
      }
    }

    console.log('No se encontraron raciones en los últimos', diasMaximos, 'días');
    fechaRacionesActuales.value = fechaHoy; // Si no se encuentra nada, usar fecha de hoy
    yaSeGuardoHoy.value = false; // Definitivamente no se ha guardado hoy
    return [];
  };

  const inicializarRaciones = async (unidad) => {
    if (!unidad) return;

    cargando.value = true;
    try {
      // Buscar hacia atrás hasta encontrar raciones
      // Este método automáticamente determinará si ya se guardó hoy o no
      const data = await buscarRacionesHaciaAtras(unidad);
      raciones.value = data;
      return data;
    } catch (error) {
      toast.error('Error al inicializar raciones');
      console.error(error);
      return [];
    } finally {
      cargando.value = false;
    }
  };

  const obtenerRaciones = async (fecha, unidad, useCache = true) => {
    if (!fecha || !unidad) return;

    cargando.value = true;
    try {
      // Determinar si se debe normalizar las raciones consumidas (-1 -> 1)
      // Solo para el día actual mantenemos los -1 para mostrar como "consumidas"
      // Para días anteriores/futuros, convertimos -1 a 1 para permitir obtener raciones
      const esHoy = fecha === fechaHoy;
      const normalizarConsumidas = !esHoy;

      console.log(`📅 Obteniendo raciones para ${fecha}:`, {
        esHoy,
        normalizarConsumidas,
        fechaHoy
      });

      const data = await ApiService.obtenerRaciones(fecha, unidad, useCache, normalizarConsumidas);
      raciones.value = data;
      fechaRacionesActuales.value = fecha;

      // Determinar si ya se guardó hoy basado en la fecha obtenida
      if (fecha === fechaHoy && data && data.length > 0) {
        yaSeGuardoHoy.value = true;
        // Guardar el estado original si ya se guardó hoy
        setTimeout(() => guardarEstadoOriginal(), 0);
      } else {
        yaSeGuardoHoy.value = false;
      }

      return data;
    } catch (error) {
      toast.error('Error al obtener raciones');
      console.error(error);
      return [];
    } finally {
      cargando.value = false;
    }
  };

  const obtenerUnidades = async () => {
    try {
      const data = await ApiService.obtenerUnidades();
      unidades.value = data;
      return data;
    } catch (error) {
      toast.error('Error al obtener unidades');
      console.error(error);
      return [];
    }
  };

  const guardarCambios = async (validarHorario = false, horaLimite = null) => {
    if (validarHorario && horaLimite && !estaDentroDeHorario(horaLimite)) {
      toast.warning('Ya no se pueden guardar raciones después de la hora límite');
      return false;
    }

    // Obtener solo las raciones que han sido modificadas (o todas si es la primera vez)
    const racionesAGuardar = obtenerRacionesModificadas();

    const payload = racionesAGuardar.map(r => ({
      idPersonal: r._idPersonal,
      idqr: r._idqr,
      desayuno: r.desayuno,
      almuerzo: r.almuerzo,
      merienda: r.merienda
    }));

    if (!payload.length) {
      if (yaSeGuardoHoy.value) {
        toast.info('No hay cambios para guardar');
      } else {
        toast.error('No hay datos para guardar');
      }
      return false;
    }

    // Mostrar mensaje de progreso
    cargando.value = true;
    if (yaSeGuardoHoy.value) {
      toast.info(`Guardando ${payload.length} registro(s) modificado(s)... Por favor espera.`);
    } else {
      // Mensaje especial para el primer guardado del día
      toast.warning('Primer guardado del día: Puede tardar unos minutos. Por favor espera.', {
        timeout: 8000
      });
    }

    try {
      await ApiService.guardarRaciones(payload);
      toast.success(`Cambios guardados correctamente (${payload.length} registro(s))`);

      // Marcar que ya se guardó hoy y actualizar fecha actual
      yaSeGuardoHoy.value = true;
      fechaRacionesActuales.value = fechaHoy;

      // Guardar el nuevo estado original para futuras comparaciones
      guardarEstadoOriginal();

      return true;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        if (!yaSeGuardoHoy.value) {
          toast.error('El primer guardado está tardando más de lo esperado. Puede haberse guardado correctamente. Verifica antes de intentar nuevamente.');
        } else {
          toast.error('La operación está tardando más de lo esperado, pero puede haberse guardado correctamente');
        }
      } else {
        toast.error('Error al guardar cambios');
      }
      console.error('Error al guardar cambios:', error);
      return false;
    } finally {
      cargando.value = false;
    }
  };

  // Método específico para ranchero (con validación de originales)
  const guardarCambiosRanchero = async (horaLimite = null) => {
    if (horaLimite && !estaDentroDeHorario(horaLimite)) {
      toast.warning('Ya no se pueden guardar raciones después de la hora límite');
      return false;
    }

    // Solo incluir las raciones que se pueden editar (que tenían valor original > 0)
    const racionesEditables = racionesFiltradas.value.filter(r =>
      r.desayunoOriginal > 0 || r.almuerzoOriginal > 0 || r.meriendaOriginal > 0
    );

    // Aplicar lógica de modificaciones solo a las raciones editables
    let racionesAGuardar;
    if (!yaSeGuardoHoy.value) {
      // Primera vez: todas las raciones editables
      racionesAGuardar = racionesEditables;
    } else {
      // Guardados posteriores: solo las editables que han cambiado
      racionesAGuardar = racionesEditables.filter(r => {
        const original = racionesOriginales.value.get(r._idPersonal);
        if (!original) return true; // Si no existe en originales, es nueva

        return (
          r.desayuno !== original.desayuno ||
          r.almuerzo !== original.almuerzo ||
          r.merienda !== original.merienda
        );
      });
    }

    const payload = racionesAGuardar.map(r => ({
      idPersonal: r._idPersonal,
      idqr: r._idqr,
      desayuno: r.desayunoOriginal > 0 ? r.desayuno : r.desayunoOriginal,
      almuerzo: r.almuerzoOriginal > 0 ? r.almuerzo : r.almuerzoOriginal,
      merienda: r.meriendaOriginal > 0 ? r.merienda : r.meriendaOriginal
    }));

    if (!payload.length) {
      if (yaSeGuardoHoy.value) {
        toast.info('No hay cambios para guardar');
      } else {
        toast.error('No hay datos para guardar');
      }
      return false;
    }

    // Mostrar mensaje de progreso
    cargando.value = true;
    if (yaSeGuardoHoy.value) {
      toast.info(`Guardando ${payload.length} registro(s) modificado(s)... Por favor espera.`);
    } else {
      toast.info('Guardando raciones... Por favor espera.');
    }

    try {
      await ApiService.guardarRaciones(payload);
      toast.success(`Cambios guardados correctamente (${payload.length} registro(s))`);

      // Marcar que ya se guardó hoy y actualizar fecha actual
      yaSeGuardoHoy.value = true;
      fechaRacionesActuales.value = fechaHoy;

      // Guardar el nuevo estado original para futuras comparaciones
      guardarEstadoOriginal();

      return true;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        toast.error('La operación está tardando más de lo esperado, pero puede haberse guardado correctamente');
      } else {
        toast.error('Error al guardar cambios');
      }
      console.error('Error al guardar cambios:', error);
      return false;
    } finally {
      cargando.value = false;
    }
  };

  const toggleTodos = (comida) => {
    const todosSeleccionados = racionesFiltradas.value.every(r => r[comida] === 1);
    racionesFiltradas.value.forEach(r => {
      r[comida] = todosSeleccionados ? 0 : 1;
    });
  };

  const ordenarPor = (campo) => {
    if (orden.value.campo === campo) {
      orden.value.ascendente = !orden.value.ascendente;
    } else {
      orden.value = { campo, ascendente: true };
    }
  };

  const seleccionarRacion = (racion) => {
    // Si la ración ya está seleccionada, deseleccionarla
    if (racionSeleccionada.value && racionSeleccionada.value._idPersonal === racion._idPersonal) {
      racionSeleccionada.value = null;
    } else {
      // Si no está seleccionada o es una ración diferente, seleccionarla
      racionSeleccionada.value = racion;
    }
  };

  // Función para guardar el estado original de las raciones
  const guardarEstadoOriginal = () => {
    racionesOriginales.value.clear();
    raciones.value.forEach(r => {
      racionesOriginales.value.set(r._idPersonal, {
        desayuno: r.desayuno,
        almuerzo: r.almuerzo,
        merienda: r.merienda
      });
    });
  };

  // Función para detectar qué raciones han cambiado
  const obtenerRacionesModificadas = () => {
    if (!yaSeGuardoHoy.value) {
      // Primera vez: devolver todas las raciones filtradas
      return racionesFiltradas.value;
    }

    // Guardados posteriores: solo las que han cambiado
    return racionesFiltradas.value.filter(r => {
      const original = racionesOriginales.value.get(r._idPersonal);
      if (!original) return true; // Si no existe en originales, es nueva

      return (
        r.desayuno !== original.desayuno ||
        r.almuerzo !== original.almuerzo ||
        r.merienda !== original.merienda
      );
    });
  };

  // ==================== MÉTODOS ESPECÍFICOS PARA PANTALLA RANCHERO ====================

  // Clave para localStorage basada en unidad y fecha
  const obtenerClaveLocalStorage = (unidad, fecha) => {
    return `raciones_ranchero_${unidad}_${fecha}`;
  };

  // Guardar cambios en localStorage
  const guardarCambiosEnLocalStorage = (unidad, fecha) => {
    if (!unidad || !fecha) return;

    const clave = obtenerClaveLocalStorage(unidad, fecha);
    const cambios = Object.fromEntries(racionesEnCache.value.entries());

    try {
      localStorage.setItem(clave, JSON.stringify(cambios));
      console.log(`Cambios guardados en localStorage para ${unidad} - ${fecha}`);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  };

  // Cargar cambios desde localStorage
  const cargarCambiosDesdeLocalStorage = (unidad, fecha) => {
    if (!unidad || !fecha) return;

    const clave = obtenerClaveLocalStorage(unidad, fecha);

    try {
      const cambiosGuardados = localStorage.getItem(clave);
      if (cambiosGuardados) {
        const cambios = JSON.parse(cambiosGuardados);
        racionesEnCache.value = new Map(Object.entries(cambios));
        console.log(`Cambios cargados desde localStorage para ${unidad} - ${fecha}`);
        return true;
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
    }
    return false;
  };

  // Aplicar cambios cargados desde localStorage a las raciones
  const aplicarCambiosDesdeLocalStorage = () => {
    raciones.value.forEach(r => {
      const cambiosEnMemoria = racionesEnCache.value.get(r._idPersonal.toString());
      if (cambiosEnMemoria) {
        r.desayuno = cambiosEnMemoria.desayuno;
        r.almuerzo = cambiosEnMemoria.almuerzo;
        r.merienda = cambiosEnMemoria.merienda;
      }
    });
  };

  // Limpiar localStorage para una unidad y fecha específica
  const limpiarLocalStorage = (unidad, fecha) => {
    if (!unidad || !fecha) return;

    const clave = obtenerClaveLocalStorage(unidad, fecha);
    localStorage.removeItem(clave);
    console.log(`localStorage limpiado para ${unidad} - ${fecha}`);
  };

  // Inicializar raciones para PantallaRanchero (guardar copia en memoria)
  const inicializarRacionesRanchero = async (unidad) => {
    if (!unidad) return;

    cargando.value = true;
    try {
      // Obtener datos de la base de datos
      const data = await buscarRacionesHaciaAtras(unidad);
      raciones.value = data;

      // Intentar cargar cambios previos desde localStorage
      const fechaActual = fechaRacionesActuales.value || fechaHoy;
      const hayCambiosGuardados = cargarCambiosDesdeLocalStorage(unidad, fechaActual);

      if (hayCambiosGuardados) {
        // Aplicar los cambios cargados a las raciones
        aplicarCambiosDesdeLocalStorage();
        toast.info('Cambios anteriores restaurados desde memoria local');
      } else {
        // Si no hay cambios guardados, inicializar con datos originales
        racionesEnCache.value.clear();
        data.forEach(r => {
          racionesEnCache.value.set(r._idPersonal.toString(), {
            desayuno: r.desayuno,
            almuerzo: r.almuerzo,
            merienda: r.merienda
          });
        });
      }

      return data;
    } catch (error) {
      toast.error('Error al inicializar raciones');
      console.error(error);
      return [];
    } finally {
      cargando.value = false;
    }
  };

  // Aplicar cambios solo en memoria (no guardar en base de datos)
  const aplicarCambioEnMemoria = (idPersonal, campo, valor) => {
    // Actualizar en el array de raciones para la UI
    const racion = raciones.value.find(r => r._idPersonal === idPersonal);
    if (racion) {
      racion[campo] = valor;
    }

    // Actualizar en el caché de memoria
    const idPersonalStr = idPersonal.toString();
    const racionCache = racionesEnCache.value.get(idPersonalStr);
    if (racionCache) {
      racionCache[campo] = valor;
    } else {
      // Si no existe en caché, crear nueva entrada
      racionesEnCache.value.set(idPersonalStr, {
        desayuno: campo === 'desayuno' ? valor : (racion?.desayuno || 0),
        almuerzo: campo === 'almuerzo' ? valor : (racion?.almuerzo || 0),
        merienda: campo === 'merienda' ? valor : (racion?.merienda || 0)
      });
    }

    // Guardar automáticamente en localStorage después de cada cambio
    const unidadActual = localStorage.getItem('unidadRanchero'); // Necesitamos guardar la unidad
    const fechaActual = fechaRacionesActuales.value || fechaHoy;
    if (unidadActual && fechaActual) {
      guardarCambiosEnLocalStorage(unidadActual, fechaActual);
    }
  };

  // Obtener raciones con cambios aplicados (para PDF y visualización)
  const obtenerRacionesConCambios = () => {
    return raciones.value.map(r => {
      const cambiosEnMemoria = racionesEnCache.value.get(r._idPersonal.toString());
      if (cambiosEnMemoria) {
        return {
          ...r,
          desayuno: cambiosEnMemoria.desayuno,
          almuerzo: cambiosEnMemoria.almuerzo,
          merienda: cambiosEnMemoria.merienda
        };
      }
      return r;
    });
  };

  // Resetear cambios en memoria (volver a los valores originales de la base)
  const resetearCambiosMemoria = () => {
    // Limpiar localStorage
    const unidadActual = localStorage.getItem('unidadRanchero');
    const fechaActual = fechaRacionesActuales.value || fechaHoy;
    if (unidadActual && fechaActual) {
      limpiarLocalStorage(unidadActual, fechaActual);
    }

    // Limpiar caché en memoria
    racionesEnCache.value.clear();

    // Recargar datos originales en las raciones
    raciones.value.forEach(r => {
      // Los valores originales están en r.desayunoOriginal, etc.
      r.desayuno = r.desayunoOriginal;
      r.almuerzo = r.almuerzoOriginal;
      r.merienda = r.meriendaOriginal;

      // Actualizar el caché con los valores originales
      racionesEnCache.value.set(r._idPersonal.toString(), {
        desayuno: r.desayunoOriginal,
        almuerzo: r.almuerzoOriginal,
        merienda: r.meriendaOriginal
      });
    });

    // Guardar el estado resetead en localStorage
    if (unidadActual && fechaActual) {
      guardarCambiosEnLocalStorage(unidadActual, fechaActual);
    }

    toast.info('Cambios revertidos a los valores originales');
  };

  // Función helper para configurar el header con logos y título
  const configurarHeaderPDF = (doc, titulo) => {
    const pageWidth = doc.internal.pageSize.width;

    // Configurar tamaño de logos (todos del mismo tamaño)
    const logoWidth = 25;
    const logoHeight = 25;
    const logoY = 10;

    // Posiciones para los logos (distribuidos equitativamente)
    const leftX = 15;
    const centerX = (pageWidth - logoWidth) / 2;
    const rightX = pageWidth - logoWidth - 15;

    try {
      // Logo izquierdo (Brigada)
      doc.addImage(brigadaLogo, 'PNG', leftX, logoY, logoWidth, logoHeight);

      // Logo centro (GAE44)
      doc.addImage(gae44Logo, 'PNG', centerX, logoY, logoWidth, logoHeight);

      // Logo derecho (IWIAS)
      doc.addImage(iwiasLogo, 'PNG', rightX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Error al cargar logos:', error);
    }

    // Título centrado debajo de los logos
    const titleY = logoY + logoHeight + 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');

    // Centrar el título
    const titleWidth = doc.getTextWidth(titulo);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(titulo, titleX, titleY);

    // Retornar la posición Y donde debe comenzar el contenido
    return titleY + 10;
  };

  // Exportar PDF con cambios en memoria para PantallaRanchero (estilo compacto Excel-like)
  const exportarPDFRanchero = async (titulo, nombreArchivo, incluirTotal = true) => {
    let precios = {};

    // Obtener precios desde la API si se incluyen totales
    if (incluirTotal) {
      try {
        const preciosData = await ApiService.obtenerPrecios();
        console.log('Precios obtenidos de la API (exportarPDFRanchero):', preciosData);
        precios = preciosData.reduce((acc, item) => {
          acc[item.comida] = item.precio;
          return acc;
        }, {});
        console.log('Precios procesados (exportarPDFRanchero):', precios);
      } catch (error) {
        console.error('Error al obtener precios:', error);
        toast.error('Error al obtener precios para el PDF');
        return;
      }
    }

    const doc = new jsPDF(); // Modo vertical (portrait)

    // Usar las raciones con cambios aplicados en memoria
    const racionesParaPDF = obtenerRacionesConCambios();

    // Obtener la unidad de las raciones para generar el título
    const unidadFromData = racionesParaPDF.length > 0 ? racionesParaPDF[0]._unidad : '';
    const tituloAutomatico = `CONFRONTA DIARIA DEL ${unidadFromData}`;

    // Configurar header con logos y título centrado
    const startY = configurarHeaderPDF(doc, tituloAutomatico);

    const racionesFiltradas = racionesParaPDF.filter(r => {
      if (!busqueda.value) return true;
      const b = busqueda.value.toLowerCase();
      return r._nombre.toLowerCase().includes(b) ||
             r._cedula.includes(b) ||
             (r._novedad || '').toLowerCase().includes(b) ||
             (r._subunidad || '').toLowerCase().includes(b);
    });

    const body = racionesFiltradas.map(r => {
      // Para el PDF, convertir -1 a 1 (consumido se muestra como 1 en el reporte)
      const desayunoNum = Number(r.desayuno) === -1 ? 1 : (Number(r.desayuno) || 0);
      const almuerzoNum = Number(r.almuerzo) === -1 ? 1 : (Number(r.almuerzo) || 0);
      const meriendaNum = Number(r.merienda) === -1 ? 1 : (Number(r.merienda) || 0);

      // Truncar texto largo para evitar desbordamiento
      const truncarTexto = (texto, maxLength = 12) => {
        if (!texto) return '';
        return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
      };

      const fila = [
        r._cedula,
        r._nombre,
        r._grado,
        r._unidad,
        truncarTexto(r._novedad || '', 12), // Limitar novedad a 12 caracteres
        truncarTexto(r._subunidad || '', 12), // Limitar subunidad a 12 caracteres
        desayunoNum,
        almuerzoNum,
        meriendaNum
      ];

      if (incluirTotal) {
        // Precio individual por cada comida usando precios de la API
        const precioDesayuno = desayunoNum * (precios.desayuno || 0);
        const precioAlmuerzo = almuerzoNum * (precios.almuerzo || 0);
        const precioMerienda = meriendaNum * (precios.merienda || 0);
        const total = precioDesayuno + precioAlmuerzo + precioMerienda;

        // Debug para la primera fila
        if (r === racionesFiltradas[0]) {
          console.log('Debug primera fila (exportarPDFRanchero):');
          console.log('- Registro completo:', r);
          console.log('- Raciones originales:', { desayuno: r.desayuno, almuerzo: r.almuerzo, merienda: r.merienda });
          console.log('- Raciones convertidas para PDF:', { desayuno: desayunoNum, almuerzo: almuerzoNum, merienda: meriendaNum });
          console.log('- Tipos de raciones:', { desayuno: typeof r.desayuno, almuerzo: typeof r.almuerzo, merienda: typeof r.merienda });
          console.log('- Precios unitarios:', { desayuno: precios.desayuno, almuerzo: precios.almuerzo, merienda: precios.merienda });
          console.log('- Precios calculados:', { precioDesayuno, precioAlmuerzo, precioMerienda, total });
        }

        fila.push(
          `$${precioDesayuno.toFixed(2)}`,
          `$${precioAlmuerzo.toFixed(2)}`,
          `$${precioMerienda.toFixed(2)}`,
          `$${total.toFixed(2)}`
        );
      }

      return fila;
    });

    // Agregar filas de totales si se incluyen totales (exportarPDFRanchero)
    if (incluirTotal) {
      // Calcular totales por comida
      let totalDesayunos = 0;
      let totalAlmuerzos = 0;
      let totalMeriendas = 0;
      let totalGeneral = 0;
      let totalPrecioDesayunos = 0;
      let totalPrecioAlmuerzos = 0;
      let totalPrecioMeriendas = 0;

      body.forEach(fila => {
        // Sumar cantidades de comidas (columnas 6, 7, 8)
        totalDesayunos += Number(fila[6]) || 0;
        totalAlmuerzos += Number(fila[7]) || 0;
        totalMeriendas += Number(fila[8]) || 0;

        // Sumar totales monetarios (columna 12)
        const totalFila = parseFloat(fila[12].replace('$', ''));
        totalGeneral += totalFila;

        // Sumar precios por comida (columnas 9, 10, 11)
        totalPrecioDesayunos += parseFloat(fila[9].replace('$', ''));
        totalPrecioAlmuerzos += parseFloat(fila[10].replace('$', ''));
        totalPrecioMeriendas += parseFloat(fila[11].replace('$', ''));
      });

      // Insertar filas separadoras y de totales
      const filaSeparadora = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
      body.push(filaSeparadora);

      // Fila de totales de cantidades
      const filaTotalCantidades = [
        '', 'TOTAL DESAYUNOS', '', '', '', '',
        totalDesayunos.toString(), // Total desayunos
        '', '',
        `$${totalPrecioDesayunos.toFixed(2)}`, // Total precio desayunos
        '', '', ''
      ];
      body.push(filaTotalCantidades);

      const filaTotalAlmuerzos = [
        '', 'TOTAL ALMUERZOS', '', '', '', '',
        '',
        totalAlmuerzos.toString(), // Total almuerzos
        '',
        '',
        `$${totalPrecioAlmuerzos.toFixed(2)}`, // Total precio almuerzos
        '', ''
      ];
      body.push(filaTotalAlmuerzos);

      const filaTotalMeriendas = [
        '', 'TOTAL MERIENDAS', '', '', '', '',
        '', '',
        totalMeriendas.toString(), // Total meriendas
        '', '',
        `$${totalPrecioMeriendas.toFixed(2)}`, // Total precio meriendas
        ''
      ];
      body.push(filaTotalMeriendas);

      // Fila separadora antes del total general
      body.push(filaSeparadora);

      // Fila de total general
      const filaTotalGeneral = [
        '', 'TOTAL GENERAL', '', '', '', '',
        totalDesayunos.toString(), // Total todas las comidas
        totalAlmuerzos.toString(),
        totalMeriendas.toString(),
        `$${totalPrecioDesayunos.toFixed(2)}`,
        `$${totalPrecioAlmuerzos.toFixed(2)}`,
        `$${totalPrecioMeriendas.toFixed(2)}`,
        `$${totalGeneral.toFixed(2)}`
      ];
      body.push(filaTotalGeneral);
    }

    const headers = ['Cédula', 'Nombre', 'Grado', 'Unidad', 'Novedad', 'Subunidad', 'D', 'A', 'M'];
    if (incluirTotal) {
      headers.push('P.Des', 'P.Alm', 'P.Mer', 'Total');
    }

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body,
      styles: {
        fontSize: 4.5, // Letra aún más pequeña para máxima densidad
        cellPadding: 0.6, // Padding reducido
        lineWidth: 0.03,
        lineColor: [100, 100, 100],
        halign: 'center', // Centrar el contenido de las celdas
        overflow: 'linebreak' // Truncar texto que no quepa
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 4.5, // Fuente consistente
        fontStyle: 'bold',
        cellPadding: 0.6, // Padding reducido
        halign: 'center' // Centrar headers
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' }, // Cédula
        1: { cellWidth: 25, halign: 'left' }, // Nombre
        2: { cellWidth: 10, halign: 'center' }, // Grado
        3: { cellWidth: 15, halign: 'center' }, // Unidad
        4: { cellWidth: 18, halign: 'center' }, // Novedad
        5: { cellWidth: 18, halign: 'center' }, // Subunidad
        6: { cellWidth: 6, halign: 'center' }, // D
        7: { cellWidth: 6, halign: 'center' }, // A
        8: { cellWidth: 6, halign: 'center' }, // M
        9: { cellWidth: 12, halign: 'right' }, // P.Des
        10: { cellWidth: 12, halign: 'right' }, // P.Alm
        11: { cellWidth: 12, halign: 'right' }, // P.Mer
        12: { cellWidth: 14, halign: 'right' }  // Total
      },
      theme: 'grid',
      tableLineWidth: 0.03,
      tableWidth: 'auto', // Ancho automático para centrar la tabla
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: 0,
      margin: { top: startY, left: 8, right: 8, bottom: 40 }, // Margen inferior mayor para firmas
      // Configuración para manejar páginas adicionales
      didDrawPage: function (data) {
        // Para páginas después de la primera, ajustar el margen superior
        if (data.pageNumber > 1) {
          // En páginas adicionales usar margen superior menor
          data.settings.margin.top = 10;
        }      }
    });

    // Agregar los tres pies de firma justo después del final de la tabla
    const pageWidth = doc.internal.pageSize.width;
    const firmaY = doc.lastAutoTable.finalY + 15; // Posición justo después de la tabla

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    // Firma izquierda
    const firmaIzquierda = 'Clase encargado';
    const lineaIzquierda = '_'.repeat(20);
    doc.text(lineaIzquierda, 20, firmaY);
    const firmaIzquierdaX = 20 + (doc.getTextWidth(lineaIzquierda) - doc.getTextWidth(firmaIzquierda)) / 2;
    doc.text(firmaIzquierda, firmaIzquierdaX, firmaY + 8);

    // Firma centro
    const firmaCentro = 'Oficial de personal';
    const lineaCentro = '_'.repeat(20);
    const centroX = (pageWidth - doc.getTextWidth(lineaCentro)) / 2;
    doc.text(lineaCentro, centroX, firmaY);
    const firmaCentroX = (pageWidth - doc.getTextWidth(firmaCentro)) / 2;
    doc.text(firmaCentro, firmaCentroX, firmaY + 8);

    // Firma derecha
    const firmaDerecha = 'Comandante de unidad';
    const lineaDerecha = '_'.repeat(20);
    const derechaX = pageWidth - doc.getTextWidth(lineaDerecha) - 20;
    doc.text(lineaDerecha, derechaX, firmaY);
    const firmaDerechaX = derechaX + (doc.getTextWidth(lineaDerecha) - doc.getTextWidth(firmaDerecha)) / 2;
    doc.text(firmaDerecha, firmaDerechaX, firmaY + 8);

    doc.save(nombreArchivo);
  };

  // Utilidad para validación de horario usando timezone de Ecuador
  const estaDentroDeHorario = (horaLimite) => {
    if (!horaLimite) return true;

    // Usar hora de Ecuador en lugar de hora local
    const ahoraEcuador = obtenerFechaEcuador();
    const [h, m] = horaLimite.split(':');
    const limiteEcuador = new Date(ahoraEcuador);
    limiteEcuador.setHours(parseInt(h), parseInt(m), 0, 0);

    console.log('=== VALIDACIÓN HORARIO useRaciones (Ecuador) ===');
    console.log('Hora actual Ecuador:', formatearHoraEcuador(ahoraEcuador));
    console.log('Hora límite configurada:', horaLimite);
    console.log('Hora límite procesada:', formatearHoraEcuador(limiteEcuador));
    console.log('¿Dentro del horario?', ahoraEcuador <= limiteEcuador);
    console.log('================================================');

    return ahoraEcuador <= limiteEcuador;
  };

  // Exportación a PDF optimizada (estilo compacto Excel-like con columnas de precio por comida)
  const exportarPDF = async (titulo, nombreArchivo, incluirTotal = true) => {
    let precios = {};

    // Obtener precios desde la API si se incluyen totales
    if (incluirTotal) {
      try {
        const preciosData = await ApiService.obtenerPrecios();
        console.log('Precios obtenidos de la API (exportarPDF):', preciosData);
        precios = preciosData.reduce((acc, item) => {
          acc[item.comida] = item.precio;
          return acc;
        }, {});
        console.log('Precios procesados (exportarPDF):', precios);
      } catch (error) {
        console.error('Error al obtener precios:', error);
        toast.error('Error al obtener precios para el PDF');
        return;
      }
    }

    const doc = new jsPDF(); // Modo vertical (portrait)

    // Obtener la unidad de las raciones para generar el título
    const unidadFromData = racionesFiltradas.value.length > 0 ? racionesFiltradas.value[0]._unidad : '';
    const tituloAutomatico = `CONFRONTA DIARIA DEL ${unidadFromData}`;

    // Configurar header con logos y título centrado
    const startY = configurarHeaderPDF(doc, tituloAutomatico);

    const body = racionesFiltradas.value.map(r => {
      // Para el PDF, convertir -1 a 1 (consumido se muestra como 1 en el reporte)
      const desayunoNum = Number(r.desayuno) === -1 ? 1 : (Number(r.desayuno) || 0);
      const almuerzoNum = Number(r.almuerzo) === -1 ? 1 : (Number(r.almuerzo) || 0);
      const meriendaNum = Number(r.merienda) === -1 ? 1 : (Number(r.merienda) || 0);

      // Truncar texto largo para evitar desbordamiento
      const truncarTexto = (texto, maxLength = 12) => {
        if (!texto) return '';
        return texto.length > maxLength ? texto.substring(0, maxLength) + '...' : texto;
      };

      const fila = [
        r._cedula,
        r._nombre,
        r._grado,
        r._unidad,
        truncarTexto(r._novedad || '', 12), // Limitar novedad a 12 caracteres
        truncarTexto(r._subunidad || '', 12), // Limitar subunidad a 12 caracteres
        desayunoNum,
        almuerzoNum,
        meriendaNum
      ];

      if (incluirTotal) {
        // Precio individual por cada comida usando precios de la API
        const precioDesayuno = desayunoNum * (precios.desayuno || 0);
        const precioAlmuerzo = almuerzoNum * (precios.almuerzo || 0);
        const precioMerienda = meriendaNum * (precios.merienda || 0);
        const total = precioDesayuno + precioAlmuerzo + precioMerienda;

        // Debug para la primera fila
        if (r === racionesFiltradas.value[0]) {
          console.log('Debug primera fila (exportarPDF):');
          console.log('- Registro completo:', r);
          console.log('- Raciones originales:', { desayuno: r.desayuno, almuerzo: r.almuerzo, merienda: r.merienda });
          console.log('- Raciones convertidas para PDF:', { desayuno: desayunoNum, almuerzo: almuerzoNum, merienda: meriendaNum });
          console.log('- Tipos de raciones:', { desayuno: typeof r.desayuno, almuerzo: typeof r.almuerzo, merienda: typeof r.merienda });
          console.log('- Precios unitarios:', { desayuno: precios.desayuno, almuerzo: precios.almuerzo, merienda: precios.merienda });
          console.log('- Precios calculados:', { precioDesayuno, precioAlmuerzo, precioMerienda, total });
        }

        fila.push(
          `$${precioDesayuno.toFixed(2)}`,
          `$${precioAlmuerzo.toFixed(2)}`,
          `$${precioMerienda.toFixed(2)}`,
          `$${total.toFixed(2)}`
        );
      }

      return fila;
    });

    // Agregar filas de totales si se incluyen totales (exportarPDF)
    if (incluirTotal) {
      // Calcular totales por comida
      let totalDesayunos = 0;
      let totalAlmuerzos = 0;
      let totalMeriendas = 0;
      let totalGeneral = 0;
      let totalPrecioDesayunos = 0;
      let totalPrecioAlmuerzos = 0;
      let totalPrecioMeriendas = 0;

      body.forEach(fila => {
        // Sumar cantidades de comidas (columnas 6, 7, 8)
        totalDesayunos += Number(fila[6]) || 0;
        totalAlmuerzos += Number(fila[7]) || 0;
        totalMeriendas += Number(fila[8]) || 0;

        // Sumar totales monetarios (columna 12)
        const totalFila = parseFloat(fila[12].replace('$', ''));
        totalGeneral += totalFila;

        // Sumar precios por comida (columnas 9, 10, 11)
        totalPrecioDesayunos += parseFloat(fila[9].replace('$', ''));
        totalPrecioAlmuerzos += parseFloat(fila[10].replace('$', ''));
        totalPrecioMeriendas += parseFloat(fila[11].replace('$', ''));
      });

      // Insertar filas separadoras y de totales
      const filaSeparadora = ['', '', '', '', '', '', '', '', '', '', '', '', ''];
      body.push(filaSeparadora);

      // Fila de totales de cantidades
      const filaTotalCantidades = [
        '', 'TOTAL DESAYUNOS', '', '', '', '',
        totalDesayunos.toString(), // Total desayunos
        '', '',
        `$${totalPrecioDesayunos.toFixed(2)}`, // Total precio desayunos
        '', '', ''
      ];
      body.push(filaTotalCantidades);

      const filaTotalAlmuerzos = [
        '', 'TOTAL ALMUERZOS', '', '', '', '',
        '',
        totalAlmuerzos.toString(), // Total almuerzos
        '',
        '',
        `$${totalPrecioAlmuerzos.toFixed(2)}`, // Total precio almuerzos
        '', ''
      ];
      body.push(filaTotalAlmuerzos);

      const filaTotalMeriendas = [
        '', 'TOTAL MERIENDAS', '', '', '', '',
        '', '',
        totalMeriendas.toString(), // Total meriendas
        '', '',
        `$${totalPrecioMeriendas.toFixed(2)}`, // Total precio meriendas
        ''
      ];
      body.push(filaTotalMeriendas);

      // Fila separadora antes del total general
      body.push(filaSeparadora);

      // Fila de total general
      const filaTotalGeneral = [
        '', 'TOTAL GENERAL', '', '', '', '',
        totalDesayunos.toString(), // Total todas las comidas
        totalAlmuerzos.toString(),
        totalMeriendas.toString(),
        `$${totalPrecioDesayunos.toFixed(2)}`,
        `$${totalPrecioAlmuerzos.toFixed(2)}`,
        `$${totalPrecioMeriendas.toFixed(2)}`,
        `$${totalGeneral.toFixed(2)}`
      ];
      body.push(filaTotalGeneral);
    }

    const headers = ['Cédula', 'Nombre', 'Grado', 'Unidad', 'Novedad', 'Subunidad', 'D', 'A', 'M'];
    if (incluirTotal) {
      headers.push('P.Des', 'P.Alm', 'P.Mer', 'Total');
    }

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body,
      styles: {
        fontSize: 4.5, // Letra aún más pequeña para máxima densidad
        cellPadding: 0.6, // Padding reducido
        lineWidth: 0.03,
        lineColor: [100, 100, 100],
        halign: 'center', // Centrar el contenido de las celdas
        overflow: 'linebreak' // Truncar texto que no quepa
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 4.5, // Fuente consistente
        fontStyle: 'bold',
        cellPadding: 0.6, // Padding reducido
        halign: 'center' // Centrar headers
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center' }, // Cédula
        1: { cellWidth: 25, halign: 'left' }, // Nombre
        2: { cellWidth: 10, halign: 'center' }, // Grado
        3: { cellWidth: 15, halign: 'center' }, // Unidad
        4: { cellWidth: 18, halign: 'center' }, // Novedad
        5: { cellWidth: 18, halign: 'center' }, // Subunidad
        6: { cellWidth: 6, halign: 'center' }, // D
        7: { cellWidth: 6, halign: 'center' }, // A
        8: { cellWidth: 6, halign: 'center' }, // M
        9: { cellWidth: 12, halign: 'right' }, // P.Des
        10: { cellWidth: 12, halign: 'right' }, // P.Alm
        11: { cellWidth: 12, halign: 'right' }, // P.Mer
        12: { cellWidth: 14, halign: 'right' }  // Total
      },
      theme: 'grid',
      tableLineWidth: 0.03,
      tableWidth: 'auto', // Ancho automático para centrar la tabla
      horizontalPageBreak: true,
      horizontalPageBreakRepeat: 0,
      margin: { top: startY, left: 8, right: 8, bottom: 40 }, // Margen inferior mayor para firmas
      // Configuración para manejar páginas adicionales
      didDrawPage: function (data) {
        // Para páginas después de la primera, ajustar el margen superior
        if (data.pageNumber > 1) {
          // En páginas adicionales usar margen superior menor
          data.settings.margin.top = 10;
        }      }
    });

    // Agregar los tres pies de firma justo después del final de la tabla
    const pageWidth = doc.internal.pageSize.width;
    const firmaY = doc.lastAutoTable.finalY + 15; // Posición justo después de la tabla

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');

    // Firma izquierda
    const firmaIzquierda = 'Clase encargado';
    const lineaIzquierda = '_'.repeat(20);
    doc.text(lineaIzquierda, 20, firmaY);
    const firmaIzquierdaX = 20 + (doc.getTextWidth(lineaIzquierda) - doc.getTextWidth(firmaIzquierda)) / 2;
    doc.text(firmaIzquierda, firmaIzquierdaX, firmaY + 8);

    // Firma centro
    const firmaCentro = 'Oficial de personal';
    const lineaCentro = '_'.repeat(20);
    const centroX = (pageWidth - doc.getTextWidth(lineaCentro)) / 2;
    doc.text(lineaCentro, centroX, firmaY);
    const firmaCentroX = (pageWidth - doc.getTextWidth(firmaCentro)) / 2;
    doc.text(firmaCentro, firmaCentroX, firmaY + 8);

    // Firma derecha
    const firmaDerecha = 'Comandante de unidad';
    const lineaDerecha = '_'.repeat(20);
    const derechaX = pageWidth - doc.getTextWidth(lineaDerecha) - 20;
    doc.text(lineaDerecha, derechaX, firmaY);
    const firmaDerechaX = derechaX + (doc.getTextWidth(lineaDerecha) - doc.getTextWidth(firmaDerecha)) / 2;
    doc.text(firmaDerecha, firmaDerechaX, firmaY + 8);

    doc.save(nombreArchivo);
  };

  // Exportar PDF consolidado de raciones consumidas por unidad
  const exportarPDFConsolidado = async (fecha, titulo, nombreArchivo) => {
    let precios = {};
    let datosConsumidas = {};

    try {
      // Obtener precios desde la API
      const preciosData = await ApiService.obtenerPrecios();
      console.log('Precios obtenidos de la API (exportarPDFConsolidado):', preciosData);
      precios = preciosData.reduce((acc, item) => {
        acc[item.comida] = item.precio;
        return acc;
      }, {});
      console.log('Precios procesados (exportarPDFConsolidado):', precios);

      // Obtener datos de raciones consumidas
      datosConsumidas = await ApiService.obtenerRacionesConsumidas(fecha);
      console.log('Datos de raciones consumidas obtenidos:', datosConsumidas);
    } catch (error) {
      console.error('Error al obtener datos para PDF consolidado:', error);
      toast.error('Error al obtener datos para generar el PDF consolidado');
      return;
    }

    const doc = new jsPDF(); // Modo vertical (portrait)

    // Configurar header con logos y título centrado
    const tituloCompleto = `REPORTE CONSOLIDADO DE RACIONES CONSUMIDAS - ${fecha}`;
    const startY = configurarHeaderPDF(doc, tituloCompleto);

    // Preparar datos para la tabla
    const headers = [
      'Unidad',
      'Desayunos',
      'P. Desayuno',
      'Almuerzos',
      'P. Almuerzo',
      'Meriendas',
      'P. Merienda',
      'Total ($)'
    ];

    const body = [];
    let totalDesayunos = 0;
    let totalAlmuerzos = 0;
    let totalMeriendas = 0;
    let totalGeneral = 0;

    // Procesar cada unidad
    Object.keys(datosConsumidas).sort().forEach(unidad => {
      const datos = datosConsumidas[unidad];

      // Calcular precios
      const precioDesayunos = datos.desayunos * (precios.desayuno || 0);
      const precioAlmuerzos = datos.almuerzos * (precios.almuerzo || 0);
      const precioMeriendas = datos.meriendas * (precios.merienda || 0);
      const totalUnidad = precioDesayunos + precioAlmuerzos + precioMeriendas;

      // Acumular totales
      totalDesayunos += datos.desayunos;
      totalAlmuerzos += datos.almuerzos;
      totalMeriendas += datos.meriendas;
      totalGeneral += totalUnidad;

      body.push([
        unidad,
        datos.desayunos,
        `$${precioDesayunos.toFixed(2)}`,
        datos.almuerzos,
        `$${precioAlmuerzos.toFixed(2)}`,
        datos.meriendas,
        `$${precioMeriendas.toFixed(2)}`,
        `$${totalUnidad.toFixed(2)}`
      ]);
    });

    // Añadir fila de totales
    body.push([
      'TOTAL GENERAL',
      totalDesayunos,
      `$${(totalDesayunos * (precios.desayuno || 0)).toFixed(2)}`,
      totalAlmuerzos,
      `$${(totalAlmuerzos * (precios.almuerzo || 0)).toFixed(2)}`,
      totalMeriendas,
      `$${(totalMeriendas * (precios.merienda || 0)).toFixed(2)}`,
      `$${totalGeneral.toFixed(2)}`
    ]);

    // Configurar la tabla con estilos similares al PDF original
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [41, 128, 185], // Azul
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 25 }, // Unidad
        1: { halign: 'center', cellWidth: 20 }, // Desayunos
        2: { halign: 'right', cellWidth: 22 }, // P. Desayuno
        3: { halign: 'center', cellWidth: 20 }, // Almuerzos
        4: { halign: 'right', cellWidth: 22 }, // P. Almuerzo
        5: { halign: 'center', cellWidth: 20 }, // Meriendas
        6: { halign: 'right', cellWidth: 22 }, // P. Merienda
        7: { halign: 'right', cellWidth: 25 } // Total
      },
      // Resaltar la fila de totales
      didParseCell: function(data) {
        if (data.row.index === body.length - 1) { // Última fila (totales)
          data.cell.styles.fillColor = [231, 76, 60]; // Rojo para totales
          data.cell.styles.textColor = 255;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // Información adicional
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    const fechaGeneracionEcuador = obtenerFechaEcuador();
    doc.text(`Fecha de generación: ${fechaGeneracionEcuador.toLocaleDateString('es-EC')}`, 20, finalY);
    doc.text(`Precios unitarios: Desayuno $${(precios.desayuno || 0).toFixed(2)} | Almuerzo $${(precios.almuerzo || 0).toFixed(2)} | Merienda $${(precios.merienda || 0).toFixed(2)}`, 20, finalY + 8);

    // Firmas (mismo estilo que el PDF original)
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const firmaY = pageHeight - 30;

    doc.setFontSize(10);

    // Firma izquierda
    const firmaIzquierda = 'Clase encargado';
    const lineaIzquierda = '_'.repeat(20);
    doc.text(lineaIzquierda, 20, firmaY);
    const firmaIzquierdaX = 20 + (doc.getTextWidth(lineaIzquierda) - doc.getTextWidth(firmaIzquierda)) / 2;
    doc.text(firmaIzquierda, firmaIzquierdaX, firmaY + 8);

    // Firma centro
    const firmaCentro = 'Oficial de personal';
    const lineaCentro = '_'.repeat(20);
    const centroX = (pageWidth - doc.getTextWidth(lineaCentro)) / 2;
    doc.text(lineaCentro, centroX, firmaY);
    const firmaCentroX = (pageWidth - doc.getTextWidth(firmaCentro)) / 2;
    doc.text(firmaCentro, firmaCentroX, firmaY + 8);

    // Firma derecha
    const firmaDerecha = 'Comandante de unidad';
    const lineaDerecha = '_'.repeat(20);
    const derechaX = pageWidth - doc.getTextWidth(lineaDerecha) - 20;
    doc.text(lineaDerecha, derechaX, firmaY);
    const firmaDerechaX = derechaX + (doc.getTextWidth(lineaDerecha) - doc.getTextWidth(firmaDerecha)) / 2;
    doc.text(firmaDerecha, firmaDerechaX, firmaY + 8);

    doc.save(nombreArchivo);
    toast.success('PDF consolidado generado exitosamente');
  };

  return {
    // Estado
    raciones,
    busqueda,
    cargando,
    unidades,
    racionSeleccionada,
    orden,
    camposOrden,
    fechaRacionesActuales,
    yaSeGuardoHoy,

    // Computed
    racionesFiltradas,
    racionesOrdenadas,

    // Fechas
    fechaHoy,
    fechaAyer,
    formatearFecha,

    // Métodos principales
    buscarRacionesHaciaAtras,
    inicializarRaciones,
    obtenerRaciones,
    obtenerUnidades,
    guardarCambios,
    guardarCambiosRanchero,
    guardarEstadoOriginal,
    obtenerRacionesModificadas,
    toggleTodos,
    ordenarPor,
    seleccionarRacion,
    estaDentroDeHorario,
    exportarPDF,
    exportarPDFConsolidado,

    // Métodos específicos para PantallaRanchero
    inicializarRacionesRanchero,
    aplicarCambioEnMemoria,
    obtenerRacionesConCambios,
    resetearCambiosMemoria,
    exportarPDFRanchero,
    guardarCambiosEnLocalStorage,
    cargarCambiosDesdeLocalStorage,
    limpiarLocalStorage
  };
}
