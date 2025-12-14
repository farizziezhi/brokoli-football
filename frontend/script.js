const API_BASE_URL = 'https://brokoli-football-production.up.railway.app/api'

// Check for daily matches on page load
window.addEventListener('load', checkTodayMatches)

// Mobile menu toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle')
const mobileMenu = document.getElementById('mobileMenu')

if (mobileMenuToggle && mobileMenu) {
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden')
    const icon = mobileMenuToggle.querySelector('i')
    icon.classList.toggle('fa-bars')
    icon.classList.toggle('fa-times')
  })
}

// Chatbot functionality
const chatToggle = document.getElementById('chatToggle')
const chatBox = document.getElementById('chatBox')
const chatInput = document.getElementById('chatInput')
const chatSend = document.getElementById('chatSend')
const chatMessages = document.getElementById('chatMessages')

if (chatToggle) {
  chatToggle.addEventListener('click', () => {
    chatBox.classList.toggle('hidden')
  })
}

if (chatSend) {
  chatSend.addEventListener('click', sendMessage)
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage()
  })
}

async function sendMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  // Add user message
  addMessage(message, 'user')
  chatInput.value = ''

  // Add loading message
  const loadingId = addMessage('Analyzing...', 'bot', true)

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    const data = await response.json()

    // Remove loading message
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()

    if (response.ok) {
      addMessage(data.message, 'bot')
    } else {
      addMessage('System error. Please retry.', 'bot')
    }
  } catch (error) {
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()
    addMessage('Connection error.', 'bot')
  }
}

function addMessage(text, sender, isLoading = false) {
  const messageId = 'msg-' + Date.now()
  const messageDiv = document.createElement('div')
  messageDiv.id = messageId
  messageDiv.className = sender === 'user' ? 'text-right' : 'text-left'

  const bubble = document.createElement('div')
  // Dark mode bubbles
  bubble.className =
    sender === 'user'
      ? 'bg-neon-blue text-white p-3 rounded-2xl rounded-tr-none inline-block max-w-[85%] text-sm shadow-lg shadow-blue-500/20'
      : 'bg-white/10 text-gray-200 p-3 rounded-2xl rounded-tl-none inline-block max-w-[85%] text-sm border border-white/5'

  bubble.innerHTML = `<p>${isLoading ? '<i class="fas fa-circle-notch fa-spin mr-2"></i>' : ''}${text}</p>`
  messageDiv.appendChild(bubble)
  chatMessages.appendChild(messageDiv)

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight

  return messageId
}

async function checkTodayMatches() {
  try {
    const response = await fetch(`${API_BASE_URL}/today-matches`)
    const data = await response.json()

    if (data.matches && data.matches.length > 0) {
      console.log(`🏆 ${data.matches.length} matches today!`)
    }
  } catch (error) {
    console.log('Could not check today matches:', error)
  }
}

// DOM Elements
const standingsTab = document.getElementById('standingsTab')
const predictionsTab = document.getElementById('predictionsTab')
const standingsSection = document.getElementById('standingsSection')
const predictionsSection = document.getElementById('predictionsSection')
const getStandingsBtn = document.getElementById('getStandings')
const getPredictionsBtn = document.getElementById('getPredictions')
const loadFixturesBtn = document.getElementById('loadFixtures')
const loading = document.getElementById('loading')
const errorAlert = document.getElementById('errorAlert')

// Tab switching
standingsTab.addEventListener('click', () => {
  switchTab('standings')
})

predictionsTab.addEventListener('click', () => {
  switchTab('predictions')
})

function switchTab(tab) {
  if (tab === 'standings') {
    // Active Standings
    standingsTab.className =
      'relative z-10 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 bg-neon-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
    // Inactive Predictions
    predictionsTab.className =
      'relative z-10 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/5'

    standingsSection.classList.remove('hidden')
    predictionsSection.classList.add('hidden')
  } else {
    // Active Predictions
    predictionsTab.className =
      'relative z-10 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 bg-neon-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
    // Inactive Standings
    standingsTab.className =
      'relative z-10 px-8 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-all duration-300 hover:bg-white/5'

    predictionsSection.classList.remove('hidden')
    standingsSection.classList.add('hidden')
  }
}

