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
    
    const menuText = 
        "🛠️ PANEL DE ADMINISTRACIÓN\n\n" +
        "1. 📝 Gestionar Resultados de Partidos\n" +
        "2. 👥 Gestionar Usuarios (Borrar usuario completo)\n" +
        "3. 🔍 Ver Desglose de Puntos de un Usuario\n" +
        "4. 🧹 REPARAR: Reiniciar Apuestas de un Usuario (Puntos a 0)\n" +
        "5. 🛠️ RESTAURAR: Poner pronóstico manual a un usuario (Recupera sus puntos)";
        
    const mainAction = prompt(menuText);

    if (mainAction === '2') {
        if (!confirm("⚠️ ¿Entrar a gestión de usuarios? (Esto puede llevar a borrar usuarios)")) return;
        await manageUsers(db);
        return;
    }
    if (mainAction === '3') {
        await showUserPointsBreakdown(db, matches);
        return;
    }
    if (mainAction === '4') {
        if (!confirm("⚠️ ¿Reiniciar apuestas de un usuario? (Puntos a 0, el usuario sigue registrado)")) return;
        await resetUserPredictions(db, matches);
        return;
    }
    if (mainAction === '5') {
        await restoreUserPrediction(db, matches);
        return;
    }
    if (mainAction === '1') {
        await manageMatches(matches, db);
        return;
    }

    alert("Acción cancelada o no válida.");
}

// ==========================================
// 1. GESTIONAR PARTIDOS
// ==========================================
async function manageMatches(matches, db) {
    const finishedMatches = matches.filter(m => m.status === "finished");
    const upcomingMatches = matches.filter(m => m.status === "scheduled");
    
    let message = "📋 PARTIDOS:\n\n";
    if (finishedMatches.length > 0) {
        message += "✅ FINALIZADOS:\n" + finishedMatches.map(m => `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`).join('\n') + "\n\n";
    }
    if (upcomingMatches.length > 0) {
        message += "⏳ POR JUGAR:\n" + upcomingMatches.slice(0, 10).map(m => `${m.id}: ${m.homeTeam} vs ${m.awayTeam}`).join('\n');
    }
    
    const matchIdInput = prompt(`${message}\n\nEscribe el ID del partido (ej: A1, D1):`);
    if (!matchIdInput) return;
    
    const match = matches.find(m => m.id.toUpperCase() === matchIdInput.trim().toUpperCase());
    if (!match) { alert(`❌ Partido "${matchIdInput}" no encontrado.`); return; }
    
    const action = prompt(
        `Partido: ${match.homeTeam} vs ${match.awayTeam}\n` +
        `Estado: ${match.status === "finished" ? `FINALIZADO (${match.homeScore}-${match.awayScore})` : "POR JUGAR"}\n\n` +
        `1. Poner/Actualizar resultado\n` +
        `2. REVERTIR a "Por Jugar" (Borrar marcador)`
    );

    if (action === '2') {
        if (!confirm(`⚠️ ¿REVERTIR este partido?\nSe desbloquearán las apuestas y los puntos se recalcularán.`)) return;
        await setDoc(doc(db, "matches", match.id), { status: "scheduled", homeScore: null, awayScore: null, updatedAt: new Date() }, { merge: true });
        alert(`✅ Partido revertido.`);
        if (window.calculateAndRender) window.calculateAndRender();
        return;
    }

    if (action !== '1') { alert("Cancelado."); return; }

    const homeScore = prompt(`Goles de ${match.homeTeam}:`);
    const awayScore = prompt(`Goles de ${match.awayTeam}:`);
    
    if (homeScore === null || awayScore === null || isNaN(homeScore) || isNaN(awayScore)) { 
        alert("❌ Deben ser números válidos"); return; 
    }
    
    await setDoc(doc(db, "matches", match.id), { 
        status: "finished", 
        homeScore: parseInt(homeScore), 
        awayScore: parseInt(awayScore), 
        updatedAt: new Date() 
    }, { merge: true });
    
    alert(`✅ Actualizado: ${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}`);
    if (window.calculateAndRender) window.calculateAndRender();
}

