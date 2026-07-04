// js/knockout.js
// Bracket oficial de la fase final del Mundial 2026 (48 equipos -> 32 clasificados)
// Basado en el formato publicado por FIFA: 12 grupos (A-L), 32 eliminatorias.

const ROUND_NAMES = {
    R32: '16avos de Final',
    R16: '8avos de Final',
    QF: '4tos de Final',
    SF: 'Semifinales',
    TP: 'Tercer Lugar',
    F: 'La Gran Final'
};

const ROUND_TABS = {
    R32: '16avos',
    R16: '8avos',
    QF: '4tos',
    SF: 'Semis',
    TP: '3ro',
    F: 'Final'
};

// Bracket oficial de la FIFA para el Mundial 2026.
// Los slots "3ABCDF" representan al mejor tercer lugar clasificado de esos grupos,
// según la tabla de combinaciones del Anexo C de FIFA.
export const knockoutMatches = [
    // 16avos de Final (Round of 32) - 16 partidos
    // Equipos hardcodeados según clasificación real del Mundial 2026.
    { id: 'M73',  round: 'R32', slotHome: '2A',  slotAway: '2B',      fixedTeams: { home: '🇿🇦 Sudáfrica', away: '🇨🇦 Canadá' }, date: '28/06 15:00', datetime: '2026-06-28T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M74',  round: 'R32', slotHome: '1E',  slotAway: '3ABCDF',  fixedTeams: { home: '🇩🇪 Alemania', away: '🇵🇾 Paraguay' }, date: '29/06 15:00', datetime: '2026-06-29T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M75',  round: 'R32', slotHome: '1F',  slotAway: '2C',      fixedTeams: { home: '🇳🇱 Países Bajos', away: '🇲🇦 Marruecos' }, date: '29/06 15:00', datetime: '2026-06-29T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M76',  round: 'R32', slotHome: '1C',  slotAway: '2F',      fixedTeams: { home: '🇧🇷 Brasil', away: '🇯🇵 Japón' }, date: '29/06 19:30', datetime: '2026-06-29T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M77',  round: 'R32', slotHome: '1I',  slotAway: '3CDFGH',  fixedTeams: { home: '🇫🇷 Francia', away: '🇸🇪 Suecia' }, date: '30/06 15:00', datetime: '2026-06-30T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M78',  round: 'R32', slotHome: '2E',  slotAway: '2I',      fixedTeams: { home: '🇨🇮 Costa de Marfil', away: '🇳🇴 Noruega' }, date: '30/06 15:00', datetime: '2026-06-30T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M79',  round: 'R32', slotHome: '1A',  slotAway: '3CEFHI',  fixedTeams: { home: '🇲🇽 México', away: '🇪🇨 Ecuador' }, date: '30/06 19:30', datetime: '2026-06-30T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M80',  round: 'R32', slotHome: '1L',  slotAway: '3EHIJK',  fixedTeams: { home: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', away: '🇨🇩 RD Congo' }, date: '01/07 12:00', datetime: '2026-07-01T12:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M81',  round: 'R32', slotHome: '1D',  slotAway: '3BEFIJ',  fixedTeams: { home: '🇺🇸 EE.UU.', away: '🇧🇦 Bosnia-Herzegovina' }, date: '01/07 18:00', datetime: '2026-07-01T18:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M82',  round: 'R32', slotHome: '1G',  slotAway: '3AEHIJ',  fixedTeams: { home: '🇧🇪 Bélgica', away: '🇸🇳 Senegal' }, date: '01/07 16:00', datetime: '2026-07-01T16:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M83',  round: 'R32', slotHome: '2K',  slotAway: '2L',      fixedTeams: { home: '🇵🇹 Portugal', away: '🇭🇷 Croacia' }, date: '02/07 15:00', datetime: '2026-07-02T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M84',  round: 'R32', slotHome: '1H',  slotAway: '2J',      fixedTeams: { home: '🇪🇸 España', away: '🇦🇹 Austria' }, date: '02/07 15:00', datetime: '2026-07-02T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M85',  round: 'R32', slotHome: '1B',  slotAway: '3EFGIJ',  fixedTeams: { home: '🇨🇭 Suiza', away: '🇩🇿 Argelia' }, date: '02/07 19:30', datetime: '2026-07-02T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M86',  round: 'R32', slotHome: '1J',  slotAway: '2H',      fixedTeams: { home: '🇦🇷 Argentina', away: '🇨🇻 Cabo Verde' }, date: '03/07 15:00', datetime: '2026-07-03T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M87',  round: 'R32', slotHome: '1K',  slotAway: '3DEIJL',  fixedTeams: { home: '🇨🇴 Colombia', away: '🇬🇭 Ghana' }, date: '03/07 15:00', datetime: '2026-07-03T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M88',  round: 'R32', slotHome: '2D',  slotAway: '2G',      fixedTeams: { home: '🇦🇺 Australia', away: '🇪🇬 Egipto' }, date: '03/07 19:30', datetime: '2026-07-03T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },

    // 8avos de Final (Round of 16) - 8 partidos
    { id: 'M89', round: 'R16', slotHome: 'WM73', slotAway: 'WM74', fixedTeams: { home: '🇨🇦 Canadá', away: '🇲🇦 Marruecos' }, date: '04/07 13:00', datetime: '2026-07-04T13:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M90', round: 'R16', slotHome: 'WM75', slotAway: 'WM76', fixedTeams: { home: '🇵🇾 Paraguay', away: '🇫🇷 Francia' }, date: '04/07 17:00', datetime: '2026-07-04T17:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M91', round: 'R16', slotHome: 'WM77', slotAway: 'WM78', fixedTeams: { home: '🇧🇷 Brasil', away: '🇳🇴 Noruega' }, date: '05/07 16:00', datetime: '2026-07-05T16:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M92', round: 'R16', slotHome: 'WM79', slotAway: 'WM80', fixedTeams: { home: '🇲🇽 México', away: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra' }, date: '05/07 20:00', datetime: '2026-07-05T20:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M93', round: 'R16', slotHome: 'WM81', slotAway: 'WM82', fixedTeams: { home: '🇵🇹 Portugal', away: '🇪🇸 España' }, date: '06/07 15:00', datetime: '2026-07-06T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M94', round: 'R16', slotHome: 'WM83', slotAway: 'WM84', fixedTeams: { home: '🇺🇸 EE.UU.', away: '🇧🇪 Bélgica' }, date: '06/07 20:00', datetime: '2026-07-06T20:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M95', round: 'R16', slotHome: 'WM85', slotAway: 'WM86', fixedTeams: { home: '🇦🇷 Argentina', away: '🇪🇬 Egipto' }, date: '07/07 12:00', datetime: '2026-07-07T12:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M96', round: 'R16', slotHome: 'WM87', slotAway: 'WM88', fixedTeams: { home: '🇨🇭 Suiza', away: '🇨🇴 Colombia' }, date: '07/07 16:00', datetime: '2026-07-07T16:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },


    // 4tos de Final - 4 partidos
    { id: 'M97', round: 'QF', slotHome: 'WM89', slotAway: 'WM90', date: '10/07 15:00', datetime: '2026-07-10T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M98', round: 'QF', slotHome: 'WM91', slotAway: 'WM92', date: '10/07 19:30', datetime: '2026-07-10T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M99', round: 'QF', slotHome: 'WM93', slotAway: 'WM94', date: '11/07 15:00', datetime: '2026-07-11T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M100', round: 'QF', slotHome: 'WM95', slotAway: 'WM96', date: '11/07 19:30', datetime: '2026-07-11T19:30:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },

    // Semifinales - 2 partidos
    { id: 'M101', round: 'SF', slotHome: 'WM97', slotAway: 'WM98', date: '14/07 20:00', datetime: '2026-07-14T20:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },
    { id: 'M102', round: 'SF', slotHome: 'WM99', slotAway: 'WM100', date: '15/07 20:00', datetime: '2026-07-15T20:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },

    // Tercer Lugar
    { id: 'M103', round: 'TP', slotHome: 'LM101', slotAway: 'LM102', date: '18/07 16:00', datetime: '2026-07-18T16:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null },

    // Final
    { id: 'M104', round: 'F', slotHome: 'WM101', slotAway: 'WM102', date: '19/07 15:00', datetime: '2026-07-19T15:00:00-04:00', status: 'scheduled', homeScore: null, awayScore: null }
];

export function getRoundName(roundCode) {
    return ROUND_NAMES[roundCode] || roundCode;
}

export function getRoundTabName(roundCode) {
    return ROUND_TABS[roundCode] || roundCode;
}

// Calcular tabla de un grupo a partir de los partidos terminados
export function calculateGroupStandings(matches, group) {
    const groupMatches = matches.filter(m => m.group === group && m.status === 'finished');
    const teams = {};
    const uniqueTeams = new Set();

    matches.filter(m => m.group === group).forEach(m => {
        uniqueTeams.add(m.homeTeam);
        uniqueTeams.add(m.awayTeam);
    });

    uniqueTeams.forEach(team => {
        teams[team] = { name: team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
    });

    groupMatches.forEach(match => {
        const home = teams[match.homeTeam];
        const away = teams[match.awayTeam];
        const hScore = match.homeScore;
        const aScore = match.awayScore;

        home.pj++; away.pj++;
        home.gf += hScore; home.gc += aScore; home.dg = home.gf - home.gc;
        away.gf += aScore; away.gc += hScore; away.dg = away.gf - away.gc;

        if (hScore > aScore) { home.g++; home.pts += 3; away.p++; }
        else if (hScore < aScore) { away.g++; away.pts += 3; home.p++; }
        else { home.e++; home.pts += 1; away.e++; away.pts += 1; }
    });

    return Object.values(teams).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });
}

// Calcular y rankear TODOS los terceros lugares de los 12 grupos
function calculateAllThirdPlaceTeams(matches) {
    const thirdPlaces = [];
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];

    groups.forEach(group => {
        const standings = calculateGroupStandings(matches, group);
        if (standings.length >= 3) {
            const team = standings[2];
            thirdPlaces.push({ ...team, group });
        }
    });

    // Ordenar por puntos, diferencia de gol, goles a favor
    return thirdPlaces.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });
}

// Asignar los 8 mejores terceros a los slots del bracket de forma greedy.
// Cada slot "3ABCDF" acepta un tercer lugar de esos grupos.
function assignThirdPlaceTeams(matches, knockoutMatches) {
    const allThird = calculateAllThirdPlaceTeams(matches);
    const top8 = allThird.slice(0, 8);
    const used = new Set();
    const assignments = {};

    // Procesar slots en orden de aparición en el bracket
    knockoutMatches.forEach(match => {
        [match.slotHome, match.slotAway].forEach(slot => {
            const multiGroupMatch = slot.match(/^3([A-L]+)$/);
            if (multiGroupMatch) {
                const allowedGroups = multiGroupMatch[1].split('');
                const candidate = top8.find(t => allowedGroups.includes(t.group) && !used.has(t.group));
                if (candidate) {
                    used.add(candidate.group);
                    assignments[slot] = candidate.name;
                }
            }
        });
    });

    return assignments;
}

// Resolver un slot a un equipo real o placeholder descriptivo
export function resolveSlot(slot, allMatches, thirdPlaceAssignments = {}) {
    // Slot de grupo: 1A, 2B ...
    const groupSlotRegex = /^([123])([A-L])$/;
    const groupMatch = slot.match(groupSlotRegex);
    if (groupMatch) {
        const position = parseInt(groupMatch[1]);
        const group = groupMatch[2];
        const standings = calculateGroupStandings(allMatches, group);
        if (standings.length >= position) {
            const team = standings[position - 1];
            return {
                name: team.name,
                resolved: true,
                source: `${position === 1 ? '1º' : position === 2 ? '2º' : '3º'} Grupo ${group}`,
                team
            };
        }
        return {
            name: `${position === 1 ? '1º' : position === 2 ? '2º' : '3º'} Grupo ${group}`,
            resolved: false,
            source: `Grupo ${group} sin definir`,
            team: null
        };
    }

    // Slot de mejor tercer lugar: 3ABCDF
    const multiGroupMatch = slot.match(/^3([A-L]+)$/);
    if (multiGroupMatch) {
        if (thirdPlaceAssignments[slot]) {
            return {
                name: thirdPlaceAssignments[slot],
                resolved: true,
                source: `Mejor 3º de ${multiGroupMatch[1].split('').join('/')}`,
                team: null
            };
        }
        return {
            name: `3º ${multiGroupMatch[1].split('').join('/')}`,
            resolved: false,
            source: `Mejor 3º de ${multiGroupMatch[1].split('').join('/')}`,
            team: null
        };
    }

    // Slot de ganador/perdedor de partido: WM73, LM73, etc.
    const winnerRegex = /^W([A-Z0-9-]+)$/;
    const loserRegex = /^L([A-Z0-9-]+)$/;
    const winnerMatch = slot.match(winnerRegex);
    const loserMatch = slot.match(loserRegex);

    if (winnerMatch || loserMatch) {
        const isWinner = !!winnerMatch;
        const matchId = (winnerMatch || loserMatch)[1];
        const match = allMatches.find(m => m.id === matchId);
        if (!match) {
            return { name: isWinner ? `Ganador ${matchId}` : `Perdedor ${matchId}`, resolved: false, source: slot, team: null };
        }
        if (match.status === 'finished' && match.homeScore !== null && match.awayScore !== null) {
            let winner, loser;
            if (match.homeScore > match.awayScore) { winner = match.homeTeam; loser = match.awayTeam; }
            else if (match.homeScore < match.awayScore) { winner = match.awayTeam; loser = match.homeTeam; }
            else {
                // Empate en fase final: requiere definición por penales.
                return { name: `Ganador ${matchId} (penales)`, resolved: false, source: `${slot} - requiere definición`, team: null };
            }
            const teamName = isWinner ? winner : loser;
            return { name: teamName, resolved: true, source: `${isWinner ? 'Ganador' : 'Perdedor'} ${matchId}`, team: null };
        }
        return {
            name: isWinner ? `Ganador ${matchId}` : `Perdedor ${matchId}`,
            resolved: false,
            source: slot,
            team: null
        };
    }

    return { name: slot, resolved: false, source: slot, team: null };
}

// Resolver todos los partidos de la fase final
export function resolveKnockoutMatches(knockoutMatches, allMatches) {
    const thirdPlaceAssignments = assignThirdPlaceTeams(allMatches, knockoutMatches);

    return knockoutMatches.map(match => {
        // Si el partido tiene equipos fijos (16avos hardcodeados), usarlos directamente
        if (match.fixedTeams && match.fixedTeams.home && match.fixedTeams.away) {
            return {
                ...match,
                homeTeam: match.fixedTeams.home,
                awayTeam: match.fixedTeams.away,
                homeResolved: true,
                awayResolved: true,
                homeSource: match.slotHome,
                awaySource: match.slotAway
            };
        }

        const home = resolveSlot(match.slotHome, allMatches, thirdPlaceAssignments);
        const away = resolveSlot(match.slotAway, allMatches, thirdPlaceAssignments);
        return {
            ...match,
            homeTeam: home.name,
            awayTeam: away.name,
            homeResolved: home.resolved,
            awayResolved: away.resolved,
            homeSource: home.source,
            awaySource: away.source
        };
    });
}
