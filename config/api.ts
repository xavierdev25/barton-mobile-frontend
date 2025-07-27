// Configuración de la API
export const API_CONFIG = {
    // Para desarrollo local (cuando usas Expo Go en el mismo dispositivo)
    LOCAL: 'https://barton-mobile-chatbot.onrender.com',

    // Para desarrollo con dispositivo físico (reemplaza con tu IP local)
    DEVICE: 'https://barton-mobile-chatbot.onrender.com', // IP de tu computadora

    // Para producción
    PRODUCTION: 'https://barton-mobile-chatbot.onrender.com'
};

// Función para obtener la URL base según el entorno
export const getApiUrl = (): string => {
    // En desarrollo, puedes cambiar entre LOCAL y DEVICE según necesites
    // return API_CONFIG.LOCAL;

    // Para usar con dispositivo físico, cambia a:
    return API_CONFIG.DEVICE;

    // Para producción:
    // return API_CONFIG.PRODUCTION;
};

// URLs específicas de endpoints
export const API_ENDPOINTS = {
    CHATBOT: `${getApiUrl()}/chatbot-inteligente`,
    NUEVA_SESION: `${getApiUrl()}/nueva-sesion`,
    VERIFICAR_MATRICULA: `${getApiUrl()}/verificar-matricula`,
    COSTOS: `${getApiUrl()}/costos`,
    GRADOS: `${getApiUrl()}/grados`,
    REQUISITOS: `${getApiUrl()}/requisitos`,
    SESION: `${getApiUrl()}/sesion`,
    HISTORIAL: `${getApiUrl()}/historial`,
    DOCUMENTOS: `${getApiUrl()}/documentos`,
    ESTADISTICAS: `${getApiUrl()}/estadisticas`,
    HEALTH: `${getApiUrl()}/health`,
}; 