// ==========================================
// 2. REPARAR: REINICIAR APUESTAS
// ==========================================
async function resetUserPredictions(db, matches) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (users.length === 0) { alert("ℹ️ No hay usuarios."); return; }

    let userList = users.map((u, i) => `${i + 1}. ${u.name}`).join('\n');
    const userIndexInput = prompt(`👥 USUARIOS:\n\n${userList}\n\nEscribe el NÚMERO del usuario a REINICIAR (Puntos a 0):`);
    const userIndex = parseInt(userIndexInput) - 1;
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) { alert("❌ Selección inválida."); return; }
    
    const targetUser = users[userIndex];
    if (!confirm(`⚠️ ¿Reiniciar a "${targetUser.name}"?\nSus puntos volverán a 0 y podrá volver a apostar.`)) return;

    const predictionsSnapshot = await getDocs(collection(db, "predictions"));
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    predictionsSnapshot.docs.forEach(docSnapshot => {
        if (docSnapshot.data().userId === targetUser.id) {
            batch.delete(docSnapshot.ref);
            deletedCount++;
        }
    });
    
    if (deletedCount > 0) await batch.commit();
    alert(`✅ ¡Reparación exitosa!\nSe eliminaron ${deletedCount} apuestas de "${targetUser.name}".`);
    if (window.calculateAndRender) window.calculateAndRender();
}

// ==========================================
// 3. DESGLOSE DE PUNTOS
// ==========================================
async function showUserPointsBreakdown(db, matches) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (users.length === 0) { alert("ℹ️ No hay usuarios."); return; }

    let userList = users.map((u, i) => `${i + 1}. ${u.name}`).join('\n');
    const userIndexInput = prompt(`👥 USUARIOS:\n\n${userList}\n\nEscribe el NÚMERO para ver su desglose:`);
    const userIndex = parseInt(userIndexInput) - 1;
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) { alert("❌ Inválido."); return; }
    
    const targetUser = users[userIndex];
    const predictionsSnapshot = await getDocs(collection(db, "predictions"));
    const userPredictions = predictionsSnapshot.docs.map(doc => doc.data()).filter(pred => pred.userId === targetUser.id);
    
    if (userPredictions.length === 0) { alert(`ℹ️ "${targetUser.name}" no tiene apuestas.`); return; }

    let totalPoints = 0;
    let breakdown = `📊 DESGLOSE: ${targetUser.name}\n${"=".repeat(45)}\n\n`;
    
    userPredictions.forEach(pred => {
        const match = matches.find(m => m.id === pred.matchId);
        if (!match) { breakdown += `⚠️ ${pred.matchId}: Datos no encontrados\n\n`; return; }
        
        const isFinished = match.status === "finished";
        breakdown += `${isFinished ? "✅" : "⏳"} ${match.id}: ${match.homeTeam} vs ${match.awayTeam}\n`;
        
        if (!isFinished) {
            breakdown += `   🎯 Pronóstico: ${pred.home} - ${pred.away} (Pendiente)\n\n`;
            return;
        }
        
        breakdown += `   🎯 Apuesta: ${pred.home} - ${pred.away}\n`;
        breakdown += `   🏆 Resultado: ${match.homeScore} - ${match.awayScore}\n`;
        
        const predDiff = pred.home - pred.away;
        const actualDiff = match.homeScore - match.awayScore;
        let points = 0, level = "";
        
        if (pred.home === match.homeScore && pred.away === match.awayScore) { points = 5; level = "🎯 Exacto"; } 
        else if ((pred.home > pred.away && match.homeScore > match.awayScore) || (pred.home < pred.away && match.homeScore < match.awayScore) || (pred.home === pred.away && match.homeScore === match.awayScore)) { points = 3; level = "✅ Resultado"; } 
        else if (predDiff === actualDiff) { points = 1; level = "📊 Diferencia"; } 
        else { points = 0; level = "❌ Fallo"; }
        
        breakdown += `   ➕ ${level}: +${points} pts\n\n`;
        totalPoints += points;
    });
    
    breakdown += `${"=".repeat(45)}\n💰 TOTAL: ${totalPoints} pts\n`;
    alert(breakdown);
}

