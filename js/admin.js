// js/admin.js
import { ADMIN_PASSWORD } from './config.js';
import { doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { allMatches } from './data.js';

export async function showAdminPanel() {
    const password = prompt("🔐 Contraseña de administrador:");
    if (password !== ADMIN_PASSWORD) {
        alert("❌ Contraseña incorrecta");
        return;
    }
    
    // Obtenemos los datos expuestos desde app.js
    const matches = window.matchesData || [];
    const db = window.db;

    if (!matches || matches.length === 0) {
        alert("⚠️ Esperando a que carguen los datos de los partidos. Intenta en un segundo.");
        return;
    }
    
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
    
    const matchIdInput = prompt(`${message}\n\nEscribe el ID del partido a actualizar (ej: A1, D1):`);
    
    if (!matchIdInput) return;
    
    // Buscamos el partido ignorando mayúsculas/minúsculas
    const match = matches.find(m => m.id.toUpperCase() === matchIdInput.trim().toUpperCase());
    
    if (!match) {
        alert(`❌ Partido con ID "${matchIdInput}" no encontrado. Verifica que esté en la lista.`);
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
    
    const matchRef = doc(db, "matches", match.id);
    
    try {
        await setDoc(matchRef, {
            status: "finished",
            homeScore: parseInt(homeScore),
            awayScore: parseInt(awayScore),
            updatedAt: new Date()
        }, { merge: true });
        
        alert(`✅ ¡Éxito!\n\n${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}\n\nLos puntos se han recalculado automáticamente.`);
        
        // Forzar recálculo en la app principal
        if (window.calculateAndRender) {
            window.calculateAndRender();
        }
    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("❌ Error al actualizar en la base de datos. Revisa la consola.");
    }
}

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
        if (window.calculateAndRender) {
            window.calculateAndRender();
        }
    }
}