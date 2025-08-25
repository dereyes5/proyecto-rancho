<template>
    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom mb-3">
        <div class="container-fluid">
            <!-- Logo y Título de la Brigada -->
            <div class="navbar-brand d-flex align-items-center">
                <img
                    :src="logoBrigada"
                    alt="Logo Brigada N17 Pastaza"
                    class="logo-navbar me-2"
                />
                <span class="titulo-navbar">Brigada N17 Pastaza</span>
            </div>

            <!-- Navegación central -->
            <div class="navbar-nav d-none d-lg-flex flex-row me-auto">
                <router-link
                    to="/cambiar-contrasena"
                    class="nav-link me-3"
                    active-class="active"
                >
                    <i class="bi bi-key"></i> Cambiar Contraseña
                </router-link>
                <router-link
                    v-if="mostrarQR"
                    to="/qr"
                    class="nav-link me-3"
                    active-class="active"
                >
                    <i class="bi bi-qr-code"></i> Mi QR
                </router-link>
            </div>

            <!-- Usuario y cerrar sesión -->
            <div class="d-flex align-items-center">
                <span class="me-3">👤 {{ nombreUsuario }}</span>

                <!-- Menú desplegable para pantallas pequeñas -->
                <div class="dropdown d-lg-none me-2">
                    <button
                        class="btn btn-outline-secondary btn-sm dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                    >
                        <i class="bi bi-list"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <router-link to="/cambiar-contrasena" class="dropdown-item">
                                <i class="bi bi-key"></i> Cambiar Contraseña
                            </router-link>
                        </li>
                        <li v-if="mostrarQR">
                            <router-link to="/qr" class="dropdown-item">
                                <i class="bi bi-qr-code"></i> Mi QR
                            </router-link>
                        </li>
                    </ul>
                </div>

                <button class="btn btn-outline-danger btn-sm" @click="cerrarSesion">
                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                </button>
            </div>
        </div>
    </nav>
</template>

<script>
import { useToast } from 'vue-toastification';
import logoBrigada from '../assets/logobrigada-removebg-preview.png';

export default {
    setup() {
        const toast = useToast();
        return { toast };
    },
    data() {
        return {
            nombreUsuario: localStorage.getItem('usuario') || 'Usuario',
            logoBrigada
        };
    },
    computed: {
        mostrarQR() {
            const rol = localStorage.getItem('rol');
            // Mostrar QR para usuarios con roles especiales (administrador, ranchero, etc.)
            // pero no para roles básicos como 'usuario' o null
            return rol && rol.toLowerCase() !== 'usuario';
        }
    },
    methods: {
        cerrarSesion() {
            localStorage.clear();
            this.$router.push('/');
            this.toast.success('Sesión cerrada correctamente');
        }
    }
};
</script>

<style scoped>
.logo-navbar {
    width: 40px;
    height: auto;
    max-width: 100%;
    object-fit: contain;
}

.titulo-navbar {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1.1rem;
}

.navbar-brand {
    font-size: 1rem;
    margin-right: 1rem;
}

.nav-link {
    color: #6c757d;
    text-decoration: none;
    transition: color 0.15s ease-in-out;
}

.nav-link:hover {
    color: #495057;
}

.nav-link.active {
    color: #0d6efd;
    font-weight: 500;
}

.dropdown-menu {
    border: 1px solid #dee2e6;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

@media (max-width: 576px) {
    .logo-navbar {
        width: 30px;
    }

    .titulo-navbar {
        font-size: 0.9rem;
    }

    .navbar-brand {
        margin-right: 0.5rem;
    }
}
</style>
