// js/admin.js
import { ADMIN_PASSWORD } from './config.js';
import { doc, setDoc, writeBatch, deleteDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { allMatches } from './data.js';

export async function showAdminPanel() {
    const password = prompt("🔐 Contraseña de administrador:");
    if (password !== ADMIN_PASSWORD) {
        alert("❌ Contraseña incorrecta");
        return;
    }
    
    const matches = window.matchesData || [];
    const db = window.db;

    if (!matches || !db) {
        alert("⚠️ Esperando a que carguen los datos. Intenta en un segundo.");
        return;
    }
    
    // --- MENÚ PRINCIPAL DEL ADMIN (AHORA CON 4 OPCIONES) ---
    const mainAction = prompt(
        "🛠️ PANEL DE ADMINISTRACIÓN\n\n" +
        "1. Gestionar Resultados de Partidos\n" +
        "2. Gestionar Usuarios (Borrar usuario de prueba)\n" +
        "3. 🔍 Ver Desglose de Puntos de un Usuario\n" +
        "4. 🧹 REPARAR: Reiniciar Apuestas de un Usuario (Puntos a 0)\n\n" +
        "Elige 1, 2, 3 o 4:"
    );

    if (mainAction === '2') {
        await manageUsers(db);
        return;
    }

    if (mainAction === '3') {
        await showUserPointsBreakdown(db, matches);
        return;
    }

    if (mainAction === '4') {
        await resetUserPredictions(db, matches);
        return;
    }

    if (mainAction !== '1') {
        alert("Acción cancelada o no válida.");
        return;
    }

    // --- LÓGICA DE GESTIÓN DE PARTIDOS (Sin cambios) ---
    const finishedMatches = matches.filter(m => m.status === "finished");
    const upcomingMatches = matches.filter(m => m.status === "scheduled");
    
    let message = "📋 PARTIDOS DISPONIBLES:\n\n";
    if (finishedMatches.length > 0) {
        message += "✅ FINALIZADOS:\n";
        finishedMatches.forEach(m => { message += `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}\n`; });
        message += "\n";
    }
    if (upcomingMatches.length > 0) {
        message += "⏳ POR JUGAR (Próximos 15):\n";
        upcomingMatches.slice(0, 15).forEach(m => { message += `${m.id}: ${m.homeTeam} vs ${m.awayTeam} (${m.date})\n`; });
        if (upcomingMatches.length > 15) message += `... y ${upcomingMatches.length - 15} más\n`;
    }
    
    const matchIdInput = prompt(`${message}\n\nEscribe el ID del partido (ej: A1, D1):`);
    if (!matchIdInput) return;
    
    const match = matches.find(m => m.id.toUpperCase() === matchIdInput.trim().toUpperCase());
    if (!match) { alert(`❌ Partido con ID "${matchIdInput}" no encontrado.`); return; }
    
    const currentStatus = match.status === "finished" ? `FINALIZADO (${match.homeScore}-${match.awayScore})` : "POR JUGAR";
    const action = prompt(`Partido: ${match.homeTeam} vs ${match.awayTeam}\nEstado actual: ${currentStatus}\n\nElige:\n1. Actualizar / Forzar resultado\n2. REVERTIR a "Por Jugar"\n\nEscribe 1 o 2:`);

    if (action === '2') {
        if (!confirm(`⚠️ ¿Revertir este partido?\nSe borrará el marcador y se desbloquearán las apuestas.\n\n${match.homeTeam} vs ${match.awayTeam}`)) return;
        try {
            await setDoc(doc(db, "matches", match.id), { status: "scheduled", homeScore: null, awayScore: null, updatedAt: new Date() }, { merge: true });
            alert(`✅ ¡Partido revertido! Apuestas desbloqueadas.`);
            if (window.calculateAndRender) window.calculateAndRender();
        } catch (error) { alert("❌ Error al actualizar."); }
        return;
    }

    if (action !== '1') { alert("Acción cancelada."); return; }

    const homeScore = prompt(`Goles de ${match.homeTeam}:`);
    if (homeScore === null) return;
    const awayScore = prompt(`Goles de ${match.awayTeam}:`);
    if (awayScore === null) return;
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore === '' || awayScore === '') { alert("❌ Los goles deben ser números"); return; }
    
    try {
        await setDoc(doc(db, "matches", match.id), { status: "finished", homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), updatedAt: new Date() }, { merge: true });
        alert(`✅ ¡Éxito!\n${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}`);
        if (window.calculateAndRender) window.calculateAndRender();
    } catch (error) { alert("❌ Error al actualizar."); }
}