// Get Standings
getStandingsBtn.addEventListener('click', async () => {
  const league = document.getElementById('leagueSelect').value
  const season = document.getElementById('seasonSelect').value

  if (!league) {
    showError('Please select a league')
    return
  }

  showLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/standings?league=${league}&season=${season}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch standings')
    }

    displayStandings(data, league)
  } catch (error) {
    console.error('Fetch error:', error)
    showError(error.message)
  } finally {
    showLoading(false)
  }
})

// Load Fixtures
loadFixturesBtn.addEventListener('click', async () => {
  const league = document.getElementById('fixtureLeagueSelect').value

  if (!league) {
    showError('Please select a league')
    return
  }

  showLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/fixtures?league=${league}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch fixtures')
    }

    populateFixtures(data)
  } catch (error) {
    showError(error.message)
  } finally {
    showLoading(false)
  }
})

// Get AI Predictions
getPredictionsBtn.addEventListener('click', async () => {
  const selectedMatch = document.getElementById('fixtureSelect').value

  if (!selectedMatch) {
    showError('Please select a match')
    return
  }

  showLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/predictions?matchId=${selectedMatch}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get analysis')
    }

    displayPredictions(data)
  } catch (error) {
    showError(error.message)
  } finally {
    showLoading(false)
  }
})

