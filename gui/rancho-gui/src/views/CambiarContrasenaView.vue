<template>
    <div>
        <Navbar />
        <div class="container mt-4">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="bi bi-key"></i> Cambiar Contraseña
                            </h5>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="cambiarContrasena">
                                <div class="mb-3">
                                    <label for="usuario" class="form-label">Usuario:</label>
                                    <input
                                        type="text"
                                        id="usuario"
                                        class="form-control"
                                        :value="nombreUsuario"
                                        readonly
                                        disabled
                                    />
                                    <small class="form-text text-muted">
                                        Usuario actual (no se puede modificar)
                                    </small>
                                </div>

                                <div class="mb-3">
                                    <label for="nuevaContrasena" class="form-label">Nueva Contraseña:</label>
                                    <div class="input-group">
                                        <input
                                            :type="mostrarContrasena ? 'text' : 'password'"
                                            id="nuevaContrasena"
                                            class="form-control"
                                            v-model="nuevaContrasena"
                                            required
                                            minlength="4"
                                            placeholder="Ingrese su nueva contraseña"
                                        />
                                        <button
                                            type="button"
                                            class="btn btn-outline-secondary"
                                            @click="mostrarContrasena = !mostrarContrasena"
                                        >
                                            <i :class="mostrarContrasena ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                        </button>
                                    </div>
                                    <small class="form-text text-muted">
                                        Mínimo 4 caracteres
                                    </small>
                                </div>

                                <div class="mb-3">
                                    <label for="confirmarContrasena" class="form-label">Confirmar Nueva Contraseña:</label>
                                    <input
                                        :type="mostrarContrasena ? 'text' : 'password'"
                                        id="confirmarContrasena"
                                        class="form-control"
                                        v-model="confirmarContrasena"
                                        required
                                        minlength="4"
                                        placeholder="Confirme su nueva contraseña"
                                        :class="{ 'is-invalid': confirmarContrasena && nuevaContrasena !== confirmarContrasena }"
                                    />
                                    <div v-if="confirmarContrasena && nuevaContrasena !== confirmarContrasena" class="invalid-feedback">
                                        Las contraseñas no coinciden
                                    </div>
                                </div>

                                <div class="d-grid gap-2">
                                    <button
                                        type="submit"
                                        class="btn btn-primary"
                                        :disabled="cargando || nuevaContrasena !== confirmarContrasena || !nuevaContrasena"
                                    >
                                        <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                                        <i v-else class="bi bi-check-circle me-2"></i>
                                        {{ cargando ? 'Cambiando...' : 'Cambiar Contraseña' }}
                                    </button>
                                    <button
                                        type="button"
                                        class="btn btn-secondary"
                                        @click="volver"
                                        :disabled="cargando"
                                    >
                                        <i class="bi bi-arrow-left me-2"></i>
                                        Volver
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Navbar from '../components/Navbar.vue';
import ApiService from '../api/apiService.js';
import { useToast } from 'vue-toastification';

export default {
    name: 'CambiarContrasenaView',
    components: {
        Navbar
    },
    setup() {
        const toast = useToast();
        return { toast };
    },
    data() {
        return {
            nombreUsuario: '',
            nuevaContrasena: '',
            confirmarContrasena: '',
            mostrarContrasena: false,
            cargando: false
        };
    },
    mounted() {
        // Obtener el usuario del localStorage
        this.nombreUsuario = localStorage.getItem('usuario') || '';
        if (!this.nombreUsuario) {
            this.toast.error('No se encontró información del usuario');
            this.$router.push('/login');
        }
    },
    methods: {
        async cambiarContrasena() {
            if (this.nuevaContrasena !== this.confirmarContrasena) {
                this.toast.error('Las contraseñas no coinciden');
                return;
            }

            if (this.nuevaContrasena.length < 4) {
                this.toast.error('La contraseña debe tener al menos 4 caracteres');
                return;
            }

            this.cargando = true;

            try {
                await ApiService.cambiarContrasena(this.nombreUsuario, this.nuevaContrasena);

                this.toast.success('Contraseña cambiada exitosamente');

                // Limpiar formulario
                this.nuevaContrasena = '';
                this.confirmarContrasena = '';

                // Opcional: redirigir después de un breve delay
                setTimeout(() => {
                    this.volver();
                }, 2000);

            } catch (error) {
                console.error('Error al cambiar contraseña:', error);
                this.toast.error('Error al cambiar la contraseña. Verifique los datos e intente nuevamente.');
            } finally {
                this.cargando = false;
            }
        },
        volver() {
            // Regresar a la página anterior o al dashboard
            if (window.history.length > 1) {
                this.$router.go(-1);
            } else {
                this.$router.push('/raciones');
            }
        }
    }
};
</script>

<style scoped>
.card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.input-group .btn {
    border-left: 0;
}

.form-control:disabled {
    background-color: #f8f9fa;
}

.text-muted {
    font-size: 0.875rem;
}
</style>
