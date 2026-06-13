// js/app.js
import { firebaseConfig, ADMIN_PASSWORD } from './config.js';
import { allMatches } from './data.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, getDocs, writeBatch, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let matchesData = [];
let predictionsData = {};
let activeGroup = 'A';

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const savedName = localStorage.getItem(`quiniela_name_${user.uid}`);
        if (savedName) {
            document.getElementById('user-display').textContent = `👤 ${savedName}`;
            document.getElementById('login-modal').classList.add('hidden');
            initApp();
        } else {
            document.getElementById('login-modal').classList.remove('hidden');
        }
    } else {
        await signInAnonymously(auth);
    }
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const name = document.getElementById('username-input').value.trim();
    if (!name) return alert("Ingresa un nombre");
    localStorage.setItem(`quiniela_name_${currentUser.uid}`, name);
    document.getElementById('user-display').textContent = `👤 ${name}`;
    document.getElementById('login-modal').classList.add('hidden');
    await setDoc(doc(db, "users", currentUser.uid), { name, uid: currentUser.uid, lastActive: new Date() }, { merge: true });
    initApp();
});

// ==========================================
// 2. INICIALIZACIÓN Y FUSIÓN DE DATOS
// ==========================================
function initApp() {
    onSnapshot(collection(db, "matches"), (snapshot) => {
        const firebaseMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        matchesData = allMatches.map(localMatch => {
            const fbMatch = firebaseMatches.find(m => m.id === localMatch.id);
            return {
                ...localMatch,
                status: fbMatch ? fbMatch.status : localMatch.status,
                homeScore: fbMatch ? fbMatch.homeScore : localMatch.homeScore,
                awayScore: fbMatch ? fbMatch.awayScore : localMatch.awayScore
            };
        });

        // <-- AGREGAR ESTAS 2 LÍNEAS PARA QUE EL ADMIN PUEDA VER LOS DATOS
        window.matchesData = matchesData;
        window.db = db;

        renderTabs();
        renderMatches();
    });

    onSnapshot(collection(db, "predictions"), (snapshot) => {
        predictionsData = {};
        snapshot.docs.forEach(doc => { predictionsData[doc.id] = doc.data(); });
        calculateAndRender();
    });
}   

// ==========================================
// 3. RENDERIZADO DE INTERFAZ
// ==========================================
window.setGroup = function(group) {
    activeGroup = group;
    renderTabs();
    renderMatches();
};

function renderTabs() {
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    const container = document.getElementById('group-tabs');
    container.innerHTML = groups.map(g => `
        <button onclick="window.setGroup('${g}')" class="tab-btn px-4 py-2 rounded-full border border-slate-600 text-sm font-bold ${activeGroup === g ? 'active' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
            Grupo ${g}
        </button>
    `).join('');
}

function renderMatches() {
    const container = document.getElementById('matches-container');
    const groupMatches = matchesData.filter(m => m.group === activeGroup);
    const now = new Date();
    
    if (groupMatches.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-slate-500">No hay partidos en este grupo aún.</div>`;
        return;
    }

    container.innerHTML = groupMatches.map(match => {
        const matchTime = new Date(match.datetime);
        const isLocked = match.status === "finished" || now >= matchTime;
        const resultClass = match.resultClass || "border-slate-700 bg-slate-800/40";
        const actualScore = match.status === "finished" ? `<div class="mt-2 pt-2 border-t border-slate-700 text-center"><span class="text-fifa-gold text-xs font-bold uppercase"><i class="fas fa-flag-checkered mr-1"></i> Final: ${match.homeScore} - ${match.awayScore}</span></div>` : '';
        const myH = match.myHome !== null ? match.myHome : '';
        const myA = match.myAway !== null ? match.myAway : '';
        
        const lockBadge = isLocked ? `<div class="mt-2 text-center"><span class="locked-badge text-[10px] sm:text-xs font-bold uppercase px-2 py-1 rounded inline-flex items-center gap-1"><i class="fas fa-lock"></i> Cerrado</span></div>` : '';
        const clearBtn = !isLocked && (match.myHome !== null || match.myAway !== null) ? `
            <button onclick="window.clearPrediction('${match.id}')" class="mt-3 w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded-lg transition flex items-center justify-center gap-2 border border-red-900/30">
                <i class="fas fa-trash-alt"></i> Borrar
            </button>` : '';

        return `
        <div class="match-card rounded-xl p-3 border-2 ${resultClass}">
            <div class="flex items-center justify-between gap-2">
                <div class="flex-1 text-right min-w-0"><div class="font-title font-bold text-sm sm:text-base text-white truncate">${match.homeTeam}</div></div>
                <div class="flex items-center gap-1 sm:gap-2 bg-slate-900 px-2 py-2 sm:px-3 sm:py-3 rounded-lg border border-slate-600 shrink-0">
                    <input type="number" inputmode="numeric" pattern="[0-9]*" class="score-input" value="${myH}" onchange="window.savePrediction('${match.id}', 'home', this.value)" ${isLocked ? 'disabled' : ''}>
                    <span class="text-slate-500 font-bold text-xs sm:text-sm">-</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" class="score-input" value="${myA}" onchange="window.savePrediction('${match.id}', 'away', this.value)" ${isLocked ? 'disabled' : ''}>
                </div>
                <div class="flex-1 text-left min-w-0"><div class="font-title font-bold text-sm sm:text-base text-white truncate">${match.awayTeam}</div></div>
            </div>
            ${!isLocked ? `<div class="text-center mt-2"><span class="text-[10px] sm:text-xs text-slate-400 font-semibold bg-slate-900/50 px-2 py-1 rounded"><i class="far fa-clock mr-1"></i>${match.date}</span></div>` : ''}
            ${lockBadge}${clearBtn}${actualScore}
        </div>`;
    }).join('');
}

