// js/app.js
import { firebaseConfig, ADMIN_PASSWORD } from './config.js';
import { allMatches } from './data.js';
import { knockoutMatches, resolveKnockoutMatches, getRoundName, getRoundTabName } from './knockout.js';
import { calculatePoints, renderPointsBreakdownHTML } from './scoring.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot, getDocs, writeBatch, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js?v=6')
            .then(reg => console.log('[SW] Registrado:', reg.scope))
            .catch(err => console.error('[SW] Error:', err));
    });
}

// Toast notifications
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-emerald-600 border-emerald-500 text-white',
        error: 'bg-red-600 border-red-500 text-white',
        warning: 'bg-amber-600 border-amber-500 text-white',
        info: 'bg-slate-800 border-fifa-gold text-white'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast px-4 py-3 rounded-xl border shadow-lg flex items-center gap-3 ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span class="font-semibold text-sm">${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}
window.showToast = showToast;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let matchesData = [];
let predictionsData = {};
let activeGroup = 'A';
let activeKnockoutRound = 'R32';
let currentPhase = 'groups';
let featuredTimerInterval = null;

// ==========================================
// 1. AUTENTICACIÓN CON RECUPERACIÓN DE CUENTA
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        window.currentUser = user;
        const savedName = localStorage.getItem(`quiniela_name_${user.uid}`);
        
        if (savedName) {
            document.getElementById('user-display').textContent = `👤 ${savedName}`;
            document.getElementById('login-modal').classList.add('hidden');
            initApp();
        } else {
            document.getElementById('login-modal').classList.remove('hidden');
        }
    } else {
        currentUser = null;
        window.currentUser = null;
        await signInAnonymously(auth);
    }
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const name = document.getElementById('username-input').value.trim();
    if (!name) return showToast('Ingresa un nombre', 'warning');
    
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("name", "==", name));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const existingUser = snapshot.docs[0].data();
            const existingUid = snapshot.docs[0].id;
            
            if (existingUid === currentUser.uid) {
                localStorage.setItem(`quiniela_name_${currentUser.uid}`, name);
                document.getElementById('user-display').textContent = `👤 ${name}`;
                document.getElementById('login-modal').classList.add('hidden');
                initApp();
                return;
            }
            
            const confirmRecovery = confirm(
                `⚠️ El nombre "${name}" ya está registrado.\n\n` +
                `¿Eres tú y quieres recuperar tu cuenta?\n\n` +
                `Se migrarán todos tus puntos y pronósticos.`
            );
            
            if (confirmRecovery) {
                await migrateAccount(existingUid, currentUser.uid, name);
                return;
            } else {
                showToast('Por favor, elige otro nombre.', 'warning');
                return;
            }
        }
        
        localStorage.setItem(`quiniela_name_${currentUser.uid}`, name);
        document.getElementById('user-display').textContent = `👤 ${name}`;
        document.getElementById('login-modal').classList.add('hidden');
        
        await setDoc(doc(db, "users", currentUser.uid), { 
            name, 
            uid: currentUser.uid, 
            lastActive: new Date() 
        }, { merge: true });
        
        initApp();
        
    } catch (error) {
        console.error("Error en registro:", error);
        
        if (error.code === 'failed-precondition' || error.code === 'unimplemented') {
            showToast('Sistema de recuperación temporalmente indisponible. Registrando como usuario nuevo.', 'warning');
            
            localStorage.setItem(`quiniela_name_${currentUser.uid}`, name);
            document.getElementById('user-display').textContent = `👤 ${name}`;
            document.getElementById('login-modal').classList.add('hidden');
            
            await setDoc(doc(db, "users", currentUser.uid), { 
                name, 
                uid: currentUser.uid, 
                lastActive: new Date() 
            }, { merge: true });
            
            initApp();
        } else {
            showToast('Error al registrar. Intenta de nuevo.', 'error');
        }
    }
});

