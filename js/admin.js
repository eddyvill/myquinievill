// js/admin.js
import { ADMIN_PASSWORD } from './config.js';
import { doc, setDoc, writeBatch, deleteDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { allMatches } from './data.js';
import { calculatePoints, renderPointsBreakdownHTML } from './scoring.js';

const db = () => window.db;
const matchesData = () => window.matchesData || [];
const currentUser = () => window.currentUser;
const toast = (msg, type) => window.showToast && window.showToast(msg, type);

// ==========================================
// RENDERIZADO PRINCIPAL DE ACCIONES
// ==========================================
export function renderAdminAction(action, container) {
    container.innerHTML = '';
    if (!db()) {
        container.innerHTML = '<p class="text-red-400 text-center">La base de datos aún no está lista. Espera a que cargue la app.</p>';
        return;
    }
    switch (action) {
        case 'matches': return renderMatchesManager(container);
        case 'users': return renderUsersManager(container);
        case 'breakdown': return renderBreakdown(container);
        case 'reset': return renderReset(container);
        case 'restore': return renderRestore(container);
        case 'emergency': return renderEmergency(container);
        case 'clean': return renderClean(container);
        default:
            container.innerHTML = '<p class="text-slate-400">Acción no válida.</p>';
    }
}

function loading(text = 'Cargando...') {
    return `<div class="text-center py-6 text-slate-400"><i class="fas fa-circle-notch fa-spin mr-2"></i>${text}</div>`;
}

// ==========================================
// 1. GESTIONAR PARTIDOS
// ==========================================
async function renderMatchesManager(container) {
    container.innerHTML = loading('Cargando partidos...');
    const matches = matchesData();
    const finished = matches.filter(m => m.status === 'finished');
    const upcoming = matches.filter(m => m.status === 'scheduled');

    const groupMatches = matches.filter(m => /^[A-L]$/.test(m.group));
    const knockoutMatches = matches.filter(m => !/^[A-L]$/.test(m.group));

    const groupOptions = groupMatches.map(m => {
        const label = m.status === 'finished'
            ? `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} ✅`
            : `${m.id}: ${m.homeTeam} vs ${m.awayTeam}`;
        return `<option value="${m.id}">${label}</option>`;
    }).join('');

    const knockoutOptions = knockoutMatches.map(m => {
        const label = m.status === 'finished'
            ? `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} ✅`
            : `${m.id}: ${m.homeTeam} vs ${m.awayTeam}`;
        return `<option value="${m.id}">${label}</option>`;
    }).join('');

    const options = `
        <optgroup label="Fase de Grupos">${groupOptions}</optgroup>
        <optgroup label="Fase Final">${knockoutOptions}</optgroup>
    `;

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Selecciona un partido</label>
                <select id="admin-match-select" class="admin-select">${options}</select>
            </div>
            <div id="admin-match-detail" class="hidden space-y-3">
                <p id="admin-match-info" class="text-white font-semibold text-center"></p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Local</label>
                        <input type="number" id="admin-home-score" class="admin-input" min="0" max="99" placeholder="0">
                    </div>
                    <div>
                        <label class="block text-xs text-slate-400 mb-1">Visitante</label>
                        <input type="number" id="admin-away-score" class="admin-input" min="0" max="99" placeholder="0">
                    </div>
                </div>
                <button id="btn-admin-update-match" class="w-full bg-fifa-gold hover:bg-yellow-400 text-fifa-dark font-bold py-3 rounded-xl transition">Actualizar resultado</button>
                <button id="btn-admin-revert-match" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-xl transition hidden">Revertir a "Por jugar"</button>
            </div>
        </div>
    `;

    const select = document.getElementById('admin-match-select');
    const detail = document.getElementById('admin-match-detail');
    const info = document.getElementById('admin-match-info');
    const homeInput = document.getElementById('admin-home-score');
    const awayInput = document.getElementById('admin-away-score');
    const updateBtn = document.getElementById('btn-admin-update-match');
    const revertBtn = document.getElementById('btn-admin-revert-match');

    function showMatchDetail() {
        const match = matches.find(m => m.id === select.value);
        if (!match) return;
        detail.classList.remove('hidden');
        info.textContent = `${match.homeTeam} vs ${match.awayTeam}`;
        homeInput.value = match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '';
        awayInput.value = match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '';
        if (match.status === 'finished') {
            revertBtn.classList.remove('hidden');
            updateBtn.textContent = 'Actualizar resultado';
        } else {
            revertBtn.classList.add('hidden');
            updateBtn.textContent = 'Guardar resultado';
        }
    }

    select.addEventListener('change', showMatchDetail);
    showMatchDetail();

    updateBtn.addEventListener('click', async () => {
        const match = matches.find(m => m.id === select.value);
        const home = parseInt(homeInput.value);
        const away = parseInt(awayInput.value);
        if (isNaN(home) || isNaN(away)) {
            toast('Ingresa goles válidos', 'warning');
            return;
        }
        try {
            await setDoc(doc(db(), 'matches', match.id), {
                status: 'finished', homeScore: home, awayScore: away, updatedAt: new Date()
            }, { merge: true });
            toast('Resultado actualizado', 'success');
            showMatchDetail();
        } catch (error) {
            console.error(error);
            toast('Error al actualizar', 'error');
        }
    });

    revertBtn.addEventListener('click', async () => {
        const match = matches.find(m => m.id === select.value);
        if (!confirm(`¿Revertir ${match.homeTeam} vs ${match.awayTeam} a "Por jugar"?`)) return;
        try {
            await setDoc(doc(db(), 'matches', match.id), { status: 'scheduled', homeScore: null, awayScore: null, updatedAt: new Date() }, { merge: true });
            toast('Partido revertido', 'success');
            showMatchDetail();
        } catch (error) {
            console.error(error);
            toast('Error al revertir', 'error');
        }
    });
}

// ==========================================
// 2. GESTIONAR USUARIOS (BORRAR)
// ==========================================
async function renderUsersManager(container) {
    container.innerHTML = loading('Cargando usuarios...');
    const usersSnapshot = await getDocs(collection(db(), 'users'));
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (users.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center">No hay usuarios registrados.</p>';
        return;
    }

    const options = users.map((u, i) => `<option value="${u.id}">${u.name}</option>`).join('');

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Usuario a eliminar</label>
                <select id="admin-user-select" class="admin-select">${options}</select>
            </div>
            <div class="bg-red-900/20 border border-red-900/40 rounded-xl p-3 text-sm text-red-200">
                <i class="fas fa-exclamation-triangle mr-1"></i> Esta acción borra al usuario y todas sus apuestas. No se puede deshacer.
            </div>
            <button id="btn-admin-delete-user" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">Eliminar usuario permanentemente</button>
        </div>
    `;

    document.getElementById('btn-admin-delete-user').addEventListener('click', async () => {
        const uid = document.getElementById('admin-user-select').value;
        const user = users.find(u => u.id === uid);
        if (!user) return;
        if (!confirm(`¿Eliminar a "${user.name}"?`)) return;
        if (!confirm('ÚLTIMA ADVERTENCIA: ¿borrar usuario y todas sus apuestas?')) return;

        try {
            const predictionsSnapshot = await getDocs(collection(db(), 'predictions'));
            const batch = writeBatch(db());
            let deleted = 0;
            predictionsSnapshot.docs.forEach(d => {
                if (d.data().userId === uid) {
                    batch.delete(d.ref);
                    deleted++;
                }
            });
            if (deleted > 0) await batch.commit();
            await deleteDoc(doc(db(), 'users', uid));
            toast(`"${user.name}" eliminado (${deleted} apuestas)`, 'success');
            renderUsersManager(container);
        } catch (error) {
            console.error(error);
            toast('Error al eliminar usuario', 'error');
        }
    });
}

// ==========================================
// 3. DESGLOSE DE PUNTOS
// ==========================================
async function renderBreakdown(container) {
    container.innerHTML = loading('Cargando usuarios...');
    const usersSnapshot = await getDocs(collection(db(), 'users'));
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const matches = matchesData();

    if (users.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center">No hay usuarios.</p>';
        return;
    }

    const options = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Jugador</label>
                <select id="admin-breakdown-user" class="admin-select">${options}</select>
            </div>
            <div id="admin-breakdown-result" class="space-y-2 max-h-[50vh] overflow-y-auto pr-1"></div>
        </div>
    `;

    const resultContainer = document.getElementById('admin-breakdown-result');

    async function loadBreakdown() {
        resultContainer.innerHTML = loading();
        const uid = document.getElementById('admin-breakdown-user').value;
        const user = users.find(u => u.id === uid);
        const predictionsSnapshot = await getDocs(collection(db(), 'predictions'));
        const preds = predictionsSnapshot.docs.map(d => d.data()).filter(p => p.userId === uid);

        if (preds.length === 0) {
            resultContainer.innerHTML = '<p class="text-slate-400 text-center">Sin apuestas.</p>';
            return;
        }

        let total = 0;
        const rows = preds.map(pred => {
            const match = matches.find(m => m.id === pred.matchId);
            if (!match) return '';
            const isFinished = match.status === 'finished';
            const pointsResult = isFinished ? calculatePoints(pred, match) : { points: 0 };
            const points = pointsResult.points;
            const cls = pointsResult.isExact ? 'text-emerald-400' : pointsResult.isCorrectResult ? 'text-fifa-gold' : points > 0 ? 'text-blue-400' : 'text-red-400';
            const label = pointsResult.isExact ? '🎯 Exacto' : pointsResult.isCorrectResult ? '✅ Resultado' : points > 0 ? '📊 Diferencia / Bonus' : '❌ Fallo';
            if (isFinished) total += points;

            return `
                <div class="bg-slate-800/50 rounded-lg p-3 text-sm border border-slate-700">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-semibold text-white">${match.homeTeam} vs ${match.awayTeam}</span>
                        <span class="font-bold ${cls}">${isFinished ? '+' + points : ''}</span>
                    </div>
                    <div class="text-xs text-slate-400 flex justify-between">
                        <span>Apuesta: ${pred.home} - ${pred.away}</span>
                        ${isFinished ? `<span>Resultado: ${match.homeScore} - ${match.awayScore}</span>` : ''}
                    </div>
                    ${isFinished ? `<div class="text-xs ${cls} mt-1">${label}</div>` : ''}
                    ${isFinished && points > 0 ? renderPointsBreakdownHTML(pointsResult) : ''}
                </div>
            `;
        }).join('');

        resultContainer.innerHTML = `
            <div class="flex justify-between items-center bg-fifa-gold/10 border border-fifa-gold/30 rounded-lg p-3 mb-2">
                <span class="font-bold text-white">${user.name}</span>
                <span class="font-black text-fifa-gold text-lg">${total} pts</span>
            </div>
            ${rows}
        `;
    }

    document.getElementById('admin-breakdown-user').addEventListener('change', loadBreakdown);
    await loadBreakdown();
}

// ==========================================
// 4. REINICIAR APUESTAS
// ==========================================
async function renderReset(container) {
    container.innerHTML = loading('Cargando usuarios...');
    const usersSnapshot = await getDocs(collection(db(), 'users'));
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (users.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center">No hay usuarios.</p>';
        return;
    }

    const options = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Usuario a reiniciar</label>
                <select id="admin-reset-user" class="admin-select">${options}</select>
            </div>
            <button id="btn-admin-reset" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition">Reiniciar todas sus apuestas</button>
        </div>
    `;

    document.getElementById('btn-admin-reset').addEventListener('click', async () => {
        const uid = document.getElementById('admin-reset-user').value;
        const user = users.find(u => u.id === uid);
        if (!confirm(`¿Reiniciar todas las apuestas de "${user.name}"?`)) return;

        try {
            const predictionsSnapshot = await getDocs(collection(db(), 'predictions'));
            const batch = writeBatch(db());
            let deleted = 0;
            predictionsSnapshot.docs.forEach(d => {
                if (d.data().userId === uid) {
                    batch.delete(d.ref);
                    deleted++;
                }
            });
            if (deleted > 0) await batch.commit();
            toast(`Reiniciadas ${deleted} apuestas de ${user.name}`, 'success');
        } catch (error) {
            console.error(error);
            toast('Error al reiniciar', 'error');
        }
    });
}

// ==========================================
// 5. RESTAURAR PRONÓSTICO
// ==========================================
async function renderRestore(container) {
    container.innerHTML = loading('Cargando datos...');
    const usersSnapshot = await getDocs(collection(db(), 'users'));
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const matches = matchesData();

    if (users.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-center">No hay usuarios.</p>';
        return;
    }

    const userOptions = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    const matchOptions = matches.map(m => `<option value="${m.id}">${m.id}: ${m.homeTeam} vs ${m.awayTeam}</option>`).join('');

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Usuario</label>
                <select id="admin-restore-user" class="admin-select">${userOptions}</select>
            </div>
            <div>
                <label class="block text-xs uppercase text-slate-400 mb-1">Partido</label>
                <select id="admin-restore-match" class="admin-select">${matchOptions}</select>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Local</label>
                    <input type="number" id="admin-restore-home" class="admin-input" min="0" max="99" placeholder="0">
                </div>
                <div>
                    <label class="block text-xs text-slate-400 mb-1">Visitante</label>
                    <input type="number" id="admin-restore-away" class="admin-input" min="0" max="99" placeholder="0">
                </div>
            </div>
            <button id="btn-admin-restore" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition">Guardar pronóstico</button>
        </div>
    `;

    document.getElementById('btn-admin-restore').addEventListener('click', async () => {
        const uid = document.getElementById('admin-restore-user').value;
        const matchId = document.getElementById('admin-restore-match').value;
        const home = parseInt(document.getElementById('admin-restore-home').value);
        const away = parseInt(document.getElementById('admin-restore-away').value);
        if (isNaN(home) || isNaN(away)) {
            toast('Ingresa goles válidos', 'warning');
            return;
        }
        try {
            await setDoc(doc(db(), 'predictions', `${uid}_${matchId}`), {
                userId: uid, matchId, home, away, updatedAt: new Date()
            });
            toast('Pronóstico restaurado', 'success');
        } catch (error) {
            console.error(error);
            toast('Error al restaurar', 'error');
        }
    });
}

// ==========================================
// 6. RECUPERAR USUARIO PERDIDO
// ==========================================
async function renderEmergency(container) {
    container.innerHTML = loading('Buscando predicciones huérfanas...');

    try {
        const predictionsSnapshot = await getDocs(collection(db(), 'predictions'));
        const allPredictions = predictionsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const usersSnapshot = await getDocs(collection(db(), 'users'));
        const existingUids = new Set(usersSnapshot.docs.map(d => d.id));
        const orphanedUids = [...new Set(allPredictions.map(p => p.userId))].filter(uid => !existingUids.has(uid));

        if (orphanedUids.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center">No se encontraron predicciones huérfanas.</p>';
            return;
        }

        const options = orphanedUids.map(uid => {
            const count = allPredictions.filter(p => p.userId === uid).length;
            return `<option value="${uid}">${uid} (${count} pronósticos)</option>`;
        }).join('');

        container.innerHTML = `
            <div class="space-y-4">
                <p class="text-sm text-slate-300">Se encontraron ${orphanedUids.length} cuenta(s) sin usuario asociado.</p>
                <div>
                    <label class="block text-xs uppercase text-slate-400 mb-1">UID huérfano</label>
                    <select id="admin-emergency-uid" class="admin-select">${options}</select>
                </div>
                <div>
                    <label class="block text-xs uppercase text-slate-400 mb-1">Nombre del usuario</label>
                    <input type="text" id="admin-emergency-name" class="admin-input" placeholder="Nombre exacto">
                </div>
                <button id="btn-admin-emergency" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition">Recuperar cuenta</button>
            </div>
        `;

        document.getElementById('btn-admin-emergency').addEventListener('click', async () => {
            const oldUid = document.getElementById('admin-emergency-uid').value;
            const name = document.getElementById('admin-emergency-name').value.trim();
            if (!name) {
                toast('Ingresa el nombre del usuario', 'warning');
                return;
            }
            const authUid = currentUser() ? currentUser().uid : null;
            if (!authUid) {
                toast('No se pudo obtener el UID de Firebase Auth', 'error');
                return;
            }
            const orphanedPredictions = allPredictions.filter(p => p.userId === oldUid);
            if (!confirm(`¿Recuperar ${orphanedPredictions.length} pronósticos para "${name}"?`)) return;

            try {
                const batch = writeBatch(db());
                batch.set(doc(db(), 'users', authUid), {
                    name, uid: authUid, lastActive: new Date(), recovered: true, oldUid
                });
                orphanedPredictions.forEach(pred => {
                    const newId = `${authUid}_${pred.matchId}`;
                    batch.set(doc(db(), 'predictions', newId), { ...pred, userId: authUid });
                    batch.delete(doc(db(), 'predictions', `${oldUid}_${pred.matchId}`));
                });
                if (oldUid !== authUid) batch.delete(doc(db(), 'users', oldUid));
                await batch.commit();
                localStorage.setItem(`quiniela_name_${authUid}`, name);
                toast('Cuenta recuperada. Recarga la página.', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                console.error(error);
                toast('Error al recuperar: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-red-400 text-center">Error al buscar predicciones.</p>';
    }
}

// ==========================================
// 7. LIMPIAR PREDICCIONES HUÉRFANAS
// ==========================================
async function renderClean(container) {
    container.innerHTML = `
        <div class="space-y-4 text-center">
            <p class="text-slate-300 text-sm">Esta acción elimina todas las predicciones cuyo usuario ya no existe en la base de datos.</p>
            <button id="btn-admin-clean" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition">Buscar y limpiar predicciones huérfanas</button>
            <div id="admin-clean-result"></div>
        </div>
    `;

    document.getElementById('btn-admin-clean').addEventListener('click', async () => {
        if (!confirm('¿Borrar todas las predicciones de usuarios inexistentes?')) return;
        const resultDiv = document.getElementById('admin-clean-result');
        resultDiv.innerHTML = loading('Limpiando...');

        try {
            const usersSnapshot = await getDocs(collection(db(), 'users'));
            const validUids = new Set(usersSnapshot.docs.map(d => d.id));
            const predictionsSnapshot = await getDocs(collection(db(), 'predictions'));
            const batch = writeBatch(db());
            let count = 0;
            predictionsSnapshot.docs.forEach(d => {
                if (!validUids.has(d.data().userId)) {
                    batch.delete(d.ref);
                    count++;
                }
            });
            if (count > 0) await batch.commit();
            resultDiv.innerHTML = `<p class="text-emerald-400 font-semibold">${count === 0 ? 'No había predicciones huérfanas.' : `Se eliminaron ${count} predicciones huérfanas.`}</p>`;
            toast('Limpieza completada', 'success');
        } catch (error) {
            console.error(error);
            resultDiv.innerHTML = '<p class="text-red-400">Error al limpiar.</p>';
            toast('Error al limpiar', 'error');
        }
    });
}

// ==========================================
// SINCRONIZACIÓN API
// ==========================================
export async function fetchRealResults() {
    const icon = document.getElementById('sync-icon');
    if (icon) icon.classList.add('fa-spin');
    try {
        const response = await fetch('https://api.quiniela.softandnet.site/api-proxy.php');
        const data = await response.json();
        if (data.error || !data.response || data.response.length === 0) {
            toast('No hay partidos finalizados en la API aún.', 'info');
            return;
        }
        const matches = matchesData();
        const batch = writeBatch(db());
        let updatedCount = 0;

        matches.forEach(localMatch => {
            if (localMatch.status === 'finished') return;
            const cleanLocalHome = localMatch.homeTeam.replace(/[^\w\s]/gi, '').trim().toLowerCase();
            const cleanLocalAway = localMatch.awayTeam.replace(/[^\w\s]/gi, '').trim().toLowerCase();
            const apiMatch = data.response.find(api => {
                const apiHome = api.teams.home.name.toLowerCase();
                const apiAway = api.teams.away.name.toLowerCase();
                return (apiHome.includes(cleanLocalHome) || cleanLocalHome.includes(apiHome)) &&
                       (apiAway.includes(cleanLocalAway) || cleanLocalAway.includes(apiAway));
            });
            if (apiMatch && apiMatch.fixture.status.short === 'FT') {
                batch.update(doc(db(), 'matches', localMatch.id), { status: 'finished', homeScore: apiMatch.goals.home, awayScore: apiMatch.goals.away });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            toast(`Se actualizaron ${updatedCount} partidos`, 'success');
        } else {
            toast('Todo al día', 'info');
        }
    } catch (error) {
        console.error('Error:', error);
        toast('Error de conexión con la API', 'error');
    } finally {
        if (icon) icon.classList.remove('fa-spin');
        if (window.calculateAndRender) window.calculateAndRender();
    }
}
