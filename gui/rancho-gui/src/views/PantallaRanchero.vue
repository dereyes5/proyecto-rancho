<template>
    <div class="min-vh-100 bg-light">
        <Navbar />

        <!-- Header Section -->
        <div class="container-fluid px-3 py-2">
            <div class="row align-items-center mb-3">
                <div class="col-12 col-md-8">
                    <h4 class="text-primary mb-0 d-flex align-items-center">
                        <i class="bi bi-qr-code-scan me-2"></i>
                        <span class="d-none d-md-inline">Ranchero - </span>{{ unidadUsuario }}
                    </h4>
                    <small class="text-muted">
                        {{ fechaRacionesActuales || fechaHoy }}
                        <span v-if="fechaRacionesActuales && fechaRacionesActuales !== fechaHoy" class="badge bg-warning text-dark ms-1">
                            Datos anteriores
                        </span>
                        <br>
                        <span class="text-info">Hora límite QR: {{ horaLimite }} | Ecuador: {{ horaActualEcuador }}</span>
                    </small>
                </div>
                <div class="col-12 col-md-4 text-md-end mt-2 mt-md-0">
                    <div class="btn-group-vertical btn-group-sm d-md-none w-100" role="group">
                        <button class="btn btn-primary mb-1" @click="mostrarEscaner = true" :disabled="!puedeEscanear">
                            <i class="bi bi-qr-code-scan"></i> Leer QR
                        </button>
                        <button class="btn btn-outline-danger" @click="generarPDF">
                            <i class="bi bi-file-earmark-pdf"></i> PDF
                        </button>
                    </div>
                    <div class="btn-group btn-group-sm d-none d-md-flex" role="group">
                        <button class="btn btn-primary" @click="mostrarEscaner = true" :disabled="!puedeEscanear">
                            <i class="bi bi-qr-code-scan"></i> Leer QR
                        </button>
                        <button class="btn btn-outline-danger" @click="generarPDF">
                            <i class="bi bi-file-earmark-pdf"></i> PDF
                        </button>
                    </div>
                </div>
            </div>

            <!-- Búsqueda responsive -->
            <div class="row mb-3">
                <div class="col-12">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="bi bi-search"></i>
                        </span>
                        <input
                            v-model="busqueda"
                            class="form-control"
                            placeholder="Buscar por nombre, cédula..."
                            type="search"
                        />
                        <button v-if="busqueda" class="btn btn-outline-secondary" @click="busqueda = ''">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Info de hora límite -->
            <div v-if="!puedeEscanear" class="alert alert-info d-flex align-items-center mb-3">
                <i class="bi bi-info-circle me-2"></i>
                <span>El escaneo de QR está disponible después de las {{ horaLimite }}</span>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="cargando" class="text-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Cargando raciones...</p>
        </div>

        <!-- Tabla responsive para móvil -->
        <div v-else class="container-fluid px-3">
            <!-- Vista móvil (cards) -->
            <div class="d-md-none">
                <div v-for="r in racionesOrdenadas" :key="r.id" class="card mb-2 shadow-sm">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="card-title mb-1">{{ r._nombre }}</h6>
                                <small class="text-muted">{{ r._cedula }} - {{ r._grado }}</small>
                            </div>
                            <span class="badge bg-secondary">{{ r._novedad }}</span>
                        </div>

                        <div class="row g-2">
                            <div class="col-4 text-center">
                                <small class="text-muted d-block">Desayuno</small>
                                <div class="form-check d-flex justify-content-center">
                                    <span v-if="r.desayuno === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.desayuno === 1"
                                        :disabled="r.desayunoOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'desayuno', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <small class="text-muted d-block">Almuerzo</small>
                                <div class="form-check d-flex justify-content-center">
                                    <span v-if="r.almuerzo === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.almuerzo === 1"
                                        :disabled="r.almuerzoOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'almuerzo', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </div>
                            </div>
                            <div class="col-4 text-center">
                                <small class="text-muted d-block">Merienda</small>
                                <div class="form-check d-flex justify-content-center">
                                    <span v-if="r.merienda === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.merienda === 1"
                                        :disabled="r.meriendaOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'merienda', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Vista desktop (tabla) -->
            <div class="d-none d-md-block">
                <div class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead class="table-light">
                            <tr>
                                <th v-for="campo in camposOrden" :key="campo.key"
                                    @click="ordenarPor(campo.key)"
                                    style="cursor:pointer"
                                    class="text-center">
                                    {{ campo.label }}
                                    <i :class="orden.campo === campo.key ? (orden.ascendente ? 'bi bi-arrow-down' : 'bi bi-arrow-up') : 'bi bi-arrow-up-down'"></i>
                                </th>
                                <th class="text-center">D</th>
                                <th class="text-center">A</th>
                                <th class="text-center">M</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in racionesOrdenadas" :key="r.id">
                                <td class="text-center">{{ r._cedula }}</td>
                                <td>{{ r._nombre }}</td>
                                <td class="text-center">{{ r._grado }}</td>
                                <td class="text-center">{{ r._unidad }}</td>
                                <td class="text-center">{{ r._novedad }}</td>
                                <td class="text-center">{{ r._subunidad }}</td>
                                <td class="text-center">
                                    <span v-if="r.desayuno === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill" title="Consumido"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.desayuno === 1"
                                        :disabled="r.desayunoOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'desayuno', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </td>
                                <td class="text-center">
                                    <span v-if="r.almuerzo === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill" title="Consumido"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.almuerzo === 1"
                                        :disabled="r.almuerzoOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'almuerzo', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </td>
                                <td class="text-center">
                                    <span v-if="r.merienda === -1" class="text-success">
                                        <i class="bi bi-check-circle-fill" title="Consumido"></i>
                                    </span>
                                    <input
                                        v-else
                                        type="checkbox"
                                        :checked="r.merienda === 1"
                                        :disabled="r.meriendaOriginal === 0"
                                        @change="cambiarRacion(r._idPersonal, 'merienda', $event.target.checked ? 1 : 0)"
                                        class="form-check-input"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal Escáner QR -->
        <div v-if="mostrarEscaner" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-qr-code-scan"></i> Escanear QR
                        </h5>
                        <button type="button" class="btn-close" @click="cerrarEscaner"></button>
                    </div>
                    <div class="modal-body text-center">
                        <!-- Selector de cámaras -->
                        <div v-if="camarasDisponibles.length > 1 && camaraIniciada" class="mb-3">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <small class="text-muted">Cámara actual: {{ camaraSeleccionada?.label }}</small>
                                <button
                                    @click="mostrandoCamaras = !mostrandoCamaras"
                                    class="btn btn-outline-secondary btn-sm"
                                >
                                    <i class="bi bi-camera-video"></i>
                                    <i class="bi bi-chevron-down ms-1"></i>
                                </button>
                            </div>

                            <!-- Lista de cámaras -->
                            <div v-if="mostrandoCamaras" class="list-group mb-3">
                                <button
                                    v-for="camara in camarasDisponibles"
                                    :key="camara.id"
                                    @click="cambiarCamara(camara)"
                                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                    :class="{ 'active': camara.id === camaraSeleccionada?.id }"
                                >
                                    <span>
                                        <i :class="camara.facingMode === 'environment' ? 'bi bi-camera-video' : 'bi bi-camera-video-front'"></i>
                                        {{ camara.label }}
                                    </span>
                                    <small class="text-muted">
                                        {{ camara.facingMode === 'environment' ? 'Trasera' : 'Frontal' }}
                                    </small>
                                </button>
                            </div>
                        </div>

                        <!-- Video para la cámara (siempre presente pero condicionalmente visible) -->
                        <video
                            ref="videoElement"
                            :class="camaraIniciada ? 'w-100 rounded' : 'd-none'"
                            :style="camaraIniciada ? 'max-height: 300px;' : ''"
                            autoplay
                            playsinline
                            muted
                        ></video>

                        <!-- Estado de carga -->
                        <div v-if="!camaraIniciada" class="p-4">
                            <div class="spinner-border text-primary mb-3" role="status"></div>
                            <p>Iniciando cámara...</p>
                            <small class="text-muted">
                                {{ camaraSeleccionada ? `Usando: ${camaraSeleccionada.label}` : 'Detectando cámaras...' }}
                            </small>
                        </div>

                        <!-- Contenido cuando la cámara está activa -->
                        <div v-if="camaraIniciada">
                            <p class="mt-2 text-muted">Enfoca el código QR con la cámara</p>

                            <!-- Indicador de cámara activa -->
                            <div class="mt-2">
                                <small class="text-success">
                                    <i class="bi bi-camera-video-fill"></i>
                                    {{ camaraSeleccionada?.label }} activa
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cerrarEscaner">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Confirmación Ración -->
        <div v-if="mostrarConfirmacion" class="modal show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-check"></i> Confirmar Consumo
                        </h5>
                        <button type="button" class="btn-close" @click="cerrarConfirmacion"></button>
                    </div>
                    <div class="modal-body" v-if="usuarioEscaneado">
                        <div class="text-center mb-3">
                            <img src="https://via.placeholder.com/80x80/007bff/ffffff?text=👤"
                                 class="rounded-circle mb-2" alt="Usuario">
                            <h6>{{ usuarioEscaneado.personal.apellidonombre }}</h6>
                            <small class="text-muted">{{ usuarioEscaneado.personal.cedula }} - {{ usuarioEscaneado.personal.grado }}</small>
                        </div>

                        <p class="text-center mb-3">Selecciona la ración a consumir:</p>

                        <div class="row g-2">
                            <div v-for="(racion, tipo) in racionesDisponibles" :key="tipo" class="col-4">
                                <button
                                    v-if="racion > 0"
                                    @click="consumirRacion(tipo)"
                                    class="btn btn-outline-primary w-100 btn-sm"
                                    :disabled="consumiendo"
                                >
                                    <div class="text-center">
                                        <i :class="iconosRaciones[tipo]"></i>
                                        <small class="d-block">{{ tipo.charAt(0).toUpperCase() + tipo.slice(1) }}</small>
                                    </div>
                                </button>
                                <div v-else class="text-center text-muted p-2">
                                    <i :class="iconosRaciones[tipo]" class="opacity-50"></i>
                                    <small class="d-block opacity-50">No disponible</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="cerrarConfirmacion" :disabled="consumiendo">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import { useRaciones } from '../api/useRaciones.js';
