// js/config.js
export const firebaseConfig = {
    apiKey: "AIzaSyCfkCPAvcqtHJhit9aLMY02qX_hTKoTg4I",
    authDomain: "quinielaevill-mundial2026.firebaseapp.com",
    projectId: "quinielaevill-mundial2026",
    storageBucket: "quinielaevill-mundial2026.firebasestorage.app",
    messagingSenderId: "371407927074",
    appId: "1:371407927074:web:a9f1a9317c7b4ec089577b"
};

export const ADMIN_PASSWORD = "Admin2026.."; // Cámbiala aquí fácilmente

// ==========================================
// CONFIGURACIÓN DEL SISTEMA DE PUNTUACIÓN
// ==========================================
// FASE DE GRUPOS: mantiene la puntuación original 5-3-1-0.
// FASE FINAL (16avos en adelante): usa la puntuación aumentada para más competitividad.
export const SCORING_CONFIG = {
    groups: {
        exactScore: 5,           // Marcador exacto
        correctResult: 3,        // Ganador/empate correcto
        correctGoalDifference: 1,// Diferencia de gol correcta
        exactHomeGoals: 0,       // Sin bono de goles exactos en grupos
        exactAwayGoals: 0,
        knockoutMultiplier: 1,   // Sin multiplicador
        roundBonuses: {}
    },
    knockout: {
        exactScore: 12,          // Marcador exacto
        correctResult: 5,        // Ganador/empate correcto
        correctGoalDifference: 2,// Diferencia de gol correcta
        exactHomeGoals: 2,       // Bono por acertar goles del local
        exactAwayGoals: 2,       // Bono por acertar goles del visitante
        knockoutMultiplier: 2,   // Multiplicador x2 en toda la fase final
        roundBonuses: {          // Bonus extra por ronda
            R32: 0,
            R16: 0,
            QF: 1,
            SF: 2,
            TP: 2,
            F: 5
        }
    }
};