// ==========================================
// 4. LÓGICA DE PUNTUACIÓN (5 - 3 - 1 - 0)
// ==========================================
function calculateAndRender() {
    if (matchesData.length === 0) return;
    
    let leaderboard = {};
    let userStats = { score: 0, exacts: 0 };

    matchesData.forEach(match => {
        const isFinished = match.status === "finished";
        const predKey = `${currentUser.uid}_${match.id}`;
        const myPred = predictionsData[predKey];
        
        match.myHome = myPred ? myPred.home : null;
        match.myAway = myPred ? myPred.away : null;
        match.resultClass = ""; // Resetear clase visual

        // --- CÁLCULO PARA EL USUARIO ACTUAL ---
        if (isFinished && myPred && myPred.home !== null && match.homeScore !== null) {
            const predDiff = myPred.home - myPred.away;
            const actualDiff = match.homeScore - match.awayScore;

            if (myPred.home === match.homeScore && myPred.away === match.awayScore) {
                // NIVEL 1: Marcador Exacto (5 pts)
                userStats.score += 5;
                userStats.exacts += 1;
                match.resultClass = "exact-match";
            } else if (
                (myPred.home > myPred.away && match.homeScore > match.awayScore) ||
                (myPred.home < myPred.away && match.homeScore < match.awayScore) ||
                (myPred.home === myPred.away && match.homeScore === match.awayScore)
            ) {
                // NIVEL 2: Resultado Correcto (3 pts)
                userStats.score += 3;
                match.resultClass = "winner-match";
            } else if (predDiff === actualDiff) {
                // NIVEL 3: Diferencia de Goles Correcta (1 pt)
                userStats.score += 1;
                match.resultClass = "winner-match"; // Mismo color amarillo para "parcialmente correcto"
            } else {
                // NIVEL 4: Fallo Total (0 pts)
                match.resultClass = "lost-match";
            }
        }

        // --- CÁLCULO PARA EL LEADERBOARD (Todos los jugadores) ---
        Object.keys(predictionsData).forEach(key => {
            if (!key.endsWith(`_${match.id}`)) return;
            
            const [uid] = key.split('_');
            const pred = predictionsData[key];
            
            if (!leaderboard[uid]) {
                leaderboard[uid] = { name: "...", exacts: 0, score: 0 };
            }

            if (isFinished && pred.home !== null && match.homeScore !== null) {
                const predDiff = pred.home - pred.away;
                const actualDiff = match.homeScore - match.awayScore;

                if (pred.home === match.homeScore && pred.away === match.awayScore) {
                    leaderboard[uid].score += 5;
                    leaderboard[uid].exacts += 1;
                } else if (
                    (pred.home > pred.away && match.homeScore > match.awayScore) ||
                    (pred.home < pred.away && match.homeScore < match.awayScore) ||
                    (pred.home === pred.away && match.homeScore === match.awayScore)
                ) {
                    leaderboard[uid].score += 3;
                } else if (predDiff === actualDiff) {
                    leaderboard[uid].score += 1;
                }
            }
        });
    });

    // Actualizar UI
    document.getElementById('user-score').textContent = userStats.score;
    
    getDocs(collection(db, "users")).then(snapshot => {
        snapshot.docs.forEach(doc => { 
            if (leaderboard[doc.id]) leaderboard[doc.id].name = doc.data().name; 
        });
        document.getElementById('total-players').textContent = Object.keys(leaderboard).length;
        
        const sorted = Object.values(leaderboard).sort((a, b) => b.score - a.score);
        renderLeaderboard(sorted);
        renderMatches(); // Re-renderizar para aplicar los colores de borde
    });
}

