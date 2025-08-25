import axios from "axios";
// Configuración base de axios
const apiClient = axios.create({
  baseURL: "https://brigada17pastaza.com/api",
  timeout: 60000, // 60 segundos timeout general (aumentado de 30s)
});
// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Opcional: limpiar headers si no hay token
      delete config.headers["Authorization"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Interceptor para manejo de errores globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem("rol");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
class ApiService {
  // Cache para optimizar las consultas
  static cache = new Map();
  static cacheTimeouts = new Map();

  // Método para cache con tiempo de vida
  static setCache(key, data, ttl = 30000) {
    // 30 segundos por defecto
    this.cache.set(key, data);

    // Limpiar cache anterior si existe
    if (this.cacheTimeouts.has(key)) {
      clearTimeout(this.cacheTimeouts.get(key));
    }

    // Establecer nuevo timeout
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.cacheTimeouts.delete(key);
    }, ttl);

    this.cacheTimeouts.set(key, timeout);
  }

  static getCache(key) {
    return this.cache.get(key);
  }

  static clearCache(pattern = null) {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
        key.includes(pattern)
      );
      keysToDelete.forEach((key) => {
        this.cache.delete(key);
        if (this.cacheTimeouts.has(key)) {
          clearTimeout(this.cacheTimeouts.get(key));
          this.cacheTimeouts.delete(key);
        }
      });
    } else {
      this.cache.clear();
      this.cacheTimeouts.forEach((timeout) => clearTimeout(timeout));
      this.cacheTimeouts.clear();
    }
  }
  // ==================== RACIONES ====================

  static async obtenerRaciones(fecha, unidad, useCache = true, normalizarConsumidas = false) {
    const cacheKey = `raciones_${fecha}_${unidad}_${normalizarConsumidas}`;

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/raciones", {
        params: { fecha, unidad },
      });

      // Procesar datos para optimizar el acceso
      const racionesProcesadas = response.data.map((r) => {
        // Normalizar valores -1 a 1 si se requiere (para obtener raciones de días siguientes)
        let desayuno = r.desayuno;
        let almuerzo = r.almuerzo;
        let merienda = r.merienda;

        if (normalizarConsumidas) {
          // Convertir -1 (consumida) a 1 (disponible) para días siguientes
          desayuno = desayuno === -1 ? 1 : desayuno;
          almuerzo = almuerzo === -1 ? 1 : almuerzo;
          merienda = merienda === -1 ? 1 : merienda;

          console.log(`🔄 Normalizando raciones para ${r.apellidonombre}:`, {
            original: { d: r.desayuno, a: r.almuerzo, m: r.merienda },
            normalizado: { d: desayuno, a: almuerzo, m: merienda }
          });
        }

        return {
          ...r,
          // Usar valores normalizados si se requiere
          desayuno,
          almuerzo,
          merienda,
          // Campos pre-calculados para performance
          _idPersonal: r.idPersonal,
          _idqr: r.idqr,
          _nombre: r.apellidonombre,
          _cedula: r.cedula,
          _grado: r.grado,
          _unidad: r.unidad,
          _novedad: r.novedad,
          _subunidad: r.subunidad,
          // Para PantallaRanchero - valores originales (siempre los originales de la BD)
          desayunoOriginal: r.desayuno,
          almuerzoOriginal: r.almuerzo,
          meriendaOriginal: r.merienda,
        };
      });
      if (useCache) {
        this.setCache(cacheKey, racionesProcesadas, 120000); // 2 minutos cache
      }

      return racionesProcesadas;
    } catch (error) {
      console.log(
        `Error en obtenerRaciones(fecha=${fecha}, unidad=${unidad}):`,
        error
      );
      console.error(
        `Error en obtenerRaciones(fecha=${fecha}, unidad=${unidad}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async obtenerRacionesConsumidas(fecha, useCache = true) {
    const cacheKey = `raciones_consumidas_${fecha}`;

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/raciones/consumidas", {
        params: { fecha },
        timeout: 0 // Sin límite de tiempo para el reporte consolidado
      });

      if (useCache) {
        this.setCache(cacheKey, response.data, 120000); // 2 minutos cache
      }

      return response.data;
    } catch (error) {
      console.log(
        `Error en obtenerRacionesConsumidas(fecha=${fecha}):`,
        error
      );
      console.error(
        `Error en obtenerRacionesConsumidas(fecha=${fecha}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async guardarRaciones(raciones) {
    try {
      // Timeout más largo para guardar raciones (60 segundos)
      const response = await apiClient.post("/raciones", raciones, {
        timeout: 120000
      });

      // Limpiar cache relacionado con raciones
      this.clearCache("raciones_");


      return response.data;
    } catch (error) {
      console.error(
        "Error en guardarRaciones:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  // ==================== PERSONAL ====================

  static async obtenerPersonalPorCedula(cedula, useCache = true) {
    const cacheKey = `personal_${cedula}`;

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/personal/buscar", {
        params: { cedula },
      });

      if (useCache) {
        this.setCache(cacheKey, response.data, 300000); // 5 minutos cache
      }

      return response.data;
    } catch (error) {
      console.error(
        `Error en obtenerPersonalPorCedula(cedula=${cedula}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async obtenerUnidades(useCache = true) {
    const cacheKey = "unidades";

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/personal/unidades");

      if (useCache) {
        this.setCache(cacheKey, response.data, 600000); // 10 minutos cache
      }
      console.log("Unidades obtenidas:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Error en obtenerUnidades:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async agregarPersonal(personalData) {
    try {
      const response = await apiClient.post("/personal/agregar", personalData);

      // Limpiar cache relacionado
      this.clearCache("raciones_");
      this.clearCache("unidades");

      return response.data;
    } catch (error) {
      console.error(
        `Error en agregarPersonal:`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async eliminarPersonal(cedula) {
    try {
      const response = await apiClient.delete("/personal/eliminar", {
        params: { cedula }
      });

      // Limpiar cache relacionado
      this.clearCache("raciones_");
      this.clearCache("unidades");

      return response.data;
    } catch (error) {
      console.error(
        `Error en eliminarPersonal(cedula=${cedula}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async actualizarPersonalUnidad(cedula, unidad) {
    try {
      const response = await apiClient.put("/personal", { cedula, unidad });

      // Limpiar cache relacionado
      this.clearCache(`personal_${cedula}`);
      this.clearCache("raciones_");

      return response.data;
    } catch (error) {
      console.error(
        `Error en actualizarPersonalUnidad(cedula=${cedula}, unidad=${unidad}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async actualizarPersonalNovedad(cedula, novedad) {
    try {
      const response = await apiClient.put("/personal/novedad", {
        cedula,
        novedad,
      });

      // Limpiar cache relacionado
      this.clearCache(`personal_${cedula}`);
      this.clearCache("raciones_");

      return response.data;
    } catch (error) {
      console.error(
        `Error en actualizarPersonalNovedad(cedula=${cedula}, novedad=${novedad}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async actualizarPersonalSubunidad(cedula, subunidad) {
    try {
      const response = await apiClient.put("/personal/subunidad", {
        cedula,
        subunidad,
      });

      // Limpiar cache relacionado
      this.clearCache(`personal_${cedula}`);
      this.clearCache("raciones_");

      return response.data;
    } catch (error) {
      console.error(
        `Error en actualizarPersonalSubunidad(cedula=${cedula}, subunidad=${subunidad}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  // ==================== CONFIGURACIONES ====================

  static async obtenerConfiguracion(tipoConfiguracion, useCache = true) {
    const cacheKey = `config_${tipoConfiguracion}`;

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/configuraciones/buscar", {
        params: { tipoConfiguracion },
      });

      if (useCache) {
        this.setCache(cacheKey, response.data, 300000); // 5 minutos cache
      }

      return response.data;
    } catch (error) {
      console.error(
        `Error en obtenerConfiguracion(tipoConfiguracion=${tipoConfiguracion}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async actualizarConfiguracion(tipoConfiguracion, hora) {
    try {
      const response = await apiClient.put("/configuraciones/modificar", {
        tipoConfiguracion,
        hora,
      });

      // Limpiar cache relacionado
      this.clearCache(`config_${tipoConfiguracion}`);

      return response.data;
    } catch (error) {
      console.error(
        `Error en actualizarConfiguracion(tipoConfiguracion=${tipoConfiguracion}, hora=${hora}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  // ==================== ROLES ====================

  static async obtenerRoles(useCache = true) {
    const cacheKey = "roles";

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/roles/nombres");

      if (useCache) {
        this.setCache(cacheKey, response.data, 600000); // 10 minutos cache
      }

      return response.data;
    } catch (error) {
      console.error(
        "Error en obtenerRoles:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async cambiarRolUsuario(nombreUsuario, nuevoRol) {
    try {
      const response = await apiClient.put("/roles/cambiar-rol-usuario", {
        nombreUsuario,
        nuevoRol,
      });

      return response.data;
    } catch (error) {
      console.error(
        `Error en cambiarRolUsuario(nombreUsuario=${nombreUsuario}, nuevoRol=${nuevoRol}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  // ==================== PRECIOS ====================

  static async obtenerPrecios(useCache = true) {
    const cacheKey = "precios";

    if (useCache && this.getCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await apiClient.get("/precios");

      if (useCache) {
        this.setCache(cacheKey, response.data, 300000); // 5 minutos cache
      }

      return response.data;
    } catch (error) {
      console.error(
        "Error en obtenerPrecios:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async actualizarPrecio(comida, precio) {
    try {
      const response = await apiClient.put("/precios/modificar", {
        comida,
        precio,
      });

      // Limpiar cache relacionado
      this.clearCache("precios");

      return response.data;
    } catch (error) {
      console.error(
        `Error en actualizarPrecio(comida=${comida}, precio=${precio}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  // ==================== AUTENTICACIÓN ====================

  static async cambiarContrasena(nombreusuario, nuevaContrasena) {
    try {
      // Para cambiar contraseña usamos axios directamente ya que la ruta es /auth, no /api/auth
      const response = await axios.post("https://brigada17pastaza.com/auth/cambiar-contrasena", {
        nombreusuario,
        nuevaContrasena,
      }, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      return response.data;
    } catch (error) {
      console.error(
        `Error en cambiarContrasena(nombreusuario=${nombreusuario}):`,
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }
}

export default ApiService;