// ==========================================
// FUNCIÓN: MIGRAR CUENTA DE UN UID A OTRO
// ==========================================
async function migrateAccount(oldUid, newUid, name) {
    try {
        const batch = writeBatch(db);
        
        const userRef = doc(db, "users", newUid);
        batch.set(userRef, { 
            name, 
            uid: newUid, 
            lastActive: new Date() 
        }, { merge: true });
        
        const predictionsRef = collection(db, "predictions");
        const q = query(predictionsRef, where("userId", "==", oldUid));
        const predictionsSnapshot = await getDocs(q);
        
        predictionsSnapshot.docs.forEach(docSnap => {
            const predData = docSnap.data();
            const newPredId = `${newUid}_${predData.matchId}`;
            const newPredRef = doc(db, "predictions", newPredId);
            
            batch.set(newPredRef, {
                ...predData,
                userId: newUid
            });
            
            batch.delete(docSnap.ref);
        });
        
        const oldUserRef = doc(db, "users", oldUid);
        batch.delete(oldUserRef);
        
        await batch.commit();
        
        localStorage.setItem(`quiniela_name_${newUid}`, name);
        document.getElementById('user-display').textContent = `👤 ${name}`;
        document.getElementById('login-modal').classList.add('hidden');
        
        showToast('Cuenta recuperada. Pronósticos restaurados.', 'success');
        
        initApp();
        
    } catch (error) {
        console.error("Error al migrar cuenta:", error);
        showToast('Error al recuperar la cuenta. Intenta de nuevo.', 'error');
    }
}

