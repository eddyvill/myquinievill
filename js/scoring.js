// js/scoring.js
// Sistema de puntuación por fases para la quiniela.
// - Fase de grupos: regla clásica 5-3-1-0.
// - Fase final (16avos en adelante): puntuación aumentada con bonos y multiplicador.

import { SCORING_CONFIG } from './config.js';

function getConfigForMatch(match) {
    if (!match.round) return SCORING_CONFIG.groups;
    if (match.round === 'R32' || match.round === 'R16') return SCORING_CONFIG.knockoutEarly;
    return SCORING_CONFIG.knockoutLate;
}

/**
 * Calcula los puntos de una predicción contra un resultado real.
 * @param {Object} pred - { home, away }
 * @param {Object} match - { homeScore, awayScore, round, status }
 * @returns {Object} { points, breakdown: [{label, points}], isExact, isCorrectResult }
 */
export function calculatePoints(pred, match) {
    const config = getConfigForMatch(match);
    const result = {
        points: 0,
        breakdown: [],
        isExact: false,
        isCorrectResult: false
    };

    if (!pred || pred.home === null || pred.home === undefined || pred.away === null || pred.away === undefined) {
        return result;
    }
    if (match.status !== 'finished' || match.homeScore === null || match.awayScore === null) {
        return result;
    }

    const pHome = pred.home;
    const pAway = pred.away;
    const aHome = match.homeScore;
    const aAway = match.awayScore;

    const predDiff = pHome - pAway;
    const actualDiff = aHome - aAway;

    // 1. Marcador exacto
    if (pHome === aHome && pAway === aAway) {
        result.points += config.exactScore;
        result.breakdown.push({ label: '🎯 Marcador exacto', points: config.exactScore });
        result.isExact = true;
        result.isCorrectResult = true;
    }
    // 2. Resultado correcto (ganador/empate) sin marcador exacto
    else if (
        (pHome > pAway && aHome > aAway) ||
        (pHome < pAway && aHome < aAway) ||
        (pHome === pAway && aHome === aAway)
    ) {
        result.points += config.correctResult;
        result.breakdown.push({ label: '✅ Resultado correcto', points: config.correctResult });
        result.isCorrectResult = true;

        // Bonos por goles de cada equipo (fase final)
        if (config.exactHomeGoals > 0 && pHome === aHome) {
            result.points += config.exactHomeGoals;
            result.breakdown.push({ label: '⚽ Goles local exactos', points: config.exactHomeGoals });
        }
        if (config.exactAwayGoals > 0 && pAway === aAway) {
            result.points += config.exactAwayGoals;
            result.breakdown.push({ label: '⚽ Goles visitante exactos', points: config.exactAwayGoals });
        }
    }
    // 3. Diferencia de gol correcta pero resultado incorrecto
    else if (predDiff === actualDiff && config.correctGoalDifference > 0) {
        result.points += config.correctGoalDifference;
        result.breakdown.push({ label: '📊 Diferencia de gol', points: config.correctGoalDifference });
    }

    // 4. Multiplicador de fase final
    if (match.round && result.points > 0 && config.knockoutMultiplier > 1) {
        const basePoints = result.points;
        result.points *= config.knockoutMultiplier;
        result.breakdown.push({ label: `🏆 x${config.knockoutMultiplier} Fase final`, points: basePoints * (config.knockoutMultiplier - 1) });
    }

    // 5. Bono por ronda (solo fase final)
    if (match.round && config.roundBonuses && config.roundBonuses[match.round] > 0 && result.points > 0) {
        const bonus = config.roundBonuses[match.round];
        result.points += bonus;
        result.breakdown.push({ label: `⭐ Bono ${getRoundDisplayName(match.round)}`, points: bonus });
    }

    return result;
}

function getRoundDisplayName(roundCode) {
    const names = {
        R32: 'Ronda de 32',
        R16: 'Ronda de 16',
        QF: 'Cuartos de Final',
        SF: 'Semifinales',
        TP: 'Tercer Lugar',
        F: 'La Final'
    };
    return names[roundCode] || roundCode;
}

/**
 * Genera una descripción corta de los puntos obtenidos.
 */
export function formatPointsDescription(pointsResult) {
    if (pointsResult.points === 0) return '❌ Sin puntos';
    if (pointsResult.isExact) return `🎯 Exacto +${pointsResult.points}`;
    if (pointsResult.isCorrectResult) return `✅ Acierto +${pointsResult.points}`;
    return `📊 Diferencia +${pointsResult.points}`;
}

/**
 * Genera una lista HTML del desglose de puntos.
 */
export function renderPointsBreakdownHTML(pointsResult) {
    if (pointsResult.points === 0) return '<span class="text-slate-500">Sin puntos</span>';
    const items = pointsResult.breakdown.map(b => `
        <div class="flex justify-between text-xs">
            <span class="text-slate-300">${b.label}</span>
            <span class="font-bold text-fifa-gold">+${b.points}</span>
        </div>
    `).join('');
    return `<div class="space-y-1 mt-2 pt-2 border-t border-slate-700/50">${items}</div>`;
}
