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
export const TOP_SCORER_BONUS = 30;
export const TOP_SCORER_CANDIDATES = [
    { id: "messi", name: "Lionel Messi" },
    { id: "mbappe", name: "Kylian Mbappé" },
    { id: "haaland", name: "Erling Haaland" },
    { id: "harry-kane", name: "Harry Kane" },
    { id: "bellingham", name: "Jude Bellingham" },
    { id: "oyarzabal", name: "Mikel Oyarzabal" },
    { id: "dembele", name: "Ousmane Dembélé" }
];

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
        exactScore: 36,          // Marcador exacto (x3)
        correctResult: 15,       // Ganador/empate correcto (x3)
        correctGoalDifference: 6,// Diferencia de gol correcta (x3)
        exactHomeGoals: 6,       // Bono por acertar goles del local (x3)
        exactAwayGoals: 6,       // Bono por acertar goles del visitante (x3)
        knockoutMultiplier: 2,   // Multiplicador x2 en toda la fase final (sin cambios)
        roundBonuses: {          // Bonus extra por ronda (x3)
            R32: 0,
            R16: 0,
            QF: 3,
            SF: 6,
            TP: 6,
            F: 15
        }
    }
};
