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
    
    // --- MENÚ PRINCIPAL DEL ADMIN ---
    const mainAction = prompt(
        "🛠️ PANEL DE ADMINISTRACIÓN\n\n" +
        "1. Gestionar Resultados de Partidos\n" +
        "2. Gestionar Usuarios (Borrar usuario de prueba)\n\n" +
        "Elige 1 o 2:"
    );

    if (mainAction === '2') {
        await manageUsers(db);
        return;
    }

    if (mainAction !== '1') {
        alert("Acción cancelada o no válida.");
        return;
    }

    // --- LÓGICA DE GESTIÓN DE PARTIDOS (La que ya teníamos) ---
    const finishedMatches = matches.filter(m => m.status === "finished");
    const upcomingMatches = matches.filter(m => m.status === "scheduled");
    
    let message = "📋 PARTIDOS DISPONIBLES:\n\n";
    
    if (finishedMatches.length > 0) {
        message += "✅ FINALIZADOS:\n";
        finishedMatches.forEach(m => {
            message += `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}\n`;
        });
        message += "\n";
    }
    
    if (upcomingMatches.length > 0) {
        message += "⏳ POR JUGAR (Próximos 15):\n";
        upcomingMatches.slice(0, 15).forEach(m => {
            message += `${m.id}: ${m.homeTeam} vs ${m.awayTeam} (${m.date})\n`;
        });
        if (upcomingMatches.length > 15) {
            message += `... y ${upcomingMatches.length - 15} más\n`;
        }
    }
    
    const matchIdInput = prompt(`${message}\n\nEscribe el ID del partido (ej: A1, D1):`);
    if (!matchIdInput) return;
    
    const match = matches.find(m => m.id.toUpperCase() === matchIdInput.trim().toUpperCase());
    if (!match) {
        alert(`❌ Partido con ID "${matchIdInput}" no encontrado.`);
        return;
    }
    
    const currentStatus = match.status === "finished" ? `FINALIZADO (${match.homeScore}-${match.awayScore})` : "POR JUGAR";
    
    const action = prompt(
        `Partido: ${match.homeTeam} vs ${match.awayTeam}\n` +
        `Estado actual: ${currentStatus}\n\n` +
        `Elige una acción:\n` +
        `1. Actualizar / Forzar resultado\n` +
        `2. REVERTIR a "Por Jugar" (Borrar marcador y desbloquear apuestas)\n\n` +
        `Escribe 1 o 2:`
    );

    if (action === '2') {
        const confirmRevert = confirm(
            `⚠️ ¿Estás seguro de REVERTIR este partido?\n\n` +
            `Se borrará el marcador y las apuestas para este partido se desbloquearán.\n` +
            `Los puntos de los jugadores se recalcularán automáticamente.\n\n` +
            `${match.homeTeam} vs ${match.awayTeam}`
        );
        
        if (!confirmRevert) return;

        try {
            await setDoc(doc(db, "matches", match.id), {
                status: "scheduled",
                homeScore: null,
                awayScore: null,
                updatedAt: new Date()
            }, { merge: true });
            
            alert(`✅ ¡Partido revertido con éxito!\n\nLas apuestas para ${match.homeTeam} vs ${match.awayTeam} están desbloqueadas.`);
            if (window.calculateAndRender) window.calculateAndRender();
        } catch (error) {
            console.error("Error al revertir:", error);
            alert("❌ Error al actualizar la base de datos.");
        }
        return;
    }

    if (action !== '1') {
        alert("Acción cancelada o no válida.");
        return;
    }

    const homeScore = prompt(`Goles de ${match.homeTeam}:`);
    if (homeScore === null) return;
    
    const awayScore = prompt(`Goles de ${match.awayTeam}:`);
    if (awayScore === null) return;
    
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore === '' || awayScore === '') {
        alert("❌ Los goles deben ser números válidos");
        return;
    }
    
    try {
        await setDoc(doc(db, "matches", match.id), {
            status: "finished",
            homeScore: parseInt(homeScore),
            awayScore: parseInt(awayScore),
            updatedAt: new Date()
        }, { merge: true });
        
        alert(`✅ ¡Éxito!\n\n${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}\n\nLos puntos se han recalculado.`);
        if (window.calculateAndRender) window.calculateAndRender();
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("❌ Error al actualizar en la base de datos.");
    }
}

