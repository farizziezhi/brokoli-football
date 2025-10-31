const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3333/api' : '/api';

// DOM Elements
const standingsTab = document.getElementById('standingsTab');
const predictionsTab = document.getElementById('predictionsTab');
const standingsSection = document.getElementById('standingsSection');
const predictionsSection = document.getElementById('predictionsSection');
const getStandingsBtn = document.getElementById('getStandings');
const getPredictionsBtn = document.getElementById('getPredictions');
const loadFixturesBtn = document.getElementById('loadFixtures');
const loading = document.getElementById('loading');
const errorAlert = document.getElementById('errorAlert');

// Tab switching
standingsTab.addEventListener('click', () => {
    switchTab('standings');
});

predictionsTab.addEventListener('click', () => {
    switchTab('predictions');
});

function switchTab(tab) {
    if (tab === 'standings') {
        standingsTab.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-lg');
        standingsTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        predictionsTab.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-lg');
        predictionsTab.classList.add('text-gray-600', 'hover:bg-gray-100');
        
        standingsSection.classList.remove('hidden');
        predictionsSection.classList.add('hidden');
    } else {
        predictionsTab.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-lg');
        predictionsTab.classList.remove('text-gray-600', 'hover:bg-gray-100');
        standingsTab.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white', 'shadow-lg');
        standingsTab.classList.add('text-gray-600', 'hover:bg-gray-100');
        
        predictionsSection.classList.remove('hidden');
        standingsSection.classList.add('hidden');
    }
}

