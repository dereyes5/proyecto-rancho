import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RacionesView from "../views/RacionesView.vue";
import PantallaAdministracion from "../views/PantallaAdministracion.vue"; // 👈 nueva vista
import PantallaRanchero from "../views/PantallaRanchero.vue";
import CambiarContrasenaView from "../views/CambiarContrasenaView.vue";
import QRView from "../views/QRView.vue";

const routes = [
  { path: "/", component: LoginView },
  {
    path: "/raciones",
    component: RacionesView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    component: PantallaAdministracion,
    meta: { requiresAuth: true },
  },
  {
    path: "/ranchero",
    component: PantallaRanchero,
    meta: { requiresAuth: true },
  },
  {
    path: "/cambiar-contrasena",
    component: CambiarContrasenaView,
    meta: { requiresAuth: true },
  },
  {
    path: "/qr",
    component: QRView,
    meta: { requiresAuth: true },
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// protección de rutas privadas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    next("/");
  } else {
    next();
  }
});

export default router;
