<template>
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-4">
                <!-- Logo y Título -->
                <div class="text-center mb-4">
                    <img
                        :src="logoBrigada"
                        alt="Logo Brigada N17 Pastaza"
                        class="logo-login mb-3"
                    />
                    <h2 class="titulo-brigada">Brigada N17 Pastaza</h2>
                    <p class="subtitulo-login text-muted">Sistema de Gestión de Rancho</p>
                </div>

                <div class="card">
                    <div class="card-header text-center">Iniciar Sesión</div>
                    <div class="card-body">
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label for="usuario" class="form-label">Usuario</label>
                                <input v-model="nombreusuario" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label for="contrasena" class="form-label">Contraseña</label>
                                <input v-model="contrasena" type="password" class="form-control" required />
                            </div>
                            <button type="submit" class="btn btn-primary w-100">
                                <i class="bi bi-box-arrow-in-right"></i> Entrar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import logoBrigada from '../assets/logobrigada-removebg-preview.png';

export default {
    data() {
        return {
            nombreusuario: '',
            contrasena: '',
            logoBrigada
        };
    },
    setup() {
        const toast = useToast();
        return { toast };
    },
    methods: {
        async login() {
            try {
                const response = await axios.post('https://brigada17pastaza.com/auth/login', {
                    nombreusuario: this.nombreusuario,
                    constrasena: this.contrasena
                });

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('usuario', response.data.usuario);
                localStorage.setItem('rol', response.data.rol);

                console.log('Token:', response.data.token);
                console.log('Usuario:', response.data.usuario);
                console.log('Rol:', response.data.rol);
                this.toast.success('Inicio de sesión exitoso');

                const userRol = response.data.rol ? response.data.rol.toLowerCase() : '';
                if (userRol === 'administrador') {
                    this.$router.push('/admin');
                } else if (userRol === 'ranchero') {
                    this.$router.push('/ranchero');
                } else if (userRol === 'usuario') {
                    // Para usuarios con rol "usuario", ir directamente a la vista del QR
                    this.$router.push('/qr');
                } else {
                    // Para otros usuarios (roles no especificados o diferentes), ir a raciones
                    this.$router.push('/raciones');
                }
            } catch (err) {
                this.toast.error('Credenciales incorrectas');
            }
        }
    }
};
</script>

<style scoped>
.logo-login {
    width: 120px;
    height: auto;
    max-width: 100%;
    object-fit: contain;
}

.titulo-brigada {
    color: #2c3e50;
    font-weight: bold;
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    text-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.subtitulo-login {
    font-size: 0.9rem;
    margin-bottom: 0;
}

.card {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 10px;
}

.card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px 10px 0 0 !important;
    font-weight: 600;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    font-weight: 600;
    padding: 12px;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.form-control {
    border-radius: 8px;
    border: 2px solid #e9ecef;
    transition: border-color 0.3s ease;
}

.form-control:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

@media (max-width: 576px) {
    .logo-login {
        width: 90px;
    }

    .titulo-brigada {
        font-size: 1.5rem;
    }

    .col-md-4 {
        padding: 0 20px;
    }
}
</style>
