<template>
    <div>
        <Navbar />
        <div class="container">
            <h3 class="mb-3 text-primary">
                <i class="bi bi-gear-fill"></i> Panel de Administración
                <span v-if="fechaRacionesActuales" class="text-muted fs-6">
                    - {{ fechaRacionesActuales }}
                </span>
            </h3>

            <div class="d-flex mb-3 align-items-center gap-3 flex-wrap">
                <select v-model="unidadSeleccionada" class="form-select w-auto" @change="cargarRacionesUnidad">
                    <option disabled value="">Seleccione una unidad</option>
                    <option v-for="unidad in unidades" :key="unidad" :value="unidad">{{ unidad }}</option>
                </select>

                <!-- Botones principales de administración -->
                <button class="btn btn-outline-warning" @click="abrirModalHora">
                    <i class="bi bi-clock"></i> Cambiar hora de confrontas
                </button>

                <button class="btn btn-outline-success" @click="abrirModalPrecios">
                    <i class="bi bi-currency-dollar"></i> Gestionar precios
                </button>

                <button class="btn btn-outline-primary" @click="abrirModalAgregarPersonal">
                    <i class="bi bi-person-plus"></i> Agregar personal
                </button>

                <!-- Botones de gestión de roles -->
                <button class="btn btn-outline-info" @click="abrirModalRol">
                    <i class="bi bi-person-gear"></i> Cambiar rol de usuario
                </button>

                <!-- Botones de operaciones múltiples -->
                <button class="btn btn-outline-secondary" @click="abrirModalUnidadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-building"></i> Cambiar unidad ({{ personalSeleccionadoParaEliminar.length }})
                </button>

                <button class="btn btn-outline-dark" @click="abrirModalNovedadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-pencil-square"></i> Modificar novedad ({{ personalSeleccionadoParaEliminar.length }})
                </button>

                <button class="btn btn-outline-primary" @click="abrirModalSubunidadMultiple"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-tags"></i> Modificar subunidad ({{ personalSeleccionadoParaEliminar.length }})
                </button>

                <button class="btn btn-outline-danger" @click="eliminarPersonalSeleccionado"
                    :disabled="personalSeleccionadoParaEliminar.length === 0">
                    <i class="bi bi-person-dash"></i> Eliminar personal ({{ personalSeleccionadoParaEliminar.length }})
                </button>

                <!-- Botones de guardado y reportes -->
                <button class="btn btn-outline-success ms-auto" @click="guardarRaciones" :disabled="cargando">
                    <span v-if="cargando" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-save"></i>
                    {{ cargando ? 'Guardando...' : 'Guardar' }}
                </button>

                <button class="btn btn-outline-danger" @click="generarPDF">
                    <i class="bi bi-file-earmark-pdf"></i> PDF
                </button>

                <button class="btn btn-outline-warning" @click="generarPDFConsolidado" :disabled="cargandoConsolidado">
                    <span v-if="cargandoConsolidado" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <i v-else class="bi bi-file-earmark-pdf-fill"></i>
                    {{ cargandoConsolidado ? 'Generando reporte...' : 'Reporte consolidado' }}
                </button>
            </div>

            <input v-model="busqueda" class="form-control mb-3 w-50"
                placeholder="Buscar por nombre, cédula, novedad o subunidad..." />

            <div class="d-flex gap-2 mb-3 flex-wrap">
                <button class="btn btn-outline-primary" @click="toggleTodos('desayuno')">
                    (Des)Seleccionar todo Desayuno
                </button>
                <button class="btn btn-outline-primary" @click="toggleTodos('almuerzo')">
                    (Des)Seleccionar todo Almuerzo
                </button>
                <button class="btn btn-outline-primary" @click="toggleTodos('merienda')">
                    (Des)Seleccionar todo Merienda
                </button>
            </div>

            <div v-if="cargando" class="text-center my-4">
                <div class="spinner-border text-primary" role="status"></div>
            </div>

            <!-- Tabla con scroll -->
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
                        <tr v-for="r in racionesOrdenadas" :key="r._idPersonal" class="text-center">
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

            <!-- Modal Hora -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalHora }" style="display: block;"
                v-if="modalHora" @click.self="cerrarModalHora">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cambiar hora de confrontas</h5>
                            <button type="button" class="btn-close" @click="cerrarModalHora"></button>
                        </div>
                        <div class="modal-body">
                            <p>Hora actual: {{ horaActual }}</p>
                            <input v-model="nuevaHora" type="time" class="form-control" />
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalHora">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarHora">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalHora" class="modal-backdrop fade show"></div>

            <!-- Modal Rol -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalRol }" style="display: block;"
                v-if="modalRol" @click.self="cerrarModalRol">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cambiar rol de usuario</h5>
                            <button type="button" class="btn-close" @click="cerrarModalRol"></button>
                        </div>
                        <div class="modal-body">
                            <input v-model="cedulaRol" class="form-control mb-2" placeholder="Cédula del usuario" />
                            <select v-model="nuevoRol" class="form-select">
                                <option disabled value="">Seleccione un rol</option>
                                <option v-for="rol in rolesDisponibles" :key="rol" :value="rol">{{ rol }}</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalRol">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarRol">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalRol" class="modal-backdrop fade show"></div>

            <!-- Modal Cambiar Unidad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalUnidadVisible }" style="display: block;"
                v-if="modalUnidadVisible" @click.self="cerrarModalUnidad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Cambiar unidad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalUnidad"></button>
                        </div>
                        <div class="modal-body">
                            <p>Unidad actual: <strong>{{ racionSeleccionada?._unidad }}</strong></p>
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

            <!-- Modal Novedad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalNovedadVisible }" style="display: block;"
                v-if="modalNovedadVisible" @click.self="cerrarModalNovedad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modificar novedad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalNovedad"></button>
                        </div>
                        <div class="modal-body">
                            <p>Usuario: <strong>{{ racionSeleccionada?._nombre }}</strong></p>
                            <input v-model="nuevaNovedad" class="form-control" placeholder="Ingrese la nueva novedad" />
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalNovedad">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarNovedadMultiple">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalNovedadVisible" class="modal-backdrop fade show"></div>

            <!-- Modal Subunidad -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalSubunidadVisible }" style="display: block;"
                v-if="modalSubunidadVisible" @click.self="cerrarModalSubunidad">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Modificar subunidad - {{ personalSeleccionadoParaEliminar.length }} persona(s) seleccionada(s)</h5>
                            <button type="button" class="btn-close" @click="cerrarModalSubunidad"></button>
                        </div>
                        <div class="modal-body">
                            <p>Usuario: <strong>{{ racionSeleccionada?._nombre }}</strong></p>
                            <input v-model="nuevaSubunidad" class="form-control" placeholder="Ingrese la nueva subunidad" />
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalSubunidad">Cancelar</button>
                            <button class="btn btn-primary" @click="guardarSubunidadMultiple">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalSubunidadVisible" class="modal-backdrop fade show"></div>

            <!-- Modal Precios -->
            <div class="modal fade" tabindex="-1" :class="{ show: modalPreciosVisible }" style="display: block;"
                v-if="modalPreciosVisible" @click.self="cerrarModalPrecios">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Gestionar precios de comidas</h5>
                            <button type="button" class="btn-close" @click="cerrarModalPrecios"></button>
                        </div>
                        <div class="modal-body">
                            <div v-if="cargandoPrecios" class="text-center">
                                <div class="spinner-border text-primary" role="status"></div>
                                <p>Cargando precios...</p>
                            </div>
                            <div v-else>
                                <div class="mb-3" v-for="precio in precios" :key="precio.comida">
                                    <label :for="'precio-' + precio.comida" class="form-label text-capitalize">
                                        <strong>{{ precio.comida }}:</strong>
                                    </label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input
                                            :id="'precio-' + precio.comida"
                                            v-model.number="precio.precio"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            class="form-control"
                                            :placeholder="'Precio del ' + precio.comida"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" @click="cerrarModalPrecios" :disabled="guardandoPrecios">
                                Cancelar
                            </button>
                            <button class="btn btn-primary" @click="guardarPrecios" :disabled="cargandoPrecios || guardandoPrecios">
                                <span v-if="guardandoPrecios" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                {{ guardandoPrecios ? 'Guardando...' : 'Guardar' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="modalPreciosVisible" class="modal-backdrop fade show"></div>

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
                                           required
                                           placeholder="GAE-44">
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
import { obtenerFechaEcuador } from '../api/utils.js';

export default {
    name: 'PantallaAdministracion',
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
            fechaRacionesActuales,
            yaSeGuardoHoy,
            formatearFecha,
            inicializarRaciones,
            obtenerRaciones,
            obtenerUnidades,
            guardarCambios,
            toggleTodos,
            ordenarPor,
            seleccionarRacion,
            exportarPDF,
            exportarPDFConsolidado
        } = useRaciones();

        const {
            modalNovedadVisible,
            modalSubunidadVisible,
            modalUnidadVisible,
            modalHora,
            modalRol,
            nuevaNovedad,
            nuevaSubunidad,
            nuevaUnidad,
            horaActual,
            nuevaHora,
            cedulaRol,
            nuevoRol,
            rolesDisponibles,
            abrirModalNovedad,
            cerrarModalNovedad,
            guardarNovedad,
            abrirModalSubunidad,
            cerrarModalSubunidad,
            guardarSubunidad,
            abrirModalUnidad,
            cerrarModalUnidad,
            guardarUnidad,
            abrirModalHora,
            cerrarModalHora,
            guardarHora,
            abrirModalRol,
            cerrarModalRol,
            guardarRol
        } = useModales();

        // Estado local específico de esta vista
        const unidadSeleccionada = ref('');
        const cargandoConsolidado = ref(false);

        // Estados para modal de precios
        const modalPreciosVisible = ref(false);
        const precios = ref([]);
        const preciosOriginales = ref([]);
        const cargandoPrecios = ref(false);
        const guardandoPrecios = ref(false);

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

        // Métodos para gestión de precios
        const abrirModalPrecios = async () => {
            modalPreciosVisible.value = true;
            await cargarPrecios();
        };

        const cerrarModalPrecios = () => {
            modalPreciosVisible.value = false;
            // Restaurar precios originales en caso de cancelar
            precios.value = preciosOriginales.value.map(p => ({ ...p }));
        };

        const cargarPrecios = async () => {
            try {
                cargandoPrecios.value = true;
                const preciosData = await ApiService.obtenerPrecios();
                precios.value = preciosData;
                preciosOriginales.value = preciosData.map(p => ({ ...p }));
            } catch (error) {
                console.error('Error al cargar precios:', error);
                toast.error('Error al cargar los precios. Intente nuevamente.');
            } finally {
                cargandoPrecios.value = false;
            }
        };

        const guardarPrecios = async () => {
            try {
                guardandoPrecios.value = true;

                // Actualizar cada precio que haya cambiado
                const promesasActualizacion = precios.value
                    .filter(precio => {
                        const original = preciosOriginales.value.find(p => p.comida === precio.comida);
                        return original && original.precio !== precio.precio;
                    })
                    .map(precio => ApiService.actualizarPrecio(precio.comida, precio.precio));

                if (promesasActualizacion.length > 0) {
                    await Promise.all(promesasActualizacion);
                    toast.success('Precios actualizados correctamente.');

                    // Actualizar precios originales
                    preciosOriginales.value = precios.value.map(p => ({ ...p }));
                } else {
                    toast.info('No hay cambios para guardar.');
                }

                modalPreciosVisible.value = false;
            } catch (error) {
                console.error('Error al guardar precios:', error);
                toast.error('Error al guardar los precios. Intente nuevamente.');
            } finally {
                guardandoPrecios.value = false;
            }
        };

        // Métodos para modal de personal
        const abrirModalAgregarPersonal = () => {
            // Resetear formulario
            nuevoPersonal.value = {
                cedula: '',
                apellidonombre: '',
                unidad: '',
                grado: ''
            };
            modalPersonalVisible.value = true;
        };

        const cerrarModalPersonal = () => {
            modalPersonalVisible.value = false;
        };

        const agregarPersonal = async () => {
            if (!nuevoPersonal.value.cedula || !nuevoPersonal.value.apellidonombre ||
                !nuevoPersonal.value.unidad || !nuevoPersonal.value.grado) {
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
                if (unidadSeleccionada.value) {
                    try {
                        toast.info('Guardando raciones actuales...');
                        await guardarCambios(true);
                    } catch (error) {
                        // Si no hay cambios para guardar, continuar con la operación
                        console.log('No hay cambios en raciones para guardar, continuando...');
                    }
                }

                await ApiService.agregarPersonal(nuevoPersonal.value);

                toast.success('Personal agregado exitosamente');
                cerrarModalPersonal();

                console.log('Personal agregado:', nuevoPersonal.value);

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
                if (unidadSeleccionada.value) {
                    try {
                        toast.info('Guardando raciones actuales...');
                        await guardarCambios(true);
                    } catch (error) {
                        // Si no hay cambios para guardar, continuar con la operación
                        console.log('No hay cambios en raciones para guardar, continuando...');
                    }
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
                if (unidadSeleccionada.value) {
                    await inicializarRaciones(unidadSeleccionada.value);
                }

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
                if (unidadSeleccionada.value) {
                    try {
                        toast.info('Guardando raciones actuales...');
                        await guardarCambios(true);
                    } catch (error) {
                        // Si no hay cambios para guardar, continuar con la operación
                        console.log('No hay cambios en raciones para guardar, continuando...');
                    }
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalNovedad(cedula, nuevaNovedad.value)
                );

                await Promise.all(promesas);

                toast.success(`Novedad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                if (unidadSeleccionada.value) {
                    await inicializarRaciones(unidadSeleccionada.value);
                }

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
                if (unidadSeleccionada.value) {
                    try {
                        toast.info('Guardando raciones actuales...');
                        await guardarCambios(true);
                    } catch (error) {
                        // Si no hay cambios para guardar, continuar con la operación
                        console.log('No hay cambios en raciones para guardar, continuando...');
                    }
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalSubunidad(cedula, nuevaSubunidad.value)
                );

                await Promise.all(promesas);

                toast.success(`Subunidad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                if (unidadSeleccionada.value) {
                    await inicializarRaciones(unidadSeleccionada.value);
                }

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
                if (unidadSeleccionada.value) {
                    try {
                        toast.info('Guardando raciones actuales...');
                        await guardarCambios(true);
                    } catch (error) {
                        // Si no hay cambios para guardar, continuar con la operación
                        console.log('No hay cambios en raciones para guardar, continuando...');
                    }
                }

                const promesas = personalSeleccionadoParaEliminar.value.map(cedula =>
                    ApiService.actualizarPersonalUnidad(cedula, nuevaUnidad.value)
                );

                await Promise.all(promesas);

                toast.success(`Unidad actualizada para ${personalSeleccionadoParaEliminar.value.length} persona(s)`);

                // Limpiar selección y recargar
                personalSeleccionadoParaEliminar.value = [];
                if (unidadSeleccionada.value) {
                    await inicializarRaciones(unidadSeleccionada.value);
                }

                cerrarModalUnidad();
            } catch (error) {
                console.error('Error al actualizar unidad:', error);
                toast.error('Error al actualizar la unidad');
            }
        };

        // Métodos específicos de esta vista
        const cargarRacionesUnidad = async () => {
            if (!unidadSeleccionada.value) return;

            // Usar la nueva lógica de inicialización que busca hacia atrás
            await inicializarRaciones(unidadSeleccionada.value);
        };

        const guardarRaciones = async () => {
            const exitoso = await guardarCambios();
            if (exitoso) {
                // Después del primer guardado, las raciones siempre serán de hoy
                // No necesitamos recargar ya que el composable maneja esto automáticamente
            }
        };

        const generarPDF = async () => {
            const fechaActual = fechaRacionesActuales.value || formatearFecha(obtenerFechaEcuador());
            const titulo = `Panel de Administración - Raciones (${fechaActual})`;
            const nombreArchivo = `raciones_admin_${fechaActual}.pdf`;
            await exportarPDF(titulo, nombreArchivo, true);
        };

        const generarPDFConsolidado = async () => {
            try {
                cargandoConsolidado.value = true;
                const fechaActual = fechaRacionesActuales.value || formatearFecha(obtenerFechaEcuador());
                const titulo = `Reporte Consolidado de Raciones Consumidas`;
                const nombreArchivo = `reporte_consolidado_${fechaActual}.pdf`;
                await exportarPDFConsolidado(fechaActual, titulo, nombreArchivo);
            } catch (error) {
                console.error('Error al generar PDF consolidado:', error);
            } finally {
                cargandoConsolidado.value = false;
            }
        };

        // Inicialización
        onMounted(async () => {
            try {
                await obtenerUnidades();
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
            fechaRacionesActuales,
            yaSeGuardoHoy,

            // Estado del composable useModales
            modalNovedadVisible,
            modalSubunidadVisible,
            modalUnidadVisible,
            modalHora,
            modalRol,
            nuevaNovedad,
            nuevaSubunidad,
            nuevaUnidad,
            horaActual,
            nuevaHora,
            cedulaRol,
            nuevoRol,
            rolesDisponibles,

            // Estado local
            unidadSeleccionada,
            cargandoConsolidado,

            // Estado y métodos para precios
            modalPreciosVisible,
            precios,
            cargandoPrecios,
            guardandoPrecios,
            abrirModalPrecios,
            cerrarModalPrecios,
            guardarPrecios,

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
            seleccionarRacion,
            cargarRacionesUnidad,
            guardarRaciones,
            generarPDF,
            generarPDFConsolidado,
            abrirModalNovedad,
            cerrarModalNovedad,
            guardarNovedad,
            abrirModalSubunidad,
            cerrarModalSubunidad,
            guardarSubunidad,
            abrirModalUnidad,
            cerrarModalUnidad,
            guardarUnidad,
            abrirModalHora,
            cerrarModalHora,
            guardarHora,
            abrirModalRol,
            cerrarModalRol,
            guardarRol
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