// ==========================================
// 2. INICIALIZACIÓN Y FUSIÓN DE DATOS
// ==========================================
function initApp() {
    onSnapshot(collection(db, "matches"), (snapshot) => {
        const firebaseMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fusionar partidos de fase de grupos
        const groupMatches = allMatches.map(localMatch => {
            const fbMatch = firebaseMatches.find(m => m.id === localMatch.id);
            return {
                ...localMatch,
                round: null,
                status: fbMatch ? fbMatch.status : localMatch.status,
                homeScore: fbMatch ? fbMatch.homeScore : localMatch.homeScore,
                awayScore: fbMatch ? fbMatch.awayScore : localMatch.awayScore
            };
        });

        // Fusionar partidos de fase final y resolver slots
        const koMerged = knockoutMatches.map(localMatch => {
            const fbMatch = firebaseMatches.find(m => m.id === localMatch.id);
            return {
                ...localMatch,
                round: localMatch.round,
                group: null,
                status: fbMatch ? fbMatch.status : localMatch.status,
                homeScore: fbMatch ? fbMatch.homeScore : localMatch.homeScore,
                awayScore: fbMatch ? fbMatch.awayScore : localMatch.awayScore
            };
        });
        const resolvedKo = resolveKnockoutMatches(koMerged, [...groupMatches, ...koMerged]);

        matchesData = [...groupMatches, ...resolvedKo];

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
window.setPhase = function(phase) {
    currentPhase = phase;
    renderTabs();
    renderMatches();
};

window.setGroup = function(group) {
    activeGroup = group;
    renderTabs();
    renderMatches();
};

window.setKnockoutRound = function(round) {
    activeKnockoutRound = round;
    renderTabs();
    renderMatches();
};

function renderTabs() {
    const container = document.getElementById('phase-tabs');
    if (!container) return;

    // Actualizar toggle visual de fase
    document.querySelectorAll('.phase-btn').forEach(btn => {
        if (btn.dataset.phase === currentPhase) {
            btn.classList.add('bg-fifa-gold', 'text-fifa-dark');
            btn.classList.remove('text-slate-300', 'hover:text-white');
        } else {
            btn.classList.remove('bg-fifa-gold', 'text-fifa-dark');
            btn.classList.add('text-slate-300', 'hover:text-white');
        }
    });

    if (currentPhase === 'groups') {
        const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
        container.innerHTML = groups.map(g => `
            <button onclick="window.setGroup('${g}')" class="tab-btn px-4 py-2 rounded-full border border-slate-600 text-sm font-bold ${activeGroup === g ? 'active' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Grupo ${g}
            </button>
        `).join('');
    } else {
        const rounds = ['R32','R16','QF','SF','TP','F'];
        container.innerHTML = rounds.map(r => `
            <button onclick="window.setKnockoutRound('${r}')" class="tab-btn px-4 py-2 rounded-full border border-slate-600 text-sm font-bold ${activeKnockoutRound === r ? 'active' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                ${getRoundTabName(r)}
            </button>
        `).join('');
    }
}

function getMatchStats(matchId) {
    const preds = Object.values(predictionsData).filter(p => p.matchId === matchId && p.home !== null && p.away !== null);
    const total = preds.length;
    if (total === 0) return null;

    let homeWins = 0, draws = 0, awayWins = 0;
    preds.forEach(p => {
        if (p.home > p.away) homeWins++;
        else if (p.home === p.away) draws++;
        else awayWins++;
    });

    return {
        total,
        homePct: Math.round((homeWins / total) * 100),
        drawPct: Math.round((draws / total) * 100),
        awayPct: Math.round((awayWins / total) * 100)
    };
}

function renderFeaturedMatch() {
    const container = document.getElementById('featured-match-card');
    if (!container) return;

    if (featuredTimerInterval) {
        clearInterval(featuredTimerInterval);
        featuredTimerInterval = null;
    }

    const now = new Date();
    const upcoming = matchesData.filter(m => {
        // Solo partidos de fase de grupos en el destacado
        return !m.round && m.status === 'scheduled' && new Date(m.datetime) > now;
    });
    upcoming.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    const nextMatch = upcoming[0];
    
    if (nextMatch) {
        const matchTime = new Date(nextMatch.datetime);
        const predKey = currentUser ? `${currentUser.uid}_${nextMatch.id}` : null;
        const myPred = predKey && predictionsData[predKey] ? predictionsData[predKey] : { home: null, away: null };
        const myH = myPred.home !== null ? myPred.home : '';
        const myA = myPred.away !== null ? myPred.away : '';
        
        const stats = getMatchStats(nextMatch.id);
        let statsHTML = '';
        
        if (stats) {
            statsHTML = `
                <div class="mt-4 pt-4 border-t border-slate-700/50">
                    <p class="text-[10px] text-slate-400 uppercase tracking-wider text-center mb-2 flex items-center justify-center gap-1">
                        <i class="fas fa-chart-pie text-fifa-gold"></i> Tendencia de las apuestas (${stats.total} votos)
                    </p>
                    <div class="flex items-center gap-2 text-xs font-bold mb-1">
                        <span class="text-emerald-400 w-8 text-right">${stats.homePct}%</span>
                        <div class="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden flex">
                            <div class="bg-emerald-500 h-full transition-all duration-500" style="width: ${stats.homePct}%"></div>
                            <div class="bg-slate-500 h-full transition-all duration-500" style="width: ${stats.drawPct}%"></div>
                            <div class="bg-red-500 h-full transition-all duration-500" style="width: ${stats.awayPct}%"></div>
                        </div>
                        <span class="text-red-400 w-8 text-left">${stats.awayPct}%</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-slate-500 px-1">
                        <span>Gana ${nextMatch.homeTeam.split(' ').pop()}</span>
                        <span>Empate</span>
                        <span>Gana ${nextMatch.awayTeam.split(' ').pop()}</span>
                    </div>
                </div>
            `;
        } else {
            statsHTML = `
                <div class="mt-4 pt-4 border-t border-slate-700/50 text-center">
                    <p class="text-[10px] text-slate-500 uppercase tracking-wider">
                        <i class="fas fa-info-circle mr-1"></i> Sé el primero en apostar a este partido
                    </p>
                </div>
            `;
        }

        const updateTimer = () => {
            const currentTime = new Date();
            const timeDiff = matchTime - currentTime;
            
            if (timeDiff <= 0) {
                container.classList.add('hidden');
                if (featuredTimerInterval) clearInterval(featuredTimerInterval);
                renderMatches();
                return;
            }
            
            const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
            const minsLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const secsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            let timeText = "";
            let isUrgent = false;
            
            if (hoursLeft > 24) {
                timeText = `Faltan ${Math.floor(hoursLeft / 24)} día(s)`;
            } else if (hoursLeft > 0) {
                timeText = `${hoursLeft}h ${minsLeft}m ${secsLeft}s`;
            } else {
                timeText = `¡CIERRA EN ${minsLeft}m ${secsLeft}s!`;
                isUrgent = true;
            }
            
            const timerEl = document.getElementById('featured-timer-text');
            const timerContainer = document.getElementById('featured-timer-container');
            if (timerEl) timerEl.textContent = timeText;
            if (timerContainer) {
                if (isUrgent) timerContainer.classList.add('urgent');
                else timerContainer.classList.remove('urgent');
            }
        };
        
        container.innerHTML = `
            <div class="featured-card">
                <div class="featured-header">
                    <span class="featured-badge">🔥 Apuesta Destacada</span>
                    <span class="text-xs font-bold uppercase tracking-widest text-fifa-gold">Grupo ${nextMatch.group}</span>
                </div>
                <div class="featured-teams">
                    <div class="featured-team">
                        <div class="featured-team-name">${nextMatch.homeTeam}</div>
                    </div>
                    <div class="featured-score-inputs">
                        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="featured-score-input" id="featured-input-home" value="${myH}" onchange="window.savePrediction('${nextMatch.id}', 'home', this.value)" oninput="window.validateScoreInput(this)" placeholder="-">
                        <span class="featured-vs">VS</span>
                        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="featured-score-input" id="featured-input-away" value="${myA}" onchange="window.savePrediction('${nextMatch.id}', 'away', this.value)" oninput="window.validateScoreInput(this)" placeholder="-">
                    </div>
                    <div class="featured-team">
                        <div class="featured-team-name">${nextMatch.awayTeam}</div>
                    </div>
                </div>
                ${statsHTML}
                <div class="featured-footer mt-4">
                    <div id="featured-timer-container" class="featured-timer">
                        <i class="fas fa-stopwatch"></i>
                        <span id="featured-timer-text">Calculando...</span>
                    </div>
                </div>
            </div>
        `;
        container.classList.remove('hidden');
        updateTimer();
        featuredTimerInterval = setInterval(updateTimer, 1000);
    } else {
        container.classList.add('hidden');
    }
}

function renderMatches() {
    const container = document.getElementById('matches-container');

    if (currentPhase === 'groups') {
        renderFeaturedMatch();
        renderGroupMatches(container);
    } else {
        document.getElementById('featured-match-card').classList.add('hidden');
        if (featuredTimerInterval) {
            clearInterval(featuredTimerInterval);
            featuredTimerInterval = null;
        }
        renderKnockoutMatches(container);
    }
}

function renderPointsSummary(pointsResult) {
    if (!pointsResult || pointsResult.points === 0) return '';
    const colorClass = pointsResult.isExact ? 'text-emerald-400' : pointsResult.isCorrectResult ? 'text-fifa-gold' : 'text-blue-400';
    return `
        <div class="mt-2 pt-2 border-t border-slate-700/50">
            <div class="text-center mb-1">
                <span class="inline-block px-2 py-0.5 rounded-full bg-slate-900/80 text-xs font-black ${colorClass}">+${pointsResult.points} pts</span>
            </div>
            ${renderPointsBreakdownHTML(pointsResult)}
        </div>
    `;
}

function renderGroupMatches(container) {
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
        const pointsSummary = match.status === "finished" ? renderPointsSummary(match.pointsResult) : '';
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
                    <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input" value="${myH}" onchange="window.savePrediction('${match.id}', 'home', this.value)" oninput="window.validateScoreInput(this)" ${isLocked ? 'disabled' : ''}>
                    <span class="text-slate-500 font-bold text-xs sm:text-sm">-</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input" value="${myA}" onchange="window.savePrediction('${match.id}', 'away', this.value)" oninput="window.validateScoreInput(this)" ${isLocked ? 'disabled' : ''}>
                </div>
                <div class="flex-1 text-left min-w-0"><div class="font-title font-bold text-sm sm:text-base text-white truncate">${match.awayTeam}</div></div>
            </div>
            ${!isLocked ? `<div class="text-center mt-2"><span class="text-[10px] sm:text-xs text-slate-400 font-semibold bg-slate-900/50 px-2 py-1 rounded"><i class="far fa-clock mr-1"></i>${match.date}</span></div>` : ''}
            ${lockBadge}${clearBtn}${actualScore}${pointsSummary}
        </div>`;
    }).join('');
}

function renderKnockoutMatches(container) {
    const roundMatches = matchesData.filter(m => m.round === activeKnockoutRound && !m.group).sort((a, b) => a.id.localeCompare(b.id));
    const now = new Date();

    if (roundMatches.length === 0) {
        container.innerHTML = `<div class="text-center py-10 text-slate-500">No hay partidos en esta ronda.</div>`;
        return;
    }

    const roundTitle = getRoundName(activeKnockoutRound);

    const cards = roundMatches.map((match, index) => {
        const matchTime = new Date(match.datetime);
        const isLocked = match.status === "finished" || now >= matchTime;
        const resultClass = match.resultClass || "border-slate-700 bg-slate-800/40";
        const myH = match.myHome !== null ? match.myHome : '';
        const myA = match.myAway !== null ? match.myAway : '';
        const actualScore = match.status === "finished" ? `<div class="mt-3 pt-3 border-t border-slate-700/50 text-center"><span class="text-fifa-gold text-xs font-bold uppercase"><i class="fas fa-flag-checkered mr-1"></i> Final: ${match.homeScore} - ${match.awayScore}</span></div>` : '';
        const pointsSummary = match.status === "finished" ? renderPointsSummary(match.pointsResult) : '';
        const lockBadge = isLocked ? `<div class="text-center mt-2"><span class="locked-badge text-[10px] font-bold uppercase px-2 py-1 rounded inline-flex items-center gap-1"><i class="fas fa-lock"></i> Cerrado</span></div>` : '';
        const clearBtn = !isLocked && (match.myHome !== null || match.myAway !== null) ? `
            <button onclick="window.clearPrediction('${match.id}')" class="mt-2 w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded-lg transition flex items-center justify-center gap-2 border border-red-900/30">
                <i class="fas fa-trash-alt"></i> Borrar
            </button>` : '';

        const homeResolved = match.homeResolved !== false;
        const awayResolved = match.awayResolved !== false;
        const homeSource = match.homeSource || match.slotHome;
        const awaySource = match.awaySource || match.slotAway;

        return `
        <div class="knockout-match-card ${resultClass}">
            <div class="knockout-match-header">
                <span class="knockout-match-number">${match.id}</span>
                <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${match.date}</span>
            </div>
            <div class="knockout-teams">
                <div class="knockout-team ${homeResolved ? 'resolved' : 'pending'}">
                    <div class="knockout-team-name">${match.homeTeam}</div>
                    ${!homeResolved ? `<div class="knockout-team-source"><i class="fas fa-question-circle mr-1"></i>${homeSource}</div>` : ''}
                </div>
                <div class="knockout-score-box">
                    <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input" value="${myH}" onchange="window.savePrediction('${match.id}', 'home', this.value)" oninput="window.validateScoreInput(this)" ${isLocked ? 'disabled' : ''}>
                    <span class="text-slate-500 font-bold text-xs sm:text-sm">-</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="score-input" value="${myA}" onchange="window.savePrediction('${match.id}', 'away', this.value)" oninput="window.validateScoreInput(this)" ${isLocked ? 'disabled' : ''}>
                </div>
                <div class="knockout-team ${awayResolved ? 'resolved' : 'pending'}">
                    <div class="knockout-team-name">${match.awayTeam}</div>
                    ${!awayResolved ? `<div class="knockout-team-source"><i class="fas fa-question-circle mr-1"></i>${awaySource}</div>` : ''}
                </div>
            </div>
            ${lockBadge}${clearBtn}${actualScore}${pointsSummary}
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="mb-4 text-center">
            <h2 class="text-xl font-title font-black text-white">${roundTitle}</h2>
            <p class="text-xs text-slate-400">Apuesta a los partidos de esta ronda. Los equipos se definen automáticamente.</p>
        </div>
        <div class="knockout-round-grid">
            ${cards}
        </div>
    `;
}

// ==========================================
// 4. LÓGICA DE PUNTUACIÓN AVANZADA
// ==========================================
async function calculateAndRender() {
    if (matchesData.length === 0) return;
    if (!currentUser) return;

    const usersSnapshot = await getDocs(collection(db, "users"));
    let leaderboard = {};

    usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        leaderboard[doc.id] = { name: userData.name || "Jugador", exacts: 0, score: 0, uid: doc.id };
    });

    let userStats = { score: 0, exacts: 0 };

    matchesData.forEach(match => {
        const predKey = `${currentUser.uid}_${match.id}`;
        const myPred = predictionsData[predKey];

        match.myHome = (myPred && myPred.home !== undefined && myPred.home !== null) ? myPred.home : null;
        match.myAway = (myPred && myPred.away !== undefined && myPred.away !== null) ? myPred.away : null;
        match.resultClass = "";
        match.pointsResult = null;

        if (myPred && myPred.home !== null && myPred.home !== undefined) {
            const pointsResult = calculatePoints(myPred, match);
            match.pointsResult = pointsResult;
            if (pointsResult.points > 0) {
                userStats.score += pointsResult.points;
                if (pointsResult.isExact) userStats.exacts += 1;
                match.resultClass = pointsResult.isExact ? "exact-match" : "winner-match";
            } else if (match.status === 'finished') {
                match.resultClass = "lost-match";
            }
        }

        Object.keys(predictionsData).forEach(key => {
            if (!key.endsWith(`_${match.id}`)) return;
            const [uid] = key.split('_');
            const pred = predictionsData[key];

            if (!leaderboard[uid]) {
                console.warn(`⚠️ Predicción huérfana: UID ${uid} no existe. Ignorando.`);
                return;
            }

            const pointsResult = calculatePoints(pred, match);
            if (pointsResult.points > 0) {
                leaderboard[uid].score += pointsResult.points;
                if (pointsResult.isExact) leaderboard[uid].exacts += 1;
            }
        });
    });

    document.getElementById('user-score').textContent = userStats.score;
    document.getElementById('total-players').textContent = Object.keys(leaderboard).length;

    const sorted = Object.values(leaderboard).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.exacts - a.exacts;
    });
    renderLeaderboard(sorted);
    renderMatches();
}
window.calculateAndRender = calculateAndRender;

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
window.validateScoreInput = function(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value !== '') {
        const num = parseInt(value);
        if (num > 99) value = '99';
        if (num < 0) value = '0';
    }
    input.value = value;
};

window.savePrediction = async function(matchId, team, value) {
    if (!currentUser) return;

    const trimmed = value.trim();
    if (trimmed !== '' && (!/^\d+$/.test(trimmed) || parseInt(trimmed) < 0 || parseInt(trimmed) > 99)) {
        showToast('Ingresa un número entre 0 y 99', 'warning');
        renderMatches();
        return;
    }

    const predKey = `${currentUser.uid}_${matchId}`;
    const currentPred = predictionsData[predKey] || { home: null, away: null };
    const newHome = team === 'home' ? (trimmed === '' ? null : parseInt(trimmed)) : currentPred.home;
    const newAway = team === 'away' ? (trimmed === '' ? null : parseInt(trimmed)) : currentPred.away;

    try {
        await setDoc(doc(db, "predictions", predKey), { userId: currentUser.uid, matchId, home: newHome, away: newAway, updatedAt: new Date() });
        showToast('Pronóstico guardado', 'success', 2000);
    } catch (error) {
        console.error("Error guardando pronóstico:", error);
        showToast('Error al guardar pronóstico', 'error');
        renderMatches();
    }
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

document.getElementById('btn-scoring-info').addEventListener('click', () => {
    document.getElementById('scoring-rules').classList.toggle('hidden');
});

// Toggle de fase
document.getElementById('phase-groups').addEventListener('click', () => window.setPhase('groups'));
document.getElementById('phase-knockout').addEventListener('click', () => window.setPhase('knockout'));

// ==========================================
// ADMIN MODAL
// ==========================================
const adminModal = document.getElementById('admin-modal');
const adminLoginView = document.getElementById('admin-login-view');
const adminMenuView = document.getElementById('admin-menu-view');
const adminActionView = document.getElementById('admin-action-view');
const adminActionContent = document.getElementById('admin-action-content');
let adminAuthenticated = false;

function openAdminModal() {
    adminModal.classList.remove('hidden');
    if (adminAuthenticated) {
        showAdminMenu();
    } else {
        showAdminLogin();
    }
}

function closeAdminModal() {
    adminModal.classList.add('hidden');
}

function showAdminLogin() {
    adminLoginView.classList.remove('hidden');
    adminMenuView.classList.add('hidden');
    adminActionView.classList.add('hidden');
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-login-error').classList.add('hidden');
}

function showAdminMenu() {
    adminLoginView.classList.add('hidden');
    adminMenuView.classList.remove('hidden');
    adminActionView.classList.add('hidden');
}

function showAdminAction(action) {
    adminLoginView.classList.add('hidden');
    adminMenuView.classList.add('hidden');
    adminActionView.classList.remove('hidden');
    if (window.renderAdminAction) {
        window.renderAdminAction(action, adminActionContent);
    } else {
        adminActionContent.innerHTML = '<p class="text-slate-400">Cargando panel de admin...</p>';
    }
}

document.getElementById('btn-close-admin').addEventListener('click', closeAdminModal);
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) closeAdminModal();
});

document.getElementById('btn-admin-login').addEventListener('click', () => {
    const password = document.getElementById('admin-password').value;
    if (password === ADMIN_PASSWORD) {
        adminAuthenticated = true;
        showAdminMenu();
    } else {
        document.getElementById('admin-login-error').classList.remove('hidden');
    }
});

document.getElementById('admin-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-admin-login').click();
});

document.querySelectorAll('.admin-menu-btn').forEach(btn => {
    btn.addEventListener('click', () => showAdminAction(btn.dataset.adminAction));
});

document.getElementById('btn-admin-back').addEventListener('click', showAdminMenu);

// Sobreescribir showAdminPanel para usar el modal
window.showAdminPanel = openAdminModal;

// ==========================================
// 7. CARGA DINÁMICA DE ADMIN Y API
// ==========================================
import('./admin.js').then(module => {
    // showAdminPanel se maneja localmente con el modal profesional
    window.fetchRealResults = module.fetchRealResults;
    window.renderAdminAction = module.renderAdminAction;

    document.getElementById('btn-admin').addEventListener('click', window.showAdminPanel);
    document.getElementById('btn-sync').addEventListener('click', async () => {
        const icon = document.getElementById('sync-icon');
        icon.classList.add('fa-spin');

        try {
            // Los datos ya se sincronizan en tiempo real con onSnapshot.
            // Solo forzamos un recálculo visual y feedback.
            await calculateAndRender();

            icon.parentElement.classList.remove('bg-fifa-blue');
            icon.parentElement.classList.add('bg-emerald-600');
            showToast('Datos actualizados', 'success', 1500);

            setTimeout(() => {
                icon.parentElement.classList.remove('bg-emerald-600');
                icon.parentElement.classList.add('bg-fifa-blue');
                icon.classList.remove('fa-spin');
            }, 1500);

        } catch (error) {
            console.error("Error al refrescar:", error);
            icon.classList.remove('fa-spin');
            showToast('Error al actualizar los datos', 'error');
        }
    });
});