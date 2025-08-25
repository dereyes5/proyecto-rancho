import axios from 'axios';

const API_BASE_URL = 'https://brigada17pastaza.com/api';

export const qrService = {
    /**
     * Obtiene la información del QR para un usuario específico
     * @param {string} nombreusuario - Nombre de usuario
     * @returns {Promise} Respuesta con los datos del QR y la información personal
     */
    async obtenerQRUsuario(nombreusuario) {
        try {
            const response = await axios.get(`${API_BASE_URL}/qr/usuario/${nombreusuario}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener QR del usuario:', error);
            throw error;
        }
    },

    /**
     * Obtiene información de raciones basada en QR data
     * @param {string} qrData - Datos del código QR escaneado
     * @returns {Promise} Información de las raciones del usuario
     */
    async obtenerInfoPorQR(qrData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/qr/info`, {
                qrData: qrData
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener información por QR:', error);
            throw error;
        }
    },

    /**
     * Consume una ración específica para un usuario
     * @param {number} idqr - ID del QR del usuario
     * @param {string} racion - Tipo de ración ('desayuno', 'almuerzo', 'merienda')
     * @returns {Promise} Resultado de la operación
     */
    async consumirRacion(idqr, racion) {
        try {
            const response = await axios.post(`${API_BASE_URL}/qr/consumir-racion`, {
                idqr: idqr,
                racion: racion
            });
            return response.data;
        } catch (error) {
            console.error('Error al consumir ración:', error);
            throw error;
        }
    },

    /**
     * Verifica si un QR está activo y es válido
     * @param {string} qrData - Datos del código QR
     * @returns {Promise} Información sobre la validez del QR
     */
    async verificarQR(qrData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/qr/verificar`, {
                qrData: qrData
            });
            return response.data;
        } catch (error) {
            console.error('Error al verificar QR:', error);
            throw error;
        }
    }
};

export default qrService;