// ==========================================
// 4. BORRAR USUARIO COMPLETO
// ==========================================
async function manageUsers(db) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (users.length === 0) { alert("ℹ️ No hay usuarios."); return; }

    let userList = users.map((u, i) => `${i + 1}. ${u.name}`).join('\n');
    const userToDeleteIndex = prompt(`👥 ELIMINAR PERMANENTEMENTE:\n\n${userList}\n\nEscribe el NÚMERO:`);
    const index = parseInt(userToDeleteIndex) - 1;
    if (isNaN(index) || index < 0 || index >= users.length) { alert("❌ Inválido."); return; }
    
    const targetUser = users[index];
    if (!confirm(`⚠️ ¿ELIMINAR a "${targetUser.name}"?`)) return;
    if (!confirm(`⚠️ ÚLTIMA ADVERTENCIA: Esto borrará al usuario Y todas sus apuestas para SIEMPRE.`)) return;

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
}

// ==========================================
// 5. NUEVO: RESTAURAR PRONÓSTICO DE UN USUARIO
// ==========================================
async function restoreUserPrediction(db, matches) {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (users.length === 0) { alert("ℹ️ No hay usuarios."); return; }

    // 1. Seleccionar usuario
    let userList = users.map((u, i) => `${i + 1}. ${u.name}`).join('\n');
    const userIndexInput = prompt(`👥 PASO 1: Selecciona al usuario\n\n${userList}\n\nEscribe el NÚMERO:`);
    const userIndex = parseInt(userIndexInput) - 1;
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= users.length) { alert("❌ Inválido."); return; }
    const targetUser = users[userIndex];

    // 2. Seleccionar partido
    const matchList = matches.map(m => `${m.id}: ${m.homeTeam} vs ${m.awayTeam} (${m.status === 'finished' ? `Final: ${m.homeScore}-${m.awayScore}` : 'Pendiente'})`).join('\n');
    const matchIdInput = prompt(`👥 PASO 2: Usuario seleccionado: ${targetUser.name}\n\n📋 PARTIDOS:\n${matchList}\n\nEscribe el ID del partido a restaurar (ej: D1):`);
    
    const match = matches.find(m => m.id.toUpperCase() === matchIdInput.trim().toUpperCase());
    if (!match) { alert("❌ Partido no encontrado."); return; }

    // 3. Ingresar el pronóstico original
    const homePred = prompt(`¿Cuántos goles apostó ${targetUser.name} para ${match.homeTeam}?`);
    if (homePred === null) return;
    const awayPred = prompt(`¿Cuántos goles apostó ${targetUser.name} para ${match.awayTeam}?`);
    if (awayPred === null) return;

    if (isNaN(homePred) || isNaN(awayPred) || homePred === '' || awayPred === '') {
        alert("❌ Deben ser números válidos.");
        return;
    }

    // 4. Guardar en Firebase
    const predId = `${targetUser.id}_${match.id}`;
    await setDoc(doc(db, "predictions", predId), {
        userId: targetUser.id,
        matchId: match.id,
        home: parseInt(homePred),
        away: parseInt(awayPred),
        updatedAt: new Date()
    });

    alert(`✅ ¡Pronóstico restaurado con éxito!\n\n${targetUser.name} apostó: ${homePred} - ${awayPred}\n\nEl sistema ha recalculado sus puntos automáticamente.`);
    
    // 5. Actualizar la interfaz
    if (window.calculateAndRender) {
        window.calculateAndRender();
    }
}

// ==========================================
// 6. SINCRONIZACIÓN API
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