function displayStandings(data, leagueId) {
  const leagueNames = {
    39: 'Premier League',
    140: 'La Liga',
    78: 'Bundesliga',
    135: 'Serie A',
    61: 'Ligue 1',
    2: 'Champions League',
    88: 'Eredivisie',
    71: 'Serie A (BRA)',
    72: 'Championship',
    94: 'Primeira Liga',
    4: 'Euro Championship',
  }

  const leagueTitle = data.data?.name || leagueNames[leagueId] || 'League Table'
  document.getElementById('leagueTitle').innerHTML =
    `<i class="fas fa-trophy mr-3 text-neon-green"></i>${leagueTitle}`

  const tbody = document.getElementById('standingsTable')
  tbody.innerHTML = ''

  const standings = data.data?.standings || []

  if (standings && standings.length > 0) {
    standings.forEach((team, index) => {
      const row = document.createElement('tr')

      // Dark mode Row Styling
      let rowClass = 'hover:bg-white/5 transition-all duration-200 border-b border-white/5'
      let positionStyles = 'text-gray-400'

      if (index < 4) {
        // Champions League spots
        rowClass += ' bg-gradient-to-r from-neon-blue/10 to-transparent border-l-2 border-neon-blue'
        positionStyles = 'text-neon-blue font-bold'
      } else if (index >= standings.length - 3) {
        // Relegation spots
        rowClass += ' bg-gradient-to-r from-red-900/10 to-transparent border-l-2 border-red-500'
        positionStyles = 'text-red-500'
      }

      row.className = rowClass

      const getStatValue = (statName) => {
        const stat = team.stats?.find((s) => s.name === statName)
        return stat ? stat.value : 0
      }

      const position = getStatValue('rank') || index + 1
      const teamName = team.team?.name || 'Unknown'
      const teamLogo = team.team?.logos?.[0]?.href || ''
      const gamesPlayed = getStatValue('gamesPlayed')
      const wins = getStatValue('wins')
      const ties = getStatValue('ties')
      const losses = getStatValue('losses')
      const points = getStatValue('points')

      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${positionStyles}">${position}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-3">
                        ${teamLogo ? `<img class="h-8 w-8 object-contain" src="${teamLogo}" alt="${teamName}" onerror="this.style.display='none'">` : ''}
                        <i class="fas fa-shield-alt text-gray-600 ${teamLogo ? 'hidden' : ''}"></i>
                        <span class="font-bold text-white tracking-wide">${teamName}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-gray-400 font-mono">
                    ${gamesPlayed}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-neon-green font-bold font-mono">${wins}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-gray-400 font-mono">${ties}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-neon-red font-bold font-mono">${losses}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded shadow-inner font-mono">${points}</span>
                </td>
            `

      tbody.appendChild(row)
    })
  } else {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center space-y-3">
                        <i class="fas fa-search text-4xl opacity-50"></i>
                        <p>No standings data available</p>
                    </div>
                </td>
            </tr>
        `
  }

  const resultsDiv = document.getElementById('standingsResults')
  resultsDiv.classList.remove('hidden')
  resultsDiv.classList.add('animate-fade-in')
}

function displayPredictions(data) {
  const content = document.getElementById('predictionsContent')
  const match = data.match
  const prediction = data.prediction
  const h2h = data.headToHead
  const homeForm = data.homeTeamForm
  const awayForm = data.awayTeamForm

  const getConfidenceColor = (confidence) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'text-neon-green shadow-green-500/50'
      case 'medium':
        return 'text-yellow-500 shadow-yellow-500/50'
      default:
        return 'text-gray-400'
    }
  }

  console.log('H2H Data:', h2h)
  let h2hSection = ''
  if (h2h && h2h.matches) {
    const recentMatches = h2h.matches.slice(0, 5)
    h2hSection = `
            <div class="bg-white/5 p-6 rounded-2xl border border-white/5 mb-6">
                <h4 class="font-bold text-white mb-4 flex items-center text-sm uppercase tracking-wider">
                    <i class="fas fa-history mr-2 text-neon-blue"></i>
                    Head-to-Head History
                </h4>
                <div class="space-y-2">
                    ${recentMatches
                      .map((match) => {
                        const homeGoals = match.score?.fullTime?.home || 0
                        const awayGoals = match.score?.fullTime?.away || 0
                        const date = new Date(match.utcDate).toLocaleDateString('en-GB')

                        return `
                            <div class="flex justify-between items-center bg-black/40 p-3 rounded-lg border-l-2 border-white/20 hover:border-neon-blue transition-all">
                                <div class="flex-1 text-left">
                                    <span class="text-gray-300 text-sm">${match.homeTeam.name}</span>
                                </div>
                                <div class="px-4">
                                     <span class="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded text-xs">${homeGoals} - ${awayGoals}</span>
                                </div>
                                <div class="flex-1 text-right">
                                    <span class="text-gray-300 text-sm">${match.awayTeam.name}</span>
                                </div>
                            </div>
                        `
                      })
                      .join('')}
                </div>
            </div>
        `
  }

  content.innerHTML = `
        <div class="space-y-6">
            <!-- Match Header -->
            <div class="relative bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 rounded-3xl border border-white/10 overflow-hidden">
                <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                
                <div class="relative z-10 flex justify-between items-center">
                    <div class="text-center flex-1">
                        ${match.homeTeam.crest ? `<img src="${match.homeTeam.crest}" class="h-16 w-16 mx-auto mb-3 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">` : ''}
                        <p class="font-bold text-lg text-white tracking-wide">${match.homeTeam.name}</p>
                    </div>
                    
                    <div class="text-center px-4">
                        <div class="bg-black/50 backdrop-blur-md border border-neon-purple/50 rounded-full px-6 py-2 mb-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                            <span class="text-neon-purple font-bold tracking-widest text-sm">VS</span>
                        </div>
                        <p class="text-xs text-gray-400 uppercase tracking-widest">${new Date(match.utcDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="text-center flex-1">
                         ${match.awayTeam.crest ? `<img src="${match.awayTeam.crest}" class="h-16 w-16 mx-auto mb-3 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">` : ''}
                        <p class="font-bold text-lg text-white tracking-wide">${match.awayTeam.name}</p>
                    </div>
                </div>
            </div>
            
            ${h2hSection}
            
            <!-- Cards Grid -->
            <div class="grid md:grid-cols-3 gap-6">
                <!-- Winner Prediction -->
                <div class="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-neon-purple/50 transition-all group">
                    <div class="text-center">
                         <i class="fas fa-crown text-3xl mb-4 text-neon-purple group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.8)] transition-all"></i>
                        <h4 class="text-gray-400 text-xs uppercase tracking-widest mb-2">Predicted Winner</h4>
                        <p class="text-2xl font-bold text-white mb-2">${prediction.winner}</p>
                        <div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/40 border border-white/10 ${getConfidenceColor(prediction.confidence)}">
                            ${prediction.confidence} Confidence
                        </div>
                    </div>
                </div>
                
                <!-- Win Probability -->
                 <div class="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-neon-blue/50 transition-all">
                    <div class="text-center">
                        <i class="fas fa-chart-pie text-3xl mb-4 text-neon-blue"></i>
                        <h4 class="text-gray-400 text-xs uppercase tracking-widest mb-4">Win Probability</h4>
                        
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-gray-300">Home</span>
                                    <span class="text-neon-blue font-bold">${prediction.homeWinProbability}%</span>
                                </div>
                                <div class="w-full bg-black/50 rounded-full h-1.5">
                                    <div class="bg-neon-blue h-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style="width: ${prediction.homeWinProbability}%"></div>
                                </div>
                            </div>
                            <div>
                                 <div class="flex justify-between text-xs mb-1">
                                    <span class="text-gray-300">Away</span>
                                    <span class="text-cyan-400 font-bold">${prediction.awayWinProbability}%</span>
                                </div>
                                <div class="w-full bg-black/50 rounded-full h-1.5">
                                    <div class="bg-cyan-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" style="width: ${prediction.awayWinProbability}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Analysis Text -->
                 <div class="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-green-500/50 transition-all">
                    <div class="text-center">
                        <i class="fas fa-microchip text-3xl mb-4 text-neon-green"></i>
                        <h4 class="text-gray-400 text-xs uppercase tracking-widest mb-2">AI Summary</h4>
                        <p class="text-sm text-gray-300 leading-relaxed font-light">"${prediction.analysis}"</p>
                    </div>
                </div>
            </div>
            
             <!-- AI Advice -->
            <div class="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-2xl border border-yellow-500/20 flex items-start space-x-4">
                 <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-lightbulb text-yellow-500"></i>
                </div>
                <div>
                    <h4 class="font-bold text-yellow-500 text-sm uppercase tracking-wider mb-1">Strategic Insight</h4>
                    <p class="text-gray-300 text-sm leading-relaxed">${prediction.advice}</p>
                </div>
            </div>
        </div>
    `

  const resultsDiv = document.getElementById('predictionsResults')
  resultsDiv.classList.remove('hidden')
  resultsDiv.classList.add('animate-fade-in')
}