function renderLeaderboard(data) {
    const tbody = document.getElementById('leaderboard-body');
    if (data.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-slate-500">Sin datos</td></tr>`; 
        return; 
    }
    tbody.innerHTML = data.map((p, i) => {
        const isMe = p.name === localStorage.getItem(`quiniela_name_${currentUser.uid}`);
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
        return `<tr class="${isMe ? 'bg-fifa-gold/10' : ''}">
            <td class="px-3 py-3 font-bold">${medal}</td>
            <td class="px-3 py-3 font-semibold text-white text-left">${p.name} ${isMe ? '<span class="text-fifa-gold text-xs">(Tú)</span>' : ''}</td>
            <td class="px-3 py-3 text-center text-emerald-400">${p.exacts}</td>
            <td class="px-3 py-3 text-right font-bold text-fifa-gold">${p.score}</td>
        </tr>`;
    }).join('');
}

// ==========================================
// 5. TABLA DE CLASIFICACIÓN DE GRUPOS
// ==========================================
window.openStandings = function() {
    document.getElementById('standings-group-title').textContent = activeGroup;
    calculateGroupStandings(activeGroup);
    document.getElementById('standings-modal').classList.remove('hidden');
};

function calculateGroupStandings(group) {
    const groupMatches = matchesData.filter(m => m.group === group && m.status === "finished");
    const teams = {};
    const uniqueTeams = new Set();
    
    matchesData.filter(m => m.group === group).forEach(m => { 
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

    const sortedTeams = Object.values(teams).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });

    document.getElementById('standings-body').innerHTML = sortedTeams.map((t, i) => `
        <tr class="standings-row hover:bg-slate-800/50 transition">
            <td class="px-1 py-3 text-left font-bold text-slate-300">${i + 1}</td>
            <td class="px-1 py-3 text-left font-semibold text-white truncate max-w-[120px] sm:max-w-none">${t.name}</td>
            <td class="px-1 py-3 text-slate-300">${t.pj}</td>
            <td class="px-1 py-3 text-slate-300 hidden sm:table-cell">${t.g}</td>
            <td class="px-1 py-3 text-slate-300 hidden sm:table-cell">${t.e}</td>
            <td class="px-1 py-3 text-slate-300 hidden sm:table-cell">${t.p}</td>
            <td class="px-1 py-3 font-semibold ${t.dg > 0 ? 'text-emerald-400' : t.dg < 0 ? 'text-red-400' : 'text-slate-300'}">${t.dg > 0 ? '+'+t.dg : t.dg}</td>
            <td class="px-1 py-3 font-bold text-fifa-gold text-base">${t.pts}</td>
        </tr>
    `).join('');
}

// ==========================================
// 6. ACCIONES DE USUARIO
// ==========================================
window.savePrediction = async function(matchId, team, value) {
    if (!currentUser) return;
    const predKey = `${currentUser.uid}_${matchId}`;
    const currentPred = predictionsData[predKey] || { home: null, away: null };
    const newHome = team === 'home' ? (value === '' ? null : parseInt(value)) : currentPred.home;
    const newAway = team === 'away' ? (value === '' ? null : parseInt(value)) : currentPred.away;
    await setDoc(doc(db, "predictions", predKey), { userId: currentUser.uid, matchId, home: newHome, away: newAway, updatedAt: new Date() });
};

window.clearPrediction = async function(matchId) {
    if (!confirm("¿Borrar tu pronóstico para este partido?")) return;
    await deleteDoc(doc(db, "predictions", `${currentUser.uid}_${matchId}`));
};

document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('leaderboard-modal').classList.add('hidden');
        document.getElementById('standings-modal').classList.add('hidden');
    });
});

document.getElementById('nav-leaderboard').addEventListener('click', () => document.getElementById('leaderboard-modal').classList.remove('hidden'));
document.getElementById('nav-standings').addEventListener('click', window.openStandings);

// ==========================================
// 7. CARGA DINÁMICA DE ADMIN Y API
// ==========================================
import('./admin.js').then(module => {
    window.showAdminPanel = module.showAdminPanel;
    window.fetchRealResults = module.fetchRealResults;
    
    document.getElementById('btn-admin').addEventListener('click', window.showAdminPanel);
    document.getElementById('btn-sync').addEventListener('click', window.fetchRealResults);
});