// ==========================================
// NUEVA FUNCIÓN: REPARAR / REINICIAR APUESTAS DE UN USUARIO
// ==========================================
async function resetUserPredictions(db, matches) {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (users.length === 0) { alert("ℹ️ No hay usuarios registrados."); return; }

        let userList = "👥 SELECCIONA EL USUARIO A REINICIAR:\n\n";
        users.forEach((u, index) => {
            userList += `${index + 1}. ${u.name} (ID: ${u.id.substring(0, 8)}...)\n`;
        });
        
        const userIndexInput = prompt(`${userList}\nEscribe el NÚMERO del usuario cuyos puntos deseas reiniciar:`);
        const userIndex = parseInt(userIndexInput) - 1;
        
        if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) {
            alert("❌ Selección inválida.");
            return;
        }
        
        const targetUser = users[userIndex];
        const confirmReset = confirm(
            `⚠️ ¡ATENCIÓN!\n\n` +
            `¿Estás SEGURO de reiniciar a "${targetUser.name}"?\n\n` +
            `Esta acción BORRARÁ TODOS sus pronósticos de la base de datos.\n` +
            `Sus puntos volverán a 0 y podrá volver a apostar desde cero.\n` +
            `El usuario NO será eliminado, solo sus apuestas.`
        );
        
        if (!confirmReset) return;

        // 1. Buscar y eliminar todas las predicciones de este usuario
        const predictionsSnapshot = await getDocs(collection(db, "predictions"));
        const batch = writeBatch(db);
        let deletedCount = 0;
        
        predictionsSnapshot.docs.forEach(docSnapshot => {
            if (docSnapshot.data().userId === targetUser.id) {
                batch.delete(docSnapshot.ref);
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            await batch.commit();
        }
        
        alert(`✅ ¡Reparación exitosa!\n\nSe eliminaron ${deletedCount} pronósticos de "${targetUser.name}".\nSus puntos ahora son 0 y puede volver a apostar.`);
        
        // 2. Forzar actualización de la interfaz
        if (window.calculateAndRender) {
            window.calculateAndRender();
        }
        
    } catch (error) {
        console.error("Error al reiniciar usuario:", error);
        alert("❌ Ocurrió un error. Revisa la consola.");
    }
}

// ==========================================
// FUNCIÓN: DESGLOSE DE PUNTOS (Sin cambios)
// ==========================================
async function showUserPointsBreakdown(db, matches) {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (users.length === 0) { alert("ℹ️ No hay usuarios registrados."); return; }

        let userList = "👥 SELECCIONA UN USUARIO PARA VER SU DESGLOSE:\n\n";
        users.forEach((u, index) => { userList += `${index + 1}. ${u.name} (ID: ${u.id.substring(0, 8)}...)\n`; });
        
        const userIndexInput = prompt(`${userList}\nEscribe el NÚMERO del usuario:`);
        const userIndex = parseInt(userIndexInput) - 1;
        if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) { alert("❌ Selección inválida."); return; }
        
        const targetUser = users[userIndex];
        const predictionsSnapshot = await getDocs(collection(db, "predictions"));
        const userPredictions = predictionsSnapshot.docs.map(doc => doc.data()).filter(pred => pred.userId === targetUser.id);
        
        if (userPredictions.length === 0) { alert(`ℹ️ "${targetUser.name}" no ha hecho apuestas.`); return; }

        let totalPoints = 0;
        let breakdown = `📊 DESGLOSE DE PUNTOS: ${targetUser.name}\n${"=".repeat(50)}\n\n`;
        
        userPredictions.forEach(pred => {
            const match = matches.find(m => m.id === pred.matchId);
            if (!match) {
                breakdown += `⚠️ Partido ${pred.matchId}: Datos no encontrados (Posible apuesta huérfana)\n\n`;
                return;
            }
            
            const isFinished = match.status === "finished";
            breakdown += `${isFinished ? "✅" : "⏳"} ${match.id}: ${match.homeTeam} vs ${match.awayTeam}\n`;
            
            if (!isFinished) {
                breakdown += `   🎯 Pronóstico: ${pred.home} - ${pred.away} (Pendiente)\n\n`;
                return;
            }
            
            breakdown += `   🎯 Tu apuesta: ${pred.home} - ${pred.away}\n`;
            breakdown += `   🏆 Resultado: ${match.homeScore} - ${match.awayScore}\n`;
            
            const predDiff = pred.home - pred.away;
            const actualDiff = match.homeScore - match.awayScore;
            let points = 0, level = "";
            
            if (pred.home === match.homeScore && pred.away === match.awayScore) { points = 5; level = "🎯 Marcador Exacto"; } 
            else if ((pred.home > pred.away && match.homeScore > match.awayScore) || (pred.home < pred.away && match.homeScore < match.awayScore) || (pred.home === pred.away && match.homeScore === match.awayScore)) { points = 3; level = "✅ Resultado Correcto"; } 
            else if (predDiff === actualDiff) { points = 1; level = "📊 Diferencia de Goles"; } 
            else { points = 0; level = "❌ Fallo Total"; }
            
            breakdown += `   ➕ ${level}: +${points} pts\n\n`;
            totalPoints += points;
        });
        
        breakdown += `${"=".repeat(50)}\n💰 TOTAL CALCULADO: ${totalPoints} pts\n`;
        alert(breakdown);
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al mostrar desglose.");
    }
}