function showLoading(show) {
  if (show) {
    loading.classList.remove('hidden')
  } else {
    loading.classList.add('hidden')
  }
}

function populateFixtures(data) {
  const fixtureSelect = document.getElementById('fixtureSelect')
  fixtureSelect.innerHTML = '<option value="">⚽ Select Match</option>'

  if (data.matches && data.matches.length > 0) {
    data.matches.forEach((match) => {
      const option = document.createElement('option')
      option.value = match.id
      option.className = 'bg-gray-900 text-white'
      const date = new Date(match.utcDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      option.textContent = `${match.homeTeam.name} vs ${match.awayTeam.name} (${date})`
      fixtureSelect.appendChild(option)
    })
    fixtureSelect.disabled = false
    fixtureSelect.classList.remove('opacity-50')
  } else {
    fixtureSelect.innerHTML = '<option value="">No matches upcoming</option>'
    fixtureSelect.classList.add('opacity-50')
  }
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message
  errorAlert.classList.remove('hidden')

  setTimeout(() => {
    errorAlert.classList.add('hidden')
  }, 5000)
}

// Email subscription functions
function showEmailModal() {
  document.getElementById('emailModal').classList.remove('hidden')
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.add('hidden')
  document.getElementById('emailInput').value = ''
}

async function subscribeEmail() {
  const email = document.getElementById('emailInput').value
  if (!email || !email.includes('@')) {
    showError('Please enter valid email')
    return
  }

  // Simulate API call for demo (or real if endpoint exists)
  try {
    // Just close it for now as UI demo, or add real fetch if endpoint is confirmed working
    closeEmailModal()
    alert('Subscribed successfully!')
  } catch (error) {
    showError('Failed to subscribe')
  }
}