// Get Standings
getStandingsBtn.addEventListener('click', async () => {
    const league = document.getElementById('leagueSelect').value;
    const season = document.getElementById('seasonSelect').value;
    
    if (!league) {
        showError('Pilih liga terlebih dahulu');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log(`Fetching: ${API_BASE_URL}/standings?league=${league}&season=${season}`);
        const response = await fetch(`${API_BASE_URL}/standings?league=${league}&season=${season}`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil data klasemen');
        }
        
        displayStandings(data, league);
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
});

// Load Fixtures
loadFixturesBtn.addEventListener('click', async () => {
    const league = document.getElementById('fixtureLeagueSelect').value;
    
    if (!league) {
        showError('Pilih liga terlebih dahulu');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/fixtures?league=${league}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil data pertandingan');
        }
        
        populateFixtures(data);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
});

// Get AI Predictions
getPredictionsBtn.addEventListener('click', async () => {
    const selectedMatch = document.getElementById('fixtureSelect').value;
    
    if (!selectedMatch) {
        showError('Pilih pertandingan terlebih dahulu');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/predictions?matchId=${selectedMatch}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil prediksi AI');
        }
        
        displayPredictions(data);
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
});

function displayStandings(data, leagueId) {
    console.log('Standings data received:', data);
    
    const leagueNames = {
        '39': '🏴 Premier League',
        '140': '🇪🇸 Primera Division',
        '78': '🇩🇪 Bundesliga',
        '135': '🇮🇹 Serie A',
        '61': '🇫🇷 Ligue 1',
        '2': '🏆 UEFA Champions League',
        '88': '🇳🇱 Eredivisie',
        '71': '🇧🇷 Campeonato Brasileiro Série A',
        '72': '🏴 Championship',
        '94': '🇵🇹 Primeira Liga',
        '4': '🏆 European Championship'
    };
    
    // Use league name from API response or fallback to mapping
    const leagueTitle = data.data?.name || leagueNames[leagueId] || 'Klasemen Liga';
    document.getElementById('leagueTitle').innerHTML = `<i class="fas fa-trophy mr-3"></i>${leagueTitle}`;
    
    const tbody = document.getElementById('standingsTable');
    tbody.innerHTML = '';
    
    // Get standings from API response
    const standings = data.data?.standings || [];
    
    console.log('Processed standings:', standings);
    
    if (standings && standings.length > 0) {
        standings.forEach((team, index) => {
            const row = document.createElement('tr');
            
            // Enhanced styling based on position
            let rowClass = 'hover:bg-gray-50 transition-all duration-200';
            let positionBadge = '';
            
            if (index < 4) {
                rowClass += ' bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500';
                positionBadge = '<i class="fas fa-crown text-yellow-500 ml-2"></i>';
            } else if (index >= standings.length - 3) {
                rowClass += ' bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500';
                positionBadge = '<i class="fas fa-arrow-down text-red-500 ml-2"></i>';
            } else {
                rowClass += ' bg-white';
            }
            
            row.className = rowClass;
            
            // Extract data from stats array
            const getStatValue = (statName) => {
                const stat = team.stats?.find(s => s.name === statName);
                return stat ? stat.value : 0;
            };
            
            const position = getStatValue('rank') || (index + 1);
            const teamName = team.team?.name || 'Unknown';
            const teamLogo = team.team?.logos?.[0]?.href || '';
            const gamesPlayed = getStatValue('gamesPlayed');
            const wins = getStatValue('wins');
            const ties = getStatValue('ties');
            const losses = getStatValue('losses');
            const points = getStatValue('points');
            
            row.innerHTML = `
                <td class="px-6 py-5 whitespace-nowrap">
                    <div class="flex items-center">
                        <span class="text-lg font-bold text-gray-800 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">${position}</span>
                        ${positionBadge}
                    </div>
                </td>
                <td class="px-6 py-5 whitespace-nowrap">
                    <div class="flex items-center space-x-3">
                        ${teamLogo ? `<img class="h-10 w-10 rounded-full shadow-md" src="${teamLogo}" alt="${teamName}" onerror="this.style.display='none'">` : ''}
                        <i class="fas fa-shield-alt text-gray-400 ${teamLogo ? 'hidden' : ''}"></i>
                        <div>
                            <span class="text-sm font-bold text-gray-900">${teamName}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${gamesPlayed}</span>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">${wins}</span>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">${ties}</span>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">${losses}</span>
                </td>
                <td class="px-6 py-5 whitespace-nowrap text-center">
                    <span class="text-lg font-bold text-gray-900 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">${points}</span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center space-y-3">
                        <i class="fas fa-search text-4xl text-gray-300"></i>
                        <p class="text-gray-500 font-medium">Tidak ada data klasemen</p>
                        <p class="text-gray-400 text-sm">Coba pilih liga dan musim yang berbeda</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Add animation
    const resultsDiv = document.getElementById('standingsResults');
    resultsDiv.classList.remove('hidden');
    resultsDiv.classList.add('animate-fade-in');
}

function displayPredictions(data) {
    const content = document.getElementById('predictionsContent');
    const match = data.match;
    const prediction = data.prediction;
    const h2h = data.headToHead;
    
    // Enhanced confidence styling
    const getConfidenceColor = (confidence) => {
        switch(confidence.toLowerCase()) {
            case 'high': return 'from-green-500 to-emerald-600';
            case 'medium': return 'from-yellow-500 to-orange-500';
            default: return 'from-gray-500 to-gray-600';
        }
    };
    
    const getConfidenceIcon = (confidence) => {
        switch(confidence.toLowerCase()) {
            case 'high': return 'fas fa-check-circle';
            case 'medium': return 'fas fa-exclamation-circle';
            default: return 'fas fa-question-circle';
        }
    };
    
    let h2hSection = '';
    if (h2h && h2h.matches && h2h.matches.length > 0) {
        const recentMatches = h2h.matches.slice(0, 5);
        h2hSection = `
            <div class="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-history mr-3 text-blue-500"></i>
                    Head-to-Head Analysis (5 Pertandingan Terakhir)
                </h4>
                <div class="space-y-3">
                    ${recentMatches.map((match, index) => {
                        const homeGoals = match.score?.fullTime?.home || 0;
                        const awayGoals = match.score?.fullTime?.away || 0;
                        const date = new Date(match.utcDate).toLocaleDateString('id-ID');
                        const isWin = homeGoals !== awayGoals;
                        const winnerClass = homeGoals > awayGoals ? 'border-l-green-500' : homeGoals < awayGoals ? 'border-l-red-500' : 'border-l-yellow-500';
                        
                        return `
                            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${winnerClass} hover:shadow-md transition-all duration-200">
                                <div class="flex-1 text-left">
                                    <span class="font-medium text-gray-800">${match.homeTeam.name}</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <span class="text-lg font-bold px-3 py-1 bg-gray-100 rounded-lg">${homeGoals} - ${awayGoals}</span>
                                    <span class="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">${date}</span>
                                </div>
                                <div class="flex-1 text-right">
                                    <span class="font-medium text-gray-800">${match.awayTeam.name}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div class="space-y-8">
            <!-- Match Header -->
            <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 rounded-3xl text-white shadow-2xl">
                <div class="flex justify-between items-center">
                    <div class="text-center flex-1">
                        <div class="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            ${match.homeTeam.crest ? `<img src="${match.homeTeam.crest}" alt="${match.homeTeam.name}" class="h-12 w-12 rounded-full" onerror="this.style.display='none'">` : ''}
                            <i class="fas fa-shield-alt text-white text-xl ${match.homeTeam.crest ? 'hidden' : ''}"></i>
                        </div>
                        <p class="font-bold text-lg">${match.homeTeam.name}</p>
                        <p class="text-sm opacity-80">Home</p>
                    </div>
                    <div class="text-center px-8">
                        <div class="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-2">
                            <i class="fas fa-robot text-3xl mb-2"></i>
                            <p class="text-sm font-medium">AI ANALYSIS</p>
                        </div>
                        <p class="text-sm opacity-80">${new Date(match.utcDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p class="text-xs opacity-60">${new Date(match.utcDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="text-center flex-1">
                        <div class="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            ${match.awayTeam.crest ? `<img src="${match.awayTeam.crest}" alt="${match.awayTeam.name}" class="h-12 w-12 rounded-full" onerror="this.style.display='none'">` : ''}
                            <i class="fas fa-shield-alt text-white text-xl ${match.awayTeam.crest ? 'hidden' : ''}"></i>
                        </div>
                        <p class="font-bold text-lg">${match.awayTeam.name}</p>
                        <p class="text-sm opacity-80">Away</p>
                    </div>
                </div>
            </div>
            
            ${h2hSection}
            
            <!-- Prediction Cards -->
            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 shadow-lg card-hover">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-crown text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-purple-800 mb-2">Prediksi Pemenang</h4>
                        <p class="text-2xl font-bold text-purple-600 mb-2">${prediction.winner}</p>
                        <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getConfidenceColor(prediction.confidence)} text-white">
                            <i class="${getConfidenceIcon(prediction.confidence)} mr-2"></i>
                            ${prediction.confidence} Confidence
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200 shadow-lg card-hover">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-percentage text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-blue-800 mb-4">Peluang Menang</h4>
                        <div class="space-y-3">
                            <div class="bg-white/70 p-3 rounded-xl">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-sm font-medium text-gray-600">Home</span>
                                    <span class="text-lg font-bold text-blue-600">${prediction.homeWinProbability}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000" style="width: ${prediction.homeWinProbability}%"></div>
                                </div>
                            </div>
                            <div class="bg-white/70 p-3 rounded-xl">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-sm font-medium text-gray-600">Away</span>
                                    <span class="text-lg font-bold text-cyan-600">${prediction.awayWinProbability}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-1000" style="width: ${prediction.awayWinProbability}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-lg card-hover">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-brain text-white text-xl"></i>
                        </div>
                        <h4 class="font-bold text-green-800 mb-2">AI Analysis</h4>
                        <p class="text-sm text-green-700 bg-white/70 p-3 rounded-xl">${prediction.analysis}</p>
                    </div>
                </div>
            </div>
            
            <!-- AI Advice -->
            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200 shadow-lg">
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-lightbulb text-white text-lg"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-amber-800 mb-2 flex items-center">
                            <i class="fas fa-robot mr-2"></i>
                            AI Recommendation
                        </h4>
                        <p class="text-amber-700 leading-relaxed">${prediction.advice}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add animation
    const resultsDiv = document.getElementById('predictionsResults');
    resultsDiv.classList.remove('hidden');
    resultsDiv.classList.add('animate-fade-in');
}

function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function populateFixtures(data) {
    const fixtureSelect = document.getElementById('fixtureSelect');
    fixtureSelect.innerHTML = '<option value="">⚽ Pilih pertandingan</option>';
    
    if (data.matches && data.matches.length > 0) {
        data.matches.forEach(match => {
            const option = document.createElement('option');
            option.value = match.id;
            const date = new Date(match.utcDate).toLocaleDateString('id-ID', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const time = new Date(match.utcDate).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            option.textContent = `🏆 ${match.homeTeam.name} vs ${match.awayTeam.name} • ${date} ${time}`;
            fixtureSelect.appendChild(option);
        });
        fixtureSelect.disabled = false;
        fixtureSelect.classList.remove('opacity-50');
    } else {
        fixtureSelect.innerHTML = '<option value="">🚫 Tidak ada pertandingan dalam 14 hari ke depan</option>';
        fixtureSelect.classList.add('opacity-50');
    }
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorAlert.classList.remove('hidden');
    errorAlert.classList.add('animate-slide-up');
    
    setTimeout(() => {
        errorAlert.classList.add('hidden');
        errorAlert.classList.remove('animate-slide-up');
    }, 5000);
}