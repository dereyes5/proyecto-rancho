<template>
    <div>
        <Navbar />
        <div class="container">
            <h3 class="mb-3 text-primary">
                <i class="bi bi-list-check"></i> Registro de Raciones - {{ fechaRacionesActuales || fechaHoy }}
                <small v-if="fechaRacionesActuales && fechaRacionesActuales !== fechaHoy" class="text-muted">
                    (Datos de {{ fechaRacionesActuales }})
                </small>
            </h3>

            <!-- Barra de búsqueda única -->
            <div class="mb-3">
                <input v-model="busqueda" class="form-control w-50"
                       placeholder="Buscar por nombre, cédula, novedad o subunidad..." />
            </div>

            <div class="d-flex gap-2 mb-3 flex-wrap">
                <button class="btn btn-outline-primary" @click="toggleTodos('desayuno')">
                    <i class="bi bi-check2-square"></i> (Des)Seleccionar todo Desayuno
                </button>
                <button class="btn btn-outline-primary" @click="toggleTodos('almuerzo')">
                    <i class="bi bi-check2-square"></i> (Des)Seleccionar todo Almuerzo
                </button>
                <button class="btn btn-outline-primary" @click="toggleTodos('merienda')">
                    <i class="bi bi-check2-square"></i> (Des)Seleccionar todo Merienda
                </button>
                <button class="btn btn-outline-warning" @click="abrirModalNovedadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-pencil-square"></i> Modificar Novedad ({{ personalSeleccionadoParaEliminar.length }})
                </button>
                <button class="btn btn-outline-info" @click="abrirModalSubunidadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-tags"></i> Modificar Subunidad ({{ personalSeleccionadoParaEliminar.length }})
                </button>
                <button class="btn btn-outline-secondary" @click="abrirModalUnidadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-building"></i> Modificar Unidad ({{ personalSeleccionadoParaEliminar.length }})
                </button>
                <button class="btn btn-outline-primary" @click="abrirModalAgregarPersonal">
                    <i class="bi bi-person-plus"></i> Agregar personal
                </button>
                <button class="btn btn-outline-danger" @click="eliminarPersonalSeleccionado"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-person-dash"></i> Eliminar personal ({{ personalSeleccionadoParaEliminar.length }})
                </button>
                <button class="btn btn-outline-success ms-auto" @click="guardarRaciones" :disabled="cargando">
                    <span v-if="cargando" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-save"></i>
                    {{ cargando ? 'Guardando...' : 'Guardar' }}
                </button>
                <button class="btn btn-outline-danger" @click="generarPDF">
                    <i class="bi bi-file-earmark-pdf"></i> PDF
                </button>
            </div>

            <div v-if="cargando" class="text-center my-4">
                <div class="spinner-border text-primary" role="status"></div>
            </div>

            <!-- Tabla con scroll y ordenamiento -->
            <div v-else class="table-responsive-custom mb-3">
                <table class="table table-bordered align-middle">
                    <thead class="table-light text-center">
                        <tr>
                            <th>
                                <input type="checkbox" @change="toggleSeleccionarTodos"
                                       :checked="todosMarcados" title="Seleccionar/Deseleccionar todos">
                            </th>
                            <th v-for="campo in camposOrden" :key="campo.key" @click="ordenarPor(campo.key)" style="cursor:pointer">
                                {{ campo.label }}
                                <i :class="orden.campo === campo.key ? (orden.ascendente ? 'bi bi-arrow-down' : 'bi bi-arrow-up') : ''"></i>
                            </th>
                            <th>D</th>
                            <th>A</th>
                            <th>M</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in racionesOrdenadas" :key="r._idPersonal" class="text-center align-middle">
                            <td>
                                <input type="checkbox" v-model="personalSeleccionadoParaEliminar"
                                       :value="r._cedula">
                            </td>
                            <td>{{ r._cedula }}</td>
                            <td class="text-start">{{ r._nombre }}</td>
                            <td>{{ r._grado }}</td>
                            <td>{{ r._unidad }}</td>
                            <td>{{ r._novedad }}</td>
                            <td>{{ r._subunidad }}</td>
                            <td><input type="checkbox" v-model="r.desayuno" true-value="1" false-value="0" @click.stop /></td>
                            <td><input type="checkbox" v-model="r.almuerzo" true-value="1" false-value="0" @click.stop /></td>
                            <td><input type="checkbox" v-model="r.merienda" true-value="1" false-value="0" @click.stop /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Modal para modificar novedad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalNovedadVisible }" style="display: block;"
                v-if="modalNovedadVisible" @click.self="cerrarModalNovedad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modificar Novedad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalNovedad"></button>
                        </div>
                        <div class="modal-body">
                            <textarea v-model="nuevaNovedad" class="form-control" rows="3"
                                placeholder="Escribe la nueva novedad..."></textarea>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalNovedad">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarNovedadMultiple">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalNovedadVisible" class="modal-backdrop fade show"></div>

            <!-- Modal para modificar subunidad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalSubunidadVisible }" style="display: block;"
                v-if="modalSubunidadVisible" @click.self="cerrarModalSubunidad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modificar Subunidad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalSubunidad"></button>
                        </div>
                        <div class="modal-body">
                            <input v-model="nuevaSubunidad" class="form-control"
                                placeholder="Escribe la nueva subunidad..." />
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalSubunidad">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarSubunidadMultiple">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalSubunidadVisible" class="modal-backdrop fade show"></div>

            <!-- Modal para modificar unidad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalUnidadVisible }" style="display: block;"
                v-if="modalUnidadVisible" @click.self="cerrarModalUnidad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modificar Unidad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalUnidad"></button>
                        </div>
                        <div class="modal-body">
                            <select v-model="nuevaUnidad" class="form-select">
                                <option disabled value="">Seleccione nueva unidad</option>
                                <option v-for="unidad in unidades" :key="unidad" :value="unidad">{{ unidad }}</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalUnidad">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarUnidadMultiple">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalUnidadVisible" class="modal-backdrop fade show"></div>

            <!-- Modal para agregar personal -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalPersonalVisible }" style="display: block;"
                v-if="modalPersonalVisible" @click.self="cerrarModalPersonal">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Agregar Personal</h5>
                            <button type="button" class="btn-close" @click="cerrarModalPersonal"></button>
                        </div>
                        <div class="modal-body">
                            <form @submit.prevent="agregarPersonal">
                                <div class="mb-3">
                                    <label for="cedula" class="form-label">Cédula *</label>
                                    <input type="text"
                                           class="form-control"
                                           id="cedula"
                                           v-model="nuevoPersonal.cedula"
                                           required
                                           pattern="[0-9]{10}"
                                           maxlength="10"
                                           placeholder="1234567890">
                                    <div class="form-text">Ingrese 10 dígitos</div>
                                </div>
                                <div class="mb-3">
                                    <label for="apellidonombre" class="form-label">Apellido y Nombre *</label>
                                    <input type="text"
                                           class="form-control"
                                           id="apellidonombre"
                                           v-model="nuevoPersonal.apellidonombre"
                                           required
                                           placeholder="PÉREZ JUAN">
                                </div>
                                <div class="mb-3">
                                    <label for="unidad" class="form-label">Unidad *</label>
                                    <input type="text"
                                           class="form-control"
                                           id="unidad"
                                           v-model="nuevoPersonal.unidad"
                                           readonly
                                           disabled
                                           :placeholder="rolUsuario">
                                    <div class="form-text">Se asignará automáticamente según su rol: {{ rolUsuario }}</div>
                                </div>
                                <div class="mb-3">
                                    <label for="grado" class="form-label">Grado *</label>
                                    <input type="text"
                                           class="form-control"
                                           id="grado"
                                           v-model="nuevoPersonal.grado"
                                           required
                                           placeholder="TENIENTE">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cerrarModalPersonal" :disabled="cargandoPersonal">
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" @click="agregarPersonal" :disabled="cargandoPersonal">
                                <span v-if="cargandoPersonal" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                {{ cargandoPersonal ? 'Agregando...' : 'Agregar personal' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalPersonalVisible" class="modal-backdrop fade show"></div>
        </div>
    </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import { useRaciones } from '../api/useRaciones.js';
import { useModales } from '../api/useModales.js';
import ApiService from '../api/apiService.js';
import { useToast } from 'vue-toastification';
import { onMounted, ref, computed } from 'vue';

export default {
    name: 'RacionesView',
    components: { Navbar },
    setup() {
        // Instancia de toast para mostrar notificaciones
        const toast = useToast();

        // Usar composables para funcionalidad reutilizable
        const {
            raciones,
            busqueda,
            cargando,
            unidades,
            racionSeleccionada,
            orden,
            camposOrden,
            racionesFiltradas,
            racionesOrdenadas,
            fechaHoy,
            fechaAyer,
            fechaRacionesActuales,
            yaSeGuardoHoy,
            inicializarRaciones,
            obtenerRaciones,
            obtenerUnidades,
            guardarCambios,
            toggleTodos,
            ordenarPor,
            seleccionarRacion,
            estaDentroDeHorario,
            exportarPDF
        } = useRaciones();

        const {
            modalNovedadVisible,
            modalSubunidadVisible,
            modalUnidadVisible,
            nuevaNovedad,
            nuevaSubunidad,
            nuevaUnidad,
            abrirModalNovedad,
            cerrarModalNovedad,
            guardarNovedad,
            abrirModalSubunidad,
            cerrarModalSubunidad,
            guardarSubunidad,
            abrirModalUnidad,
            cerrarModalUnidad,
            guardarUnidad,
            cargarHoraLimite
        } = useModales();

        // Estado local específico de esta vista
        const horaLimite = ref('18:00');
        const rolUsuario = ref('');

        // Estados para modal de personal
        const modalPersonalVisible = ref(false);
        const cargandoPersonal = ref(false);
        const nuevoPersonal = ref({
            cedula: '',
            apellidonombre: '',
            unidad: '',
            grado: ''
        });

        // Estados para eliminación de personal
        const personalSeleccionadoParaEliminar = ref([]);
        const cargandoEliminacion = ref(false);

        // Computed para verificar si todos están marcados
        const todosMarcados = computed(() => {
            return racionesOrdenadas.value.length > 0 &&
                   personalSeleccionadoParaEliminar.value.length === racionesOrdenadas.value.length;
        });

        // Métodos específicos de esta vista
        const guardarRaciones = async () => {
            const exitoso = await guardarCambios(true, horaLimite.value);
            if (exitoso) {
                // Después del primer guardado, las raciones siempre serán de hoy
                // No necesitamos recargar ya que el composable maneja esto automáticamente
            }
        };

        const generarPDF = async () => {
            const titulo = `Registro de Raciones - ${fechaRacionesActuales.value || fechaHoy}`;
            const nombreArchivo = `raciones_${fechaRacionesActuales.value || fechaHoy}.pdf`;
            await exportarPDF(titulo, nombreArchivo, true);
        };

        // Métodos para modal de personal
        const abrirModalAgregarPersonal = () => {
            // Resetear formulario y asignar unidad automáticamente
            nuevoPersonal.value = {
                cedula: '',
                apellidonombre: '',
                unidad: rolUsuario.value, // Asignar automáticamente el rol del usuario
                grado: ''
            };
            modalPersonalVisible.value = true;
        };

        const cerrarModalPersonal = () => {
            modalPersonalVisible.value = false;
        };

        const agregarPersonal = async () => {
            if (!nuevoPersonal.value.cedula || !nuevoPersonal.value.apellidonombre ||
                !nuevoPersonal.value.grado) {
                toast.error('Todos los campos son requeridos');
                return;
            }

            if (!/^[0-9]{10}$/.test(nuevoPersonal.value.cedula)) {
                toast.error('La cédula debe tener exactamente 10 dígitos');
                return;
            }

            try {
                cargandoPersonal.value = true;

                // Intentar guardar raciones antes de hacer cambios
                try {
                    toast.info('Guardando raciones actuales...');
                    await guardarCambios(true, horaLimite.value);
                } catch (error) {
                    // Si no hay cambios para guardar, continuar con la operación
                    console.log('No hay cambios en raciones para guardar, continuando...');
                }

                // Asegurar que la unidad sea la del rol del usuario
                const personalData = {
                    ...nuevoPersonal.value,
                    unidad: rolUsuario.value
                };

                await ApiService.agregarPersonal(personalData);

                toast.success('Personal agregado exitosamente');
                cerrarModalPersonal();

                // Recargar las raciones para mostrar el nuevo personal
                await inicializarRaciones(rolUsuario.value);

                console.log('Personal agregado:', personalData);

            } catch (error) {
                console.error('Error al agregar personal:', error);

                if (error.response?.status === 409) {
                    toast.error('Ya existe un usuario con esta cédula');
                } else if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                } else {
                    toast.error('Error al agregar personal');
                }
            } finally {
                cargandoPersonal.value = false;
            }
        };

        // Métodos para eliminación de personal
        const toggleSeleccionarTodos = () => {
            if (todosMarcados.value) {
                personalSeleccionadoParaEliminar.value = [];
            } else {
                personalSeleccionadoParaEliminar.value = racionesOrdenadas.value.map(r => r._cedula);
            }
        };

        const eliminarPersonalSeleccionado = async () => {
            if (personalSeleccionadoParaEliminar.value.length === 0) {
                toast.error('No hay personal seleccionado para eliminar');
                return;
            }

            const confirmacion = confirm(
                `¿Está seguro de que desea eliminar ${personalSeleccionadoParaEliminar.value.length} persona(s)?\n\n` +
                `Esta acción no se puede deshacer.`
            );

            if (!confirmacion) return;

            try {
                cargandoEliminacion.value = true;

                // Intentar guardar raciones antes de hacer cambios
                try {
                    toast.info('Guardando raciones actuales...');
                    await guardarCambios(true, horaLimite.value);
                } catch (error) {
                    // Si no hay cambios para guardar, continuar con la operación
                    console.log('No hay cambios en raciones para guardar, continuando...');
                }

                // Eliminar cada persona seleccionada
                const promesasEliminacion = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.eliminarPersonal(cedula)
                );

                await Promise.all(promesasEliminacion);

                toast.success(`${personalSeleccionadoParaEliminar.value.length} persona(s) eliminada(s) exitosamente`);

                // Limpiar selección
                personalSeleccionadoParaEliminar.value = [];

                // Recargar las raciones para reflejar los cambios
                await inicializarRaciones(rolUsuario.value);

            } catch (error) {
                console.error('Error al eliminar personal:', error);

                if (error.response?.data?.error) {
                    toast.error(error.response.data.error);
                } else {
                    toast.error('Error al eliminar el personal seleccionado');
                }
            } finally {
                cargandoEliminacion.value = false;
            }
        };

        // Métodos para operaciones múltiples
        const abrirModalNovedadMultiple = () => {
            if (personalSeleccionadoParaEliminar.value.length === 0) {
                toast.error('No hay personal seleccionado');
                return;
            }
            // Abrir modal directamente sin validación de racionSeleccionada
            nuevaNovedad.value = '';
            modalNovedadVisible.value = true;
        };

        const abrirModalSubunidadMultiple = () => {
            if (personalSeleccionadoParaEliminar.value.length === 0) {
                toast.error('No hay personal seleccionado');
                return;
            }
            // Abrir modal directamente sin validación de racionSeleccionada
            nuevaSubunidad.value = '';
            modalSubunidadVisible.value = true;
        };

        const abrirModalUnidadMultiple = () => {
            if (personalSeleccionadoParaEliminar.value.length === 0) {
                toast.error('No hay personal seleccionado');
                return;
            }
            // Abrir modal directamente sin validación de racionSeleccionada
            nuevaUnidad.value = '';
            modalUnidadVisible.value = true;
        };

        const guardarNovedadMultiple = async () => {
            if (!nuevaNovedad.value) {
                toast.error('Debe ingresar una novedad');
                return;
            }

            try {
                // Intentar guardar raciones antes de hacer cambios
                try {
                    toast.info('Guardando raciones actuales...');
                    await guardarCambios(true, horaLimite.value);
                } catch (error) {
                    // Si no hay cambios para guardar, continuar con la operación
                    console.log('No hay cambios en raciones para guardar, continuando...');
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalNovedad(cedula, nuevaNovedad.value)
                );

                await Promise.all(promesas);

                toast.success(`Novedad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                await inicializarRaciones(rolUsuario.value);

                cerrarModalNovedad();
            } catch (error) {
                console.error('Error al actualizar novedad:', error);
                toast.error('Error al actualizar la novedad');
            }
        };

        const guardarSubunidadMultiple = async () => {
            if (!nuevaSubunidad.value) {
                toast.error('Debe ingresar una subunidad');
                return;
            }

            try {
                // Intentar guardar raciones antes de hacer cambios
                try {
                    toast.info('Guardando raciones actuales...');
                    await guardarCambios(true, horaLimite.value);
                } catch (error) {
                    // Si no hay cambios para guardar, continuar con la operación
                    console.log('No hay cambios en raciones para guardar, continuando...');
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalSubunidad(cedula, nuevaSubunidad.value)
                );

                await Promise.all(promesas);

                toast.success(`Subunidad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                await inicializarRaciones(rolUsuario.value);

                cerrarModalSubunidad();
            } catch (error) {
                console.error('Error al actualizar subunidad:', error);
                toast.error('Error al actualizar la subunidad');
            }
        };

        const guardarUnidadMultiple = async () => {
            if (!nuevaUnidad.value) {
                toast.error('Debe seleccionar una unidad');
                return;
            }

            try {
                // Intentar guardar raciones antes de hacer cambios
                try {
                    toast.info('Guardando raciones actuales...');
                    await guardarCambios(true, horaLimite.value);
                } catch (error) {
                    // Si no hay cambios para guardar, continuar con la operación
                    console.log('No hay cambios en raciones para guardar, continuando...');
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalUnidad(cedula, nuevaUnidad.value)
                );

                await Promise.all(promesas);

                toast.success(`Unidad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                await inicializarRaciones(rolUsuario.value);

                cerrarModalUnidad();
            } catch (error) {
                console.error('Error al actualizar unidad:', error);
                toast.error('Error al actualizar la unidad');
            }
        };

        // Inicialización
        onMounted(async () => {
            try {
                const unidad = localStorage.getItem('rol');
                rolUsuario.value = unidad || '';

                // Cargar datos en paralelo para mejor performance
                const [hora] = await Promise.all([
                    cargarHoraLimite(),
                    obtenerUnidades(),
                    inicializarRaciones(unidad) // Usar el nuevo método que busca hacia atrás
                ]);

                horaLimite.value = hora || '18:00';
            } catch (error) {
                console.error('Error en inicialización:', error);
            }
        });

        return {
            // Estado del composable useRaciones
            raciones,
            busqueda,
            cargando,
            unidades,
            racionSeleccionada,
            orden,
            camposOrden,
            racionesFiltradas,
            racionesOrdenadas,
            fechaHoy,
            fechaAyer,
            fechaRacionesActuales,
            yaSeGuardoHoy,

            // Estado del composable useModales
            modalNovedadVisible,
            modalSubunidadVisible,
            modalUnidadVisible,
            nuevaNovedad,
            nuevaSubunidad,
            nuevaUnidad,

            // Estado local
            rolUsuario,

            // Estado y métodos para personal
            modalPersonalVisible,
            cargandoPersonal,
            nuevoPersonal,
            abrirModalAgregarPersonal,
            cerrarModalPersonal,
            agregarPersonal,

            // Estado y métodos para eliminación
            personalSeleccionadoParaEliminar,
            cargandoEliminacion,
            todosMarcados,
            toggleSeleccionarTodos,
            eliminarPersonalSeleccionado,

            // Métodos múltiples
            abrirModalNovedadMultiple,
            abrirModalSubunidadMultiple,
            abrirModalUnidadMultiple,
            guardarNovedadMultiple,
            guardarSubunidadMultiple,
            guardarUnidadMultiple,

            // Métodos
            toggleTodos,
            ordenarPor,
            abrirModalNovedad,
            cerrarModalNovedad,
            guardarNovedad,
            abrirModalSubunidad,
            cerrarModalSubunidad,
            guardarSubunidad,
            abrirModalUnidad,
            cerrarModalUnidad,
            guardarUnidad,
            guardarRaciones,
            generarPDF
        };
    }
};
</script>

<style scoped>
.table-responsive-custom {
    max-height: 500px;
    overflow-y: auto;
}

.modal {
    background-color: rgba(0, 0, 0, 0.5);
}
</style>

