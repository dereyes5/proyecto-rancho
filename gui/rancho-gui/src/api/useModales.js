import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import ApiService from '../api/apiService.js';

export function useModales() {
  const toast = useToast();

  // Estado de modales
  const modalNovedadVisible = ref(false);
  const modalSubunidadVisible = ref(false);
  const modalUnidadVisible = ref(false);
  const modalHora = ref(false);
  const modalRol = ref(false);

  // Datos de modales
  const nuevaNovedad = ref('');
  const nuevaSubunidad = ref('');
  const nuevaUnidad = ref('');
  const horaActual = ref('');
  const nuevaHora = ref('');
  const cedulaRol = ref('');
  const nuevoRol = ref('');
  const rolesDisponibles = ref([]);

  // =============== MODAL NOVEDAD ===============

  const abrirModalNovedad = (racionSeleccionada) => {
    if (!racionSeleccionada) {
      toast.error('Selecciona una persona para modificar la novedad');
      return;
    }
    nuevaNovedad.value = racionSeleccionada._novedad || '';
    modalNovedadVisible.value = true;
  };

  const cerrarModalNovedad = () => {
    modalNovedadVisible.value = false;
    nuevaNovedad.value = '';
  };

  const guardarNovedad = async (racionSeleccionada) => {
    if (!nuevaNovedad.value.trim()) {
      toast.error('La novedad no puede estar vacía');
      return false;
    }

    try {
      const cedula = racionSeleccionada._cedula;
      await ApiService.actualizarPersonalNovedad(cedula, nuevaNovedad.value.trim());

      // Actualizar en el objeto local
      racionSeleccionada._novedad = nuevaNovedad.value.trim();

      cerrarModalNovedad();
      toast.success('Novedad actualizada correctamente');
      return true;
    } catch (error) {
      toast.error('Error al actualizar novedad');
      console.error(error);
      return false;
    }
  };

  // =============== MODAL SUBUNIDAD ===============

  const abrirModalSubunidad = (racionSeleccionada) => {
    if (!racionSeleccionada) {
      toast.error('Selecciona una persona para modificar la subunidad');
      return;
    }
    nuevaSubunidad.value = racionSeleccionada._subunidad || '';
    modalSubunidadVisible.value = true;
  };

  const cerrarModalSubunidad = () => {
    modalSubunidadVisible.value = false;
    nuevaSubunidad.value = '';
  };

  const guardarSubunidad = async (racionSeleccionada) => {
    if (!nuevaSubunidad.value.trim()) {
      toast.error('La subunidad no puede estar vacía');
      return false;
    }

    try {
      const cedula = racionSeleccionada._cedula;
      await ApiService.actualizarPersonalSubunidad(cedula, nuevaSubunidad.value.trim());

      // Actualizar en el objeto local
      racionSeleccionada._subunidad = nuevaSubunidad.value.trim();

      cerrarModalSubunidad();
      toast.success('Subunidad actualizada correctamente');
      return true;
    } catch (error) {
      toast.error('Error al actualizar subunidad');
      console.error(error);
      return false;
    }
  };

  // =============== MODAL UNIDAD ===============

  const abrirModalUnidad = (racionSeleccionada, unidades) => {
    if (!racionSeleccionada) {
      toast.error('Selecciona una persona para modificar la unidad');
      return;
    }
    nuevaUnidad.value = racionSeleccionada._unidad || '';
    modalUnidadVisible.value = true;
  };

  const cerrarModalUnidad = () => {
    modalUnidadVisible.value = false;
    nuevaUnidad.value = '';
  };

  const guardarUnidad = async (racionSeleccionada) => {
    if (!nuevaUnidad.value.trim()) {
      toast.error('La unidad no puede estar vacía');
      return false;
    }

    try {
      const cedula = racionSeleccionada._cedula;
      await ApiService.actualizarPersonalUnidad(cedula, nuevaUnidad.value.trim());

      // Actualizar en el objeto local
      racionSeleccionada._unidad = nuevaUnidad.value.trim();

      cerrarModalUnidad();
      toast.success('Unidad actualizada correctamente');
      return true;
    } catch (error) {
      toast.error('Error al actualizar unidad');
      console.error(error);
      return false;
    }
  };

  // =============== MODAL HORA ===============

  const abrirModalHora = async () => {
    try {
      const hora = await ApiService.obtenerConfiguracion('salida_confrontas');
      horaActual.value = hora;
      nuevaHora.value = hora;
      modalHora.value = true;
    } catch (error) {
      toast.error('No se pudo cargar la hora actual');
      console.error(error);
    }
  };

  const cerrarModalHora = () => {
    modalHora.value = false;
  };

  const guardarHora = async () => {
    try {
      await ApiService.actualizarConfiguracion('salida_confrontas', nuevaHora.value);
      modalHora.value = false;
      toast.success('Hora actualizada');
      return true;
    } catch (error) {
      toast.error('Error al guardar hora');
      console.error(error);
      return false;
    }
  };

  // =============== MODAL ROL ===============

  const abrirModalRol = async () => {
    try {
      const roles = await ApiService.obtenerRoles();
      rolesDisponibles.value = roles;
      modalRol.value = true;
    } catch (error) {
      toast.error('Error al cargar roles');
      console.error(error);
    }
  };

  const cerrarModalRol = () => {
    modalRol.value = false;
    cedulaRol.value = '';
    nuevoRol.value = '';
  };

  const guardarRol = async () => {
    if (!cedulaRol.value.trim() || !nuevoRol.value.trim()) {
      toast.error('Debe completar todos los campos');
      return false;
    }

    try {
      await ApiService.cambiarRolUsuario(cedulaRol.value, nuevoRol.value);
      modalRol.value = false;
      toast.success('Rol actualizado');
      return true;
    } catch (error) {
      toast.error('Error al actualizar rol');
      console.error(error);
      return false;
    }
  };

  // =============== CONFIGURACIÓN ===============

  const cargarHoraLimite = async () => {
    try {
      const hora = await ApiService.obtenerConfiguracion('salida_confrontas');
      return hora;
    } catch (error) {
      toast.error('Error al cargar la hora límite');
      console.error(error);
      return '18:00'; // Valor por defecto
    }
  };

  return {
    // Estado de modales
    modalNovedadVisible,
    modalSubunidadVisible,
    modalUnidadVisible,
    modalHora,
    modalRol,

    // Datos de modales
    nuevaNovedad,
    nuevaSubunidad,
    nuevaUnidad,
    horaActual,
    nuevaHora,
    cedulaRol,
    nuevoRol,
    rolesDisponibles,

    // Métodos de modal novedad
    abrirModalNovedad,
    cerrarModalNovedad,
    guardarNovedad,

    // Métodos de modal subunidad
    abrirModalSubunidad,
    cerrarModalSubunidad,
    guardarSubunidad,

    // Métodos de modal unidad
    abrirModalUnidad,
    cerrarModalUnidad,
    guardarUnidad,

    // Métodos de modal hora
    abrirModalHora,
    cerrarModalHora,
    guardarHora,

    // Métodos de modal rol
    abrirModalRol,
    cerrarModalRol,
    guardarRol,

    // Configuración
    cargarHoraLimite
  };
}