// ==========================================
// FUNCIÓN: BORRAR USUARIO COMPLETO (Sin cambios)
// ==========================================
async function manageUsers(db) {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (users.length === 0) { alert("ℹ️ No hay usuarios."); return; }

        let userList = "👥 USUARIOS A ELIMINAR:\n\n";
        users.forEach((u, index) => { userList += `${index + 1}. ${u.name} (ID: ${u.id.substring(0, 8)}...)\n`; });
        
        const userToDeleteIndex = prompt(`${userList}\nEscribe el NÚMERO a ELIMINAR PERMANENTEMENTE:`);
        const index = parseInt(userToDeleteIndex) - 1;
        if (isNaN(index) || index < 0 || index >= users.length) { alert("❌ Inválido."); return; }
        
        const targetUser = users[index];
        if (!confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE a "${targetUser.name}" y TODOS sus datos?`)) return;

        const predictionsSnapshot = await getDocs(collection(db, "predictions"));
        const batch = writeBatch(db);
        let deletedPredictions = 0;
        
        predictionsSnapshot.docs.forEach(docSnapshot => {
            if (docSnapshot.data().userId === targetUser.id) {
                batch.delete(docSnapshot.ref);
                deletedPredictions++;
            }
        });
        if (deletedPredictions > 0) await batch.commit();
        await deleteDoc(doc(db, "users", targetUser.id));
        
        alert(`✅ "${targetUser.name}" eliminado con ${deletedPredictions} apuestas.`);
        if (window.calculateAndRender) window.calculateAndRender();
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Error al eliminar.");
    }
}

// ==========================================
// SINCRONIZACIÓN API (Sin cambios)
// ==========================================
export async function fetchRealResults() {
    const icon = document.getElementById('sync-icon');
    icon.classList.add('fa-spin');
    try {
        const response = await fetch('https://api.quiniela.softandnet.site/api-proxy.php');
        const data = await response.json();
        if (data.error || !data.response || data.response.length === 0) {
            alert("ℹ️ No hay partidos finalizados en la API aún.");
            icon.classList.remove('fa-spin');
            return;
        }
        const db = window.db;
        const matches = window.matchesData || [];
        const batch = writeBatch(db);
        let updatedCount = 0;

        matches.forEach(localMatch => {
            if (localMatch.status === "finished") return;
            const cleanLocalHome = localMatch.homeTeam.replace(/[^\w\s]/gi, '').trim().toLowerCase();
            const cleanLocalAway = localMatch.awayTeam.replace(/[^\w\s]/gi, '').trim().toLowerCase();
            const apiMatch = data.response.find(api => {
                const apiHome = api.teams.home.name.toLowerCase();
                const apiAway = api.teams.away.name.toLowerCase();
                return (apiHome.includes(cleanLocalHome) || cleanLocalHome.includes(apiHome)) &&
                       (apiAway.includes(cleanLocalAway) || cleanLocalAway.includes(apiAway));
            });
            if (apiMatch && apiMatch.fixture.status.short === 'FT') {
                batch.update(doc(db, "matches", localMatch.id), { status: "finished", homeScore: apiMatch.goals.home, awayScore: apiMatch.goals.away });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            alert(`✅ Se actualizaron ${updatedCount} partidos.`);
        } else {
            alert("ℹ️ Todo al día.");
        }
    } catch (error) {
        console.error("💥 Error:", error);
        alert("❌ Error de conexión.");
    } finally {
        icon.classList.remove('fa-spin');
        if (window.calculateAndRender) window.calculateAndRender();
    }
}