// js/data.js
export const allMatches = [
    // GRUPO A
    { id: "A1", group: "A", homeTeam: "🇲🇽 México", awayTeam: "🇿🇦 Sudáfrica", date: "11/06 13:00", datetime: "2026-06-11T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "A2", group: "A", homeTeam: "🇰🇷 Corea del Sur", awayTeam: "🇨🇿 Rep. Checa", date: "11/06 16:00", datetime: "2026-06-11T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "A3", group: "A", homeTeam: "🇨🇿 Rep. Checa", awayTeam: "🇿🇦 Sudáfrica", date: "18/06 18:00", datetime: "2026-06-18T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "A4", group: "A", homeTeam: "🇲🇽 México", awayTeam: "🇰🇷 Corea del Sur", date: "18/06 16:00", datetime: "2026-06-18T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "A5", group: "A", homeTeam: "🇿🇦 Sudáfrica", awayTeam: "🇰🇷 Corea del Sur", date: "23/06 16:00", datetime: "2026-06-23T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "A6", group: "A", homeTeam: "🇨🇿 Rep. Checa", awayTeam: "🇲🇽 México", date: "23/06 16:00", datetime: "2026-06-23T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    
    // GRUPO B
    { id: "B1", group: "B", homeTeam: "🇨🇦 Canadá", awayTeam: "🇧🇦 Bosnia-Herzegovina", date: "12/06 13:00", datetime: "2026-06-12T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "B2", group: "B", homeTeam: "🇶🇦 Qatar", awayTeam: "🇨🇭 Suiza", date: "13/06 15:00", datetime: "2026-06-13T15:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "B3", group: "B", homeTeam: "🇨🇭 Suiza", awayTeam: "🇧🇦 Bosnia-Herzegovina", date: "18/06 13:00", datetime: "2026-06-18T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "B4", group: "B", homeTeam: "🇨🇦 Canadá", awayTeam: "🇶🇦 Qatar", date: "18/06 16:00", datetime: "2026-06-18T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "B5", group: "B", homeTeam: "🇧🇦 Bosnia-Herzegovina", awayTeam: "🇶🇦 Qatar", date: "24/06 16:00", datetime: "2026-06-24T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "B6", group: "B", homeTeam: "🇨🇭 Suiza", awayTeam: "🇨🇦 Canadá", date: "24/06 16:00", datetime: "2026-06-24T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO C
    { id: "C1", group: "C", homeTeam: "🇧🇷 Brasil", awayTeam: "🇲🇦 Marruecos", date: "13/06 18:00", datetime: "2026-06-13T18:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "C2", group: "C", homeTeam: "🇭🇹 Haití", awayTeam: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia", date: "13/06 21:00", datetime: "2026-06-13T21:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "C3", group: "C", homeTeam: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia", awayTeam: "🇲🇦 Marruecos", date: "19/06 13:00", datetime: "2026-06-19T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "C4", group: "C", homeTeam: "🇧🇷 Brasil", awayTeam: "🇭🇹 Haití", date: "19/06 16:00", datetime: "2026-06-19T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "C5", group: "C", homeTeam: "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia", awayTeam: "🇧🇷 Brasil", date: "25/06 16:00", datetime: "2026-06-25T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "C6", group: "C", homeTeam: "🇲🇦 Marruecos", awayTeam: "🇭🇹 Haití", date: "25/06 16:00", datetime: "2026-06-25T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO D
    { id: "D1", group: "D", homeTeam: "🇺🇸 EE.UU.", awayTeam: "🇵🇾 Paraguay", date: "12/06 21:00", datetime: "2026-06-12T21:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "D2", group: "D", homeTeam: "🇦🇺 Australia", awayTeam: "🇹🇷 Turquía", date: "13/06 21:00", datetime: "2026-06-13T21:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "D3", group: "D", homeTeam: "🇺🇸 EE.UU.", awayTeam: "🇦🇺 Australia", date: "19/06 13:00", datetime: "2026-06-19T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "D4", group: "D", homeTeam: "🇹🇷 Turquía", awayTeam: "🇵🇾 Paraguay", date: "19/06 16:00", datetime: "2026-06-19T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "D5", group: "D", homeTeam: "🇹🇷 Turquía", awayTeam: "🇺🇸 EE.UU.", date: "25/06 13:00", datetime: "2026-06-25T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "D6", group: "D", homeTeam: "🇵🇾 Paraguay", awayTeam: "🇦🇺 Australia", date: "25/06 13:00", datetime: "2026-06-25T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO E
    { id: "E1", group: "E", homeTeam: "🇩🇪 Alemania", awayTeam: "🇨🇼 Curazao", date: "14/06 13:00", datetime: "2026-06-14T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "E2", group: "E", homeTeam: "🇨🇮 Costa de Marfil", awayTeam: "🇪🇨 Ecuador", date: "14/06 16:00", datetime: "2026-06-14T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "E3", group: "E", homeTeam: "🇩🇪 Alemania", awayTeam: "🇨🇮 Costa de Marfil", date: "20/06 13:00", datetime: "2026-06-20T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "E4", group: "E", homeTeam: "🇪🇨 Ecuador", awayTeam: "🇨🇼 Curazao", date: "20/06 16:00", datetime: "2026-06-20T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "E5", group: "E", homeTeam: "🇨🇼 Curazao", awayTeam: "🇨🇮 Costa de Marfil", date: "26/06 16:00", datetime: "2026-06-26T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "E6", group: "E", homeTeam: "🇪🇨 Ecuador", awayTeam: "🇩🇪 Alemania", date: "26/06 16:00", datetime: "2026-06-26T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO F
    { id: "F1", group: "F", homeTeam: "🇳🇱 Países Bajos", awayTeam: "🇯🇵 Japón", date: "14/06 13:00", datetime: "2026-06-14T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "F2", group: "F", homeTeam: "🇸🇪 Suecia", awayTeam: "🇹🇳 Túnez", date: "14/06 16:00", datetime: "2026-06-14T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "F3", group: "F", homeTeam: "🇳🇱 Países Bajos", awayTeam: "🇸🇪 Suecia", date: "20/06 13:00", datetime: "2026-06-20T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "F4", group: "F", homeTeam: "🇹🇳 Túnez", awayTeam: "🇯🇵 Japón", date: "20/06 16:00", datetime: "2026-06-20T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "F5", group: "F", homeTeam: "🇯🇵 Japón", awayTeam: "🇸🇪 Suecia", date: "26/06 13:00", datetime: "2026-06-26T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "F6", group: "F", homeTeam: "🇹🇳 Túnez", awayTeam: "🇳🇱 Países Bajos", date: "26/06 13:00", datetime: "2026-06-26T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO G
    { id: "G1", group: "G", homeTeam: "🇧🇪 Bélgica", awayTeam: "🇪🇬 Egipto", date: "15/06 13:00", datetime: "2026-06-15T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "G2", group: "G", homeTeam: "🇮🇷 Irán", awayTeam: "🇳🇿 Nueva Zelanda", date: "15/06 16:00", datetime: "2026-06-15T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "G3", group: "G", homeTeam: "🇧🇪 Bélgica", awayTeam: "🇮🇷 Irán", date: "21/06 13:00", datetime: "2026-06-21T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "G4", group: "G", homeTeam: "🇳🇿 Nueva Zelanda", awayTeam: "🇪🇬 Egipto", date: "21/06 16:00", datetime: "2026-06-21T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "G5", group: "G", homeTeam: "🇪🇬 Egipto", awayTeam: "🇮🇷 Irán", date: "27/06 16:00", datetime: "2026-06-27T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "G6", group: "G", homeTeam: "🇳🇿 Nueva Zelanda", awayTeam: "🇧🇪 Bélgica", date: "27/06 16:00", datetime: "2026-06-27T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO H
    { id: "H1", group: "H", homeTeam: "🇪🇸 España", awayTeam: "🇨🇻 Cabo Verde", date: "15/06 13:00", datetime: "2026-06-15T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "H2", group: "H", homeTeam: "🇸🇦 Arabia Saudita", awayTeam: "🇺🇾 Uruguay", date: "15/06 16:00", datetime: "2026-06-15T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "H3", group: "H", homeTeam: "🇪🇸 España", awayTeam: "🇸🇦 Arabia Saudita", date: "21/06 13:00", datetime: "2026-06-21T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "H4", group: "H", homeTeam: "🇺🇾 Uruguay", awayTeam: "🇨🇻 Cabo Verde", date: "21/06 16:00", datetime: "2026-06-21T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "H5", group: "H", homeTeam: "🇨🇻 Cabo Verde", awayTeam: "🇸🇦 Arabia Saudita", date: "27/06 13:00", datetime: "2026-06-27T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "H6", group: "H", homeTeam: "🇺🇾 Uruguay", awayTeam: "🇪🇸 España", date: "27/06 13:00", datetime: "2026-06-27T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO I
    { id: "I1", group: "I", homeTeam: "🇫🇷 Francia", awayTeam: "🇸🇳 Senegal", date: "16/06 13:00", datetime: "2026-06-16T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "I2", group: "I", homeTeam: "🇮🇶 Irak", awayTeam: "🇳🇴 Noruega", date: "16/06 16:00", datetime: "2026-06-16T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "I3", group: "I", homeTeam: "🇫🇷 Francia", awayTeam: "🇮🇶 Irak", date: "22/06 13:00", datetime: "2026-06-22T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "I4", group: "I", homeTeam: "🇳🇴 Noruega", awayTeam: "🇸🇳 Senegal", date: "22/06 16:00", datetime: "2026-06-22T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "I5", group: "I", homeTeam: "🇸🇳 Senegal", awayTeam: "🇮🇶 Irak", date: "28/06 16:00", datetime: "2026-06-28T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "I6", group: "I", homeTeam: "🇳🇴 Noruega", awayTeam: "🇫🇷 Francia", date: "28/06 16:00", datetime: "2026-06-28T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO J
    { id: "J1", group: "J", homeTeam: "🇦🇷 Argentina", awayTeam: "🇩🇿 Argelia", date: "16/06 13:00", datetime: "2026-06-16T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "J2", group: "J", homeTeam: "🇦🇹 Austria", awayTeam: "🇯🇴 Jordania", date: "16/06 16:00", datetime: "2026-06-16T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "J3", group: "J", homeTeam: "🇦🇷 Argentina", awayTeam: "🇦🇹 Austria", date: "22/06 13:00", datetime: "2026-06-22T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "J4", group: "J", homeTeam: "🇯🇴 Jordania", awayTeam: "🇩🇿 Argelia", date: "22/06 16:00", datetime: "2026-06-22T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "J5", group: "J", homeTeam: "🇩🇿 Argelia", awayTeam: "🇦🇹 Austria", date: "28/06 13:00", datetime: "2026-06-28T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "J6", group: "J", homeTeam: "🇯🇴 Jordania", awayTeam: "🇦🇷 Argentina", date: "28/06 13:00", datetime: "2026-06-28T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO K
    { id: "K1", group: "K", homeTeam: "🇵🇹 Portugal", awayTeam: "🇨🇩 RD Congo", date: "17/06 13:00", datetime: "2026-06-17T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "K2", group: "K", homeTeam: "🇺🇿 Uzbekistán", awayTeam: "🇨🇴 Colombia", date: "17/06 16:00", datetime: "2026-06-17T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "K3", group: "K", homeTeam: "🇵🇹 Portugal", awayTeam: "🇺🇿 Uzbekistán", date: "23/06 13:00", datetime: "2026-06-23T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "K4", group: "K", homeTeam: "🇨🇴 Colombia", awayTeam: "🇨🇩 RD Congo", date: "23/06 16:00", datetime: "2026-06-23T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "K5", group: "K", homeTeam: "🇨🇴 Colombia", awayTeam: "🇵🇹 Portugal", date: "29/06 16:00", datetime: "2026-06-29T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "K6", group: "K", homeTeam: "🇨🇩 RD Congo", awayTeam: "🇺🇿 Uzbekistán", date: "29/06 16:00", datetime: "2026-06-29T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },

    // GRUPO L
    { id: "L1", group: "L", homeTeam: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", awayTeam: "🇭🇷 Croacia", date: "17/06 13:00", datetime: "2026-06-17T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "L2", group: "L", homeTeam: "🇬🇭 Ghana", awayTeam: "🇵🇦 Panamá", date: "17/06 16:00", datetime: "2026-06-17T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "L3", group: "L", homeTeam: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", awayTeam: "🇬🇭 Ghana", date: "23/06 13:00", datetime: "2026-06-23T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "L4", group: "L", homeTeam: "🇵🇦 Panamá", awayTeam: "🇭🇷 Croacia", date: "23/06 16:00", datetime: "2026-06-23T16:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "L5", group: "L", homeTeam: "🇭🇷 Croacia", awayTeam: "🇬🇭 Ghana", date: "29/06 13:00", datetime: "2026-06-29T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null },
    { id: "L6", group: "L", homeTeam: "🇵🇦 Panamá", awayTeam: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra", date: "29/06 13:00", datetime: "2026-06-29T13:00:00-04:00", status: "scheduled", homeScore: null, awayScore: null }
];