import ApiService from '../api/apiService.js';
import qrService from '../api/qrService.js';
import QrScanner from 'qr-scanner';
import { onMounted, ref, computed, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import { obtenerFechaEcuador, formatearHoraEcuador } from '../api/utils.js';

export default {
    name: 'PantallaRanchero',
    components: { Navbar },
    setup() {
        const toast = useToast();

        // Usar composables para funcionalidad reutilizable
        const {
            raciones,
            busqueda,
            cargando,
            orden,
            camposOrden,
            racionesFiltradas,
            racionesOrdenadas,
            fechaHoy,
            fechaRacionesActuales,
            inicializarRacionesRanchero,
            aplicarCambioEnMemoria,
            ordenarPor,
            exportarPDFRanchero
        } = useRaciones();

        // Estado local específico de esta vista
        const unidadUsuario = ref('');
        const horaLimite = ref('12:00'); // Hora límite por defecto, se carga desde la base de datos

        // Estado del escáner QR
        const mostrarEscaner = ref(false);
        const camaraIniciada = ref(false);
        const videoElement = ref(null);
        const qrScanner = ref(null);
        const camarasDisponibles = ref([]);
        const camaraSeleccionada = ref(null);
        const mostrandoCamaras = ref(false);

        // Estado de confirmación de ración
        const mostrarConfirmacion = ref(false);
        const usuarioEscaneado = ref(null);
        const racionesDisponibles = ref({});
        const consumiendo = ref(false);

        // Iconos para las raciones
        const iconosRaciones = {
            desayuno: 'bi bi-cup-hot',
            almuerzo: 'bi bi-egg-fried',
            merienda: 'bi bi-cup'
        };

        // Computed para verificar si se puede escanear (después de hora límite)
        const puedeEscanear = computed(() => {
            // Usar las nuevas utilidades de timezone de Ecuador
            const fechaEcuador = obtenerFechaEcuador();
            const [h, m] = horaLimite.value.split(':');
            const limiteEcuador = new Date(fechaEcuador);
            limiteEcuador.setHours(parseInt(h), parseInt(m), 0, 0);

            // Formatear horas para mostrar claramente
            const horaActualFormateada = formatearHoraEcuador(fechaEcuador);
            const horaLimiteFormateada = formatearHoraEcuador(limiteEcuador);

            console.log('=== DEBUG HORA LÍMITE PantallaRanchero (Ecuador) ===');
            console.log('Hora local navegador:', new Date().toLocaleTimeString());
            console.log('Hora Ecuador ACTUAL:', horaActualFormateada);
            console.log('Hora límite configurada:', horaLimite.value);
            console.log('Hora límite procesada:', horaLimiteFormateada);
            console.log('Timestamps - Actual:', fechaEcuador.getTime(), 'Límite:', limiteEcuador.getTime());
            console.log('¿Puede escanear?', fechaEcuador >= limiteEcuador);
            console.log('Diferencia en minutos:', Math.round((fechaEcuador.getTime() - limiteEcuador.getTime()) / (1000 * 60)));
            console.log('====================================================');

            return fechaEcuador >= limiteEcuador;
        });

        // Métodos específicos de esta vista
        const obtenerUnidadUsuario = async () => {
            try {
                const cedula = localStorage.getItem('usuario');

                if (!cedula) {
                    toast.error('No se encontró información del usuario');
                    return;
                }

                const personal = await ApiService.obtenerPersonalPorCedula(cedula);
                unidadUsuario.value = personal.unidad;
                localStorage.setItem('unidadRanchero', unidadUsuario.value);
                await inicializarRacionesRanchero(unidadUsuario.value);
            } catch (error) {
                toast.error('Error al obtener información del usuario');
                console.error(error);
            }
        };

        const cargarHoraLimite = async () => {
            try {
                const horaConfig = await ApiService.obtenerConfiguracion('salida_confrontas');
                horaLimite.value = horaConfig || '12:00';
                console.log('Hora límite cargada desde backend (salida_confrontas):', horaLimite.value);
            } catch (error) {
                console.error('Error al cargar hora límite:', error);
                // Usar valor por defecto
                horaLimite.value = '12:00';
            }
        };

        const cambiarRacion = (idPersonal, campo, valor) => {
            aplicarCambioEnMemoria(idPersonal, campo, valor);
        };

        const generarPDF = async () => {
            const fechaActual = fechaRacionesActuales.value || fechaHoy;
            const titulo = `Registro de Raciones - ${fechaActual} - ${unidadUsuario.value}`;
            const nombreArchivo = `raciones_ranchero_${fechaActual}.pdf`;
            await exportarPDFRanchero(titulo, nombreArchivo, true);
        };

        // Métodos del escáner QR
        const detectarCamaras = async () => {
            try {
                console.log('=== INICIANDO DETECCIÓN DE CÁMARAS ===');

                // Verificar si el navegador soporta mediaDevices
                if (!navigator.mediaDevices) {
                    console.error('navigator.mediaDevices no está disponible');
                    toast.error('Tu navegador no soporta acceso a cámaras');
                    return;
                }

                if (!navigator.mediaDevices.enumerateDevices) {
                    console.error('enumerateDevices no está disponible');
                    toast.error('Tu navegador no soporta enumeración de dispositivos');
                    return;
                }

                console.log('Solicitando permisos de cámara...');

                // Solicitar permisos primero
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    console.log('Permisos de cámara obtenidos exitosamente');
                    // Detener el stream inmediatamente
                    stream.getTracks().forEach(track => track.stop());
                } catch (permissionError) {
                    console.error('Error al solicitar permisos de cámara:', permissionError);
                    toast.error('Se necesitan permisos de cámara para continuar');
                    return;
                }

                console.log('Enumerando dispositivos...');
                const dispositivos = await navigator.mediaDevices.enumerateDevices();
                console.log('Dispositivos encontrados:', dispositivos.length);
                console.log('Todos los dispositivos:', dispositivos);

                const camaras = dispositivos.filter(device => device.kind === 'videoinput');
                console.log('Cámaras de video encontradas:', camaras.length);
                console.log('Detalles de cámaras:', camaras);

                if (camaras.length === 0) {
                    console.warn('No se encontraron cámaras de video');
                    toast.warning('No se encontraron cámaras disponibles');
                    return;
                }

                camarasDisponibles.value = camaras.map((camara, index) => {
                    const etiqueta = camara.label || `Cámara ${index + 1}`;
                    const esBackCamera = camara.label.toLowerCase().includes('back') ||
                                       camara.label.toLowerCase().includes('rear') ||
                                       camara.label.toLowerCase().includes('trasera');

                    const camaraInfo = {
                        id: camara.deviceId,
                        label: etiqueta,
                        facingMode: esBackCamera ? 'environment' : 'user',
                        originalLabel: camara.label,
                        groupId: camara.groupId
                    };

                    console.log(`Cámara ${index + 1}:`, camaraInfo);
                    return camaraInfo;
                });

                // Seleccionar cámara por defecto (preferir cámara trasera en móvil)
                const camaraTrasera = camarasDisponibles.value.find(c => c.facingMode === 'environment');
                const camaraFrontal = camarasDisponibles.value.find(c => c.facingMode === 'user');

                // En móvil preferir trasera, en desktop la primera disponible
                const userAgent = navigator.userAgent;
                const esMobil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
                console.log('User Agent:', userAgent);
                console.log('Es dispositivo móvil:', esMobil);

                camaraSeleccionada.value = esMobil ? (camaraTrasera || camaraFrontal) : (camaraFrontal || camaraTrasera);

                console.log('Cámaras detectadas:', camarasDisponibles.value.length);
                console.log('Cámara trasera disponible:', camaraTrasera);
                console.log('Cámara frontal disponible:', camaraFrontal);
                console.log('Cámara seleccionada por defecto:', camaraSeleccionada.value);
                console.log('=== DETECCIÓN DE CÁMARAS COMPLETADA ===');

            } catch (error) {
                console.error('Error al detectar cámaras:', error);
                console.error('Stack trace:', error.stack);
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                toast.error('Error al acceder a las cámaras del dispositivo: ' + error.message);
            }
        };

        const cambiarCamara = async (camara) => {
            try {
                console.log('=== CAMBIANDO CÁMARA ===');
                console.log('Nueva cámara seleccionada:', camara);
                console.log('Cámara anterior:', camaraSeleccionada.value);

                // Detener escáner actual si existe
                if (qrScanner.value) {
                    console.log('Deteniendo escáner actual...');
                    qrScanner.value.stop();
                    qrScanner.value.destroy();
                    qrScanner.value = null;
                }

                camaraSeleccionada.value = camara;
                mostrandoCamaras.value = false;
                camaraIniciada.value = false;

                console.log('Reiniciando escáner con nueva cámara...');
                // Reiniciar con nueva cámara
                await iniciarEscaner();

            } catch (error) {
                console.error('Error al cambiar cámara:', error);
                console.error('Error details:', error.name, error.message);
                toast.error('Error al cambiar de cámara: ' + error.message);
            }
        };

        const iniciarEscaner = async () => {
            try {
                console.log('=== INICIANDO ESCÁNER QR ===');
                camaraIniciada.value = false;

                // Verificación más robusta del elemento de video
                console.log('Verificando elemento de video...');
                console.log('videoElement:', videoElement);
                console.log('videoElement.value:', videoElement.value);
                console.log('Tipo de videoElement.value:', typeof videoElement.value);

                if (!videoElement.value) {
                    console.error('Elemento de video no encontrado - videoElement.value es:', videoElement.value);

                    // Intentar buscar el elemento en el DOM manualmente
                    const videoElementDOM = document.querySelector('video');
                    console.log('Buscando video en DOM:', videoElementDOM);

                    if (videoElementDOM) {
                        console.log('Video encontrado en DOM, asignando...');
                        videoElement.value = videoElementDOM;
                    } else {
                        throw new Error('Elemento de video no encontrado en el DOM');
                    }
                }

                console.log('Elemento de video confirmado:', videoElement.value);
                console.log('Propiedades del elemento video:', {
                    tagName: videoElement.value.tagName,
                    id: videoElement.value.id,
                    className: videoElement.value.className
                });

                // Detectar cámaras si no se ha hecho
                if (camarasDisponibles.value.length === 0) {
                    console.log('No hay cámaras detectadas, ejecutando detección...');
                    await detectarCamaras();
                } else {
                    console.log('Cámaras ya detectadas:', camarasDisponibles.value.length);
                }

                // Verificar si hay cámaras disponibles después de la detección
                if (camarasDisponibles.value.length === 0) {
                    console.error('No se encontraron cámaras después de la detección');
                    throw new Error('No hay cámaras disponibles');
                }

                // Configurar constraints para la cámara
                let constraints;
                if (camaraSeleccionada.value) {
                    console.log('Usando cámara específica:', camaraSeleccionada.value);
                    constraints = {
                        video: {
                            deviceId: { exact: camaraSeleccionada.value.id },
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    };
                } else {
                    console.log('Usando cámara por defecto con facingMode');
                    constraints = {
                        video: {
                            facingMode: { ideal: 'environment' }, // Preferir cámara trasera
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    };
                }

                console.log('Constraints configurados:', constraints);

                // Probar acceso a la cámara antes de crear el QrScanner
                console.log('Probando acceso a la cámara...');
                try {
                    const testStream = await navigator.mediaDevices.getUserMedia(constraints);
                    console.log('Acceso a cámara exitoso, stream:', testStream);
                    console.log('Tracks de video:', testStream.getVideoTracks());
                    testStream.getTracks().forEach(track => {
                        console.log('Track settings:', track.getSettings());
                        track.stop();
                    });
                } catch (streamError) {
                    console.error('Error al acceder a la cámara:', streamError);
                    throw streamError;
                }

                console.log('Creando QrScanner...');
                qrScanner.value = new QrScanner(
                    videoElement.value,
                    result => manejarQREscaneado(result.data),
                    {
                        returnDetailedScanResult: true,
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        preferredCamera: camaraSeleccionada.value?.facingMode || 'environment'
                    }
                );

                console.log('QrScanner creado, iniciando...');
                await qrScanner.value.start();
                console.log('QrScanner iniciado exitosamente');

                camaraIniciada.value = true;
                console.log('=== ESCÁNER QR INICIADO CORRECTAMENTE ===');

            } catch (error) {
                console.error('=== ERROR AL INICIAR ESCÁNER ===');
                console.error('Error:', error);
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Stack trace:', error.stack);

                // Mensajes de error más específicos
                let mensajeError = 'Error al acceder a la cámara: ';
                if (error.name === 'NotAllowedError') {
                    mensajeError += 'Permisos de cámara denegados';
                } else if (error.name === 'NotFoundError') {
                    mensajeError += 'No se encontró ninguna cámara';
                } else if (error.name === 'NotReadableError') {
                    mensajeError += 'Cámara en uso por otra aplicación';
                } else if (error.name === 'OverconstrainedError') {
                    mensajeError += 'Configuración de cámara no soportada';
                } else {
                    mensajeError += error.message;
                }

                toast.error(mensajeError);
                cerrarEscaner();
            }
        };

        const manejarQREscaneado = async (qrData) => {
            try {
                console.log('QR escaneado:', qrData);

                // Detener el escáner
                if (qrScanner.value) {
                    qrScanner.value.stop();
                }

                // Cerrar modal del escáner
                mostrarEscaner.value = false;
                camaraIniciada.value = false;

                // Obtener información del QR
                const infoQR = await qrService.obtenerInfoPorQR(qrData);
                usuarioEscaneado.value = infoQR;

                // Extraer raciones disponibles
                racionesDisponibles.value = {
                    desayuno: infoQR.racion.desayuno,
                    almuerzo: infoQR.racion.almuerzo,
                    merienda: infoQR.racion.merienda
                };

                // Mostrar modal de confirmación
                mostrarConfirmacion.value = true;

            } catch (error) {
                console.error('Error al procesar QR:', error);
                toast.error('Error al procesar el código QR: ' + (error.response?.data?.message || error.message));
                cerrarEscaner();
            }
        };

        const consumirRacion = async (tipoRacion) => {
            try {
                consumiendo.value = true;

                const idqr = usuarioEscaneado.value.racion.idqr.id;

                await qrService.consumirRacion(idqr, tipoRacion);

                toast.success(`${tipoRacion.charAt(0).toUpperCase() + tipoRacion.slice(1)} consumida exitosamente`);

                // Actualizar las raciones en la tabla
                const personal = usuarioEscaneado.value.personal;
                const racionEnTabla = raciones.value.find(r => r._cedula === personal.cedula);

                if (racionEnTabla) {
                    // Actualizar a -1 para mostrar como consumida
                    aplicarCambioEnMemoria(racionEnTabla._idPersonal, tipoRacion, -1);
                }

                cerrarConfirmacion();

            } catch (error) {
                console.error('Error al consumir ración:', error);
                toast.error('Error al consumir la ración: ' + (error.response?.data?.message || error.message));
            } finally {
                consumiendo.value = false;
            }
        };

        const cerrarEscaner = () => {
            if (qrScanner.value) {
                qrScanner.value.stop();
                qrScanner.value.destroy();
                qrScanner.value = null;
            }
            mostrarEscaner.value = false;
            camaraIniciada.value = false;
            mostrandoCamaras.value = false;
        };

        const cerrarConfirmacion = () => {
            mostrarConfirmacion.value = false;
            usuarioEscaneado.value = null;
            racionesDisponibles.value = {};
            consumiendo.value = false;
        };

        // Función para obtener la hora actual de Ecuador (reactiva)
        const horaActualEcuador = ref('');

        const actualizarHoraEcuador = () => {
            // Usar la nueva utilidad centralizada
            horaActualEcuador.value = formatearHoraEcuador();
        };

        // Actualizar la hora cada segundo
        let intervalTimer = null;

        // Watchers para el modal del escáner
        const watchEscaner = () => {
            if (mostrarEscaner.value) {
                console.log('=== MODAL ESCÁNER ABIERTO ===');
                console.log('Estado actual:');
                console.log('- navigator.mediaDevices disponible:', !!navigator.mediaDevices);
                console.log('- getUserMedia disponible:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
                console.log('- enumerateDevices disponible:', !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices));
                console.log('- Protocolo:', window.location.protocol);
                console.log('- Es HTTPS:', window.location.protocol === 'https:');
                console.log('- Es localhost:', window.location.hostname === 'localhost');
                console.log('- User Agent:', navigator.userAgent);
                console.log('- Cámaras ya detectadas:', camarasDisponibles.value.length);

                // Verificar si el elemento de video está disponible antes de continuar
                const esperarElementoVideo = () => {
                    console.log('Verificando elemento de video...');
                    console.log('videoElement.value:', videoElement.value);

                    if (videoElement.value) {
                        console.log('Elemento de video encontrado, iniciando escáner...');
                        iniciarEscaner();
                    } else {
                        console.log('Elemento de video no encontrado, reintentando en 200ms...');
                        setTimeout(esperarElementoVideo, 200);
                    }
                };

                // Esperar un poco más para asegurar que el DOM se renderice
                setTimeout(esperarElementoVideo, 150);
            }
        };

        // Inicialización y limpieza
        onMounted(async () => {
            try {
                // Cargar configuración de hora límite primero
                await cargarHoraLimite();
                // Luego cargar datos del usuario
                await obtenerUnidadUsuario();

                // Inicializar reloj de Ecuador
                actualizarHoraEcuador();
                intervalTimer = setInterval(actualizarHoraEcuador, 1000);
            } catch (error) {
                console.error('Error en inicialización:', error);
            }
        });

        onUnmounted(() => {
            cerrarEscaner();
            if (intervalTimer) {
                clearInterval(intervalTimer);
            }
        });

        // Watch para mostrarEscaner
        const unwatchEscaner = ref(null);
        onMounted(() => {
            unwatchEscaner.value = () => {
                if (mostrarEscaner.value) {
                    watchEscaner();
                }
            };
        });

        return {
            // Estado del composable useRaciones
            raciones,
            busqueda,
            cargando,
            orden,
            camposOrden,
            racionesFiltradas,
            racionesOrdenadas,
            fechaHoy,
            fechaRacionesActuales,

            // Estado local
            unidadUsuario,
            horaLimite,
            puedeEscanear,

            // Estado del escáner
            mostrarEscaner,
            camaraIniciada,
            videoElement,
            camarasDisponibles,
            camaraSeleccionada,
            mostrandoCamaras,

            // Estado de confirmación
            mostrarConfirmacion,
            usuarioEscaneado,
            racionesDisponibles,
            consumiendo,
            iconosRaciones,

            // Métodos
            ordenarPor,
            cambiarRacion,
            generarPDF,
            cerrarEscaner,
            cerrarConfirmacion,
            consumirRacion,
            cambiarCamara,
            horaActualEcuador,
            actualizarHoraEcuador,

            // Watchers
            watchEscaner: () => {
                if (mostrarEscaner.value) {
                    watchEscaner();
                }
            }
        };
    },
    watch: {
        mostrarEscaner(newVal) {
            if (newVal) {
                this.watchEscaner();
            }
        }
    }
};
</script>

<style scoped>
/* Responsive design */
@media (max-width: 768px) {
    .container-fluid {
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
    }

    .card {
        border-radius: 0.5rem;
        transition: transform 0.2s ease-in-out;
    }

    .card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }

    .form-check-input {
        transform: scale(1.2);
    }
}

/* Estilos para el escáner */
video {
    border: 2px solid #007bff;
    border-radius: 0.5rem;
}

/* Lista de cámaras */
.list-group {
    max-height: 200px;
    overflow-y: auto;
    text-align: left;
}

.list-group-item {
    cursor: pointer;
    transition: all 0.2s ease;
}

.list-group-item:hover {
    background-color: #f8f9fa;
}

.list-group-item.active {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
}

.list-group-item.active small {
    color: rgba(255, 255, 255, 0.8) !important;
}

/* Estilos para raciones consumidas */
.text-success i {
    font-size: 1.2em;
}

/* Modal responsive */
@media (max-width: 576px) {
    .modal-dialog {
        margin: 0.5rem;
    }

    .modal-content {
        border-radius: 0.5rem;
    }
}

/* Botones responsivos */
.btn-group-vertical .btn {
    border-radius: 0.375rem !important;
    margin-bottom: 0.25rem;
}

.btn-group-vertical .btn:last-child {
    margin-bottom: 0;
}

/* Input group responsive */
.input-group .btn {
    border-left: 1px solid #ced4da;
}

/* Tabla responsive mejorada */
.table-responsive {
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table {
    margin-bottom: 0;
}

.table th {
    background-color: #f8f9fa;
    border-top: none;
    font-weight: 600;
    font-size: 0.875rem;
}

.table td {
    vertical-align: middle;
    font-size: 0.875rem;
}

/* Badges responsive */
.badge {
    font-size: 0.75rem;
}

/* Loading states */
.spinner-border {
    width: 2rem;
    height: 2rem;
}

/* Alert responsive */
.alert {
    border-radius: 0.5rem;
    border: none;
}

/* Form elements */
.form-check-input:checked {
    background-color: #198754;
    border-color: #198754;
}

.form-check-input:disabled {
    opacity: 0.3;
}

/* Modal enhancements */
.modal-header {
    border-bottom: 1px solid #e9ecef;
    background-color: #f8f9fa;
}

.modal-footer {
    border-top: 1px solid #e9ecef;
    background-color: #f8f9fa;
}

/* Button groups responsive */
@media (min-width: 768px) {
    .btn-group .btn {
        border-radius: 0;
    }

    .btn-group .btn:first-child {
        border-top-left-radius: 0.375rem;
        border-bottom-left-radius: 0.375rem;
    }

    .btn-group .btn:last-child {
        border-top-right-radius: 0.375rem;
        border-bottom-right-radius: 0.375rem;
    }
}

/* Mejoras visuales */
.card-title {
    font-weight: 600;
    color: #495057;
}

.text-muted {
    font-size: 0.875rem;
}

/* Estados hover */
.table tbody tr:hover {
    background-color: #f8f9fa;
}

/* Iconos */
.bi {
    vertical-align: -0.125em;
}

/* Responsive text sizing */
@media (max-width: 576px) {
    h4 {
        font-size: 1.1rem;
    }

    .card-title {
        font-size: 1rem;
    }

    small {
        font-size: 0.8rem;
    }
}
</style>
