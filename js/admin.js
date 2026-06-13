// js/admin.js
import { ADMIN_PASSWORD } from './config.js';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { allMatches } from './data.js';

const db = getFirestore();

export async function showAdminPanel() {
    // Necesitamos acceder a la variable global currentUser desde app.js
    // Una forma limpia es pasarla o leerla, pero para simplificar en módulos:
    const userStr = localStorage.getItem('quiniela_current_user'); // (Asegúrate de guardar esto en app.js: localStorage.setItem('quiniela_current_user', currentUser.uid))
    
    const password = prompt("🔐 Contraseña de administrador:");
    if (password !== ADMIN_PASSWORD) {
        alert("❌ Contraseña incorrecta");
        return;
    }
    
    // Nota: En una app modular real, pasaríamos 'matchesData' como argumento. 
    // Para mantenerlo simple, asumimos que window.matchesData está disponible globalmente desde app.js
    const matches = window.matchesData || [];
    const finishedMatches = matches.filter(m => m.status === "finished");
    const upcomingMatches = matches.filter(m => m.status === "scheduled");
    
    let message = "📋 PARTIDOS DISPONIBLES:\n\n";
    if (finishedMatches.length > 0) {
        message += "✅ FINALIZADOS:\n" + finishedMatches.map(m => `${m.id}: ${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`).join('\n') + "\n\n";
    }
    if (upcomingMatches.length > 0) {
        message += "⏳ POR JUGAR:\n" + upcomingMatches.slice(0, 15).map(m => `${m.id}: ${m.homeTeam} vs ${m.awayTeam} (${m.date})`).join('\n') + "\n";
    }
    
    const matchId = prompt(`${message}\n\nEscribe el ID del partido a actualizar (ej: A1, D1):`);
    if (!matchId) return;
    
    const match = matches.find(m => m.id === matchId.toUpperCase());
    if (!match) { alert("❌ Partido no encontrado."); return; }
    
    const homeScore = prompt(`Goles de ${match.homeTeam}:`);
    if (homeScore === null) return;
    const awayScore = prompt(`Goles de ${match.awayTeam}:`);
    if (awayScore === null) return;
    
    if (isNaN(homeScore) || isNaN(awayScore)) { alert("❌ Los goles deben ser números"); return; }
    
    const matchRef = doc(db, "matches", matchId.toUpperCase());
    await setDoc(matchRef, {
        status: "finished",
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        updatedAt: new Date()
    }, { merge: true });
    
    alert(`✅ ¡Éxito!\n\n${match.homeTeam} ${homeScore} - ${awayScore} ${match.awayTeam}`);
    if (window.calculateAndRender) window.calculateAndRender();
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

        const batch = writeBatch(db);
        let updatedCount = 0;
        const matches = window.matchesData || [];

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