// ==========================================
// NUEVA FUNCIÓN: GESTIÓN DE USUARIOS
// ==========================================
async function manageUsers(db) {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (users.length === 0) {
            alert("ℹ️ No hay usuarios registrados en la base de datos.");
            return;
        }

        let userList = "👥 USUARIOS REGISTRADOS:\n\n";
        users.forEach((u, index) => {
            // Mostramos solo los primeros 8 caracteres del UID por seguridad y limpieza visual
            userList += `${index + 1}. ${u.name} (ID: ${u.id.substring(0, 8)}...)\n`;
        });
        
        const userToDeleteIndex = prompt(
            `${userList}\n` +
            `Escribe el NÚMERO del usuario que deseas ELIMINAR permanentemente:\n` +
            `(Ejemplo: si quieres borrar a "Juan", y está en el número 2, escribe 2)`
        );
        
        const index = parseInt(userToDeleteIndex) - 1;
        
        if (isNaN(index) || index < 0 || index >= users.length) {
            alert("❌ Selección inválida. Operación cancelada.");
            return;
        }
        
        const targetUser = users[index];
        const confirmDelete = confirm(
            `⚠️ ¡ATENCIÓN!\n\n` +
            `¿Estás SEGURO de eliminar a "${targetUser.name}"?\n\n` +
            `Esta acción borrará al usuario Y TODAS sus apuestas de la base de datos.\n` +
            `Esta acción NO se puede deshacer.`
        );
        
        if (!confirmDelete) return;

        // 1. Buscar y eliminar todas las predicciones de este usuario
        const predictionsSnapshot = await getDocs(collection(db, "predictions"));
        const batch = writeBatch(db);
        let deletedPredictions = 0;
        
        predictionsSnapshot.docs.forEach(docSnapshot => {
            const predData = docSnapshot.data();
            if (predData.userId === targetUser.id) {
                batch.delete(docSnapshot.ref);
                deletedPredictions++;
            }
        });
        
        if (deletedPredictions > 0) {
            await batch.commit();
        }
        
        // 2. Eliminar el documento del usuario
        await deleteDoc(doc(db, "users", targetUser.id));
        
        alert(`✅ ¡Éxito!\n\nUsuario "${targetUser.name}" y sus ${deletedPredictions} apuestas han sido eliminados permanentemente.\n\nLa tabla de posiciones se ha actualizado.`);
        
        // 3. Forzar actualización de la interfaz
        if (window.calculateAndRender) {
            window.calculateAndRender();
        }
        
    } catch (error) {
        console.error("Error al gestionar usuarios:", error);
        alert("❌ Ocurrió un error al eliminar el usuario. Revisa la consola.");
    }
}

// ==========================================
// SINCRONIZACIÓN CON API (Sin cambios)
// ==========================================
export async function fetchRealResults() {
    const icon = document.getElementById('sync-icon');
    icon.classList.add('fa-spin');
    
    try {
        const response = await fetch('https://api.quiniela.softandnet.site/api-proxy.php');
        const data = await response.json();
        
        if (data.error || !data.response || data.response.length === 0) {
            alert("ℹ️ No se encontraron partidos finalizados en la API aún.");
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
                batch.update(doc(db, "matches", localMatch.id), {
                    status: "finished",
                    homeScore: apiMatch.goals.home,
                    awayScore: apiMatch.goals.away
                });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await batch.commit();
            alert(`✅ ¡Éxito! Se actualizaron ${updatedCount} partidos.`);
        } else {
            alert("ℹ️ Todo al día. No hay partidos de nuestra quiniela finalizados en la API aún.");
        }
    } catch (error) {
        console.error("💥 Error:", error);
        alert("❌ Error de conexión con el proxy.");
    } finally {
        icon.classList.remove('fa-spin');
        if (window.calculateAndRender) window.calculateAndRender();
    }
}