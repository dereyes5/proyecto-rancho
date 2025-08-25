<template>
    
        <!-- Navbar -->
        <Navbar />

        <div class="container mt-4">
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card shadow">
                        <div class="card-header text-center bg-primary text-white">
                            <h4 class="mb-0">
                                <i class="bi bi-qr-code"></i> Mi Código QR
                            </h4>
                        </div>
                    <div class="card-body text-center">
                        <!-- Loading State -->
                        <div v-if="loading" class="py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-2 text-muted">Cargando información del código QR...</p>
                        </div>

                        <!-- Error State -->
                        <div v-else-if="error" class="py-5">
                            <div class="alert alert-danger" role="alert">
                                <i class="bi bi-exclamation-triangle"></i>
                                {{ error }}
                            </div>
                            <button @click="cargarQR" class="btn btn-primary">
                                <i class="bi bi-arrow-clockwise"></i> Reintentar
                            </button>
                        </div>

                        <!-- QR Code and Info -->
                        <div v-else-if="qrInfo">
                            <!-- QR Code -->
                            <div class="mb-4">
                                <div class="qr-container mx-auto">
                                    <canvas
                                        ref="qrCanvas"
                                        class="border rounded"
                                        width="250"
                                        height="250"
                                    ></canvas>
                                </div>
                                <div class="mt-3">
                                    <button @click="descargarQR" class="btn btn-outline-primary btn-sm" :disabled="!qrInfo">
                                        <i class="bi bi-download"></i> Descargar QR
                                    </button>
                                    <button @click="regenerarQR" class="btn btn-outline-secondary btn-sm ms-2" :disabled="!qrInfo">
                                        <i class="bi bi-arrow-clockwise"></i> Regenerar
                                    </button>
                                </div>
                            </div>

                            <!-- User Info -->
                            <div class="user-info">
                                <h5 class="text-primary mb-3">
                                    <i class="bi bi-person-circle"></i> Información Personal
                                </h5>

                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Nombre:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.apellidonombre }}</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Cédula:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.cedula }}</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Grado:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.grado }}</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Unidad:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.unidad }}</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Subunidad:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.subunidad }}</p>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="info-item">
                                            <strong>Novedad:</strong>
                                            <p class="mb-1">{{ qrInfo.personal.novedad }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- QR Info -->
                                <div class="mt-4 pt-3 border-top">
                                    <h6 class="text-muted mb-2">Información del Código QR</h6>
                                    <div class="row g-2">
                                        <div class="col-md-6">
                                            <small class="text-muted">
                                                <strong>Creado:</strong> {{ formatDate(qrInfo.qr.createdAt) }}
                                            </small>
                                        </div>
                                        <div class="col-md-6">
                                            <small class="text-muted">
                                                <strong>Expira:</strong> {{ formatDate(qrInfo.qr.expirationDate) }}
                                            </small>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <span class="badge" :class="qrInfo.qr.isActive ? 'bg-success' : 'bg-danger'">
                                            {{ qrInfo.qr.isActive ? 'Activo' : 'Inactivo' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode';
import { useToast } from 'vue-toastification';
import qrService from '../api/qrService.js';
import Navbar from '../components/Navbar.vue';

export default {
    name: 'QRView',
    components: {
        Navbar
    },
    data() {
        return {
            qrInfo: null,
            loading: true,
            error: null
        };
    },
    setup() {
        const toast = useToast();
        return { toast };
    },
    async mounted() {
        await this.cargarQR();
    },
    watch: {
        qrInfo: {
            handler(newVal) {
                if (newVal && newVal.qr && newVal.qr.qrData) {
                    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
                    setTimeout(() => {
                        this.generarQR(newVal.qr.qrData);
                    }, 100);
                }
            },
            immediate: false
        }
    },
    methods: {
        async cargarQR() {
            this.loading = true;
            this.error = null;

            try {
                const nombreusuario = localStorage.getItem('usuario');
                if (!nombreusuario) {
                    throw new Error('Usuario no encontrado');
                }

                this.qrInfo = await qrService.obtenerQRUsuario(nombreusuario);
                console.log('QR Info cargada:', this.qrInfo);

                // El watcher se encargará de generar el QR cuando qrInfo cambie

            } catch (error) {
                console.error('Error al cargar QR:', error);
                this.error = error.response?.data?.message || error.message || 'Error al cargar la información del código QR';
                this.toast.error(this.error);
            } finally {
                this.loading = false;
            }
        },

        async generarQR(qrData) {
            try {
                const canvas = this.$refs.qrCanvas;

                if (!canvas) {
                    console.warn('Canvas no disponible aún, reintentando...');
                    return;
                }

                await QRCode.toCanvas(canvas, qrData, {
                    width: 250,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                console.log('QR generado exitosamente');
            } catch (error) {
                console.error('Error al generar QR:', error);
                this.toast.error('Error al generar el código QR: ' + error.message);
            }
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                return dateString;
            }
        },

        descargarQR() {
            try {
                const canvas = this.$refs.qrCanvas;
                if (!canvas) return;

                const link = document.createElement('a');
                link.download = `qr_${this.qrInfo?.personal?.cedula || 'usuario'}.png`;
                link.href = canvas.toDataURL();
                link.click();

                this.toast.success('QR descargado exitosamente');
            } catch (error) {
                console.error('Error al descargar QR:', error);
                this.toast.error('Error al descargar el código QR');
            }
        },

        async regenerarQR() {
            if (this.qrInfo && this.qrInfo.qr && this.qrInfo.qr.qrData) {
                await this.generarQR(this.qrInfo.qr.qrData);
            }
        }
    }
};
</script>

<style scoped>
.qr-container {
    max-width: 250px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-item {
    text-align: left;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 5px;
    margin-bottom: 8px;
}

.info-item strong {
    color: #495057;
    font-size: 0.9em;
    display: block;
}

.info-item p {
    color: #212529;
    font-weight: 500;
    margin: 0;
}

.user-info {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
}

.card {
    border: none;
}

.spinner-border {
    width: 3rem;
    height: 3rem;
}

@media (max-width: 768px) {
    .qr-container {
        max-width: 200px;
    }

    .info-item {
        margin-bottom: 10px;
    }
}
</style>
