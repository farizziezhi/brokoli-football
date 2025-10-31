import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class FootballController {
  private readonly footballDataUrl = 'https://api.football-data.org/v4'
  private readonly footballDataKey = env.get('FOOTBALL_DATA_API_KEY')

  async fixtures({ request, response }: HttpContext) {
    const league = request.input('league')
    
    if (!league) {
      return response.badRequest({ error: 'Parameter league wajib diisi' })
    }

    // Mapping league ID untuk football-data.org
    const footballDataLeagues: Record<string, string> = {
      '39': 'PL',    // Premier League
      '140': 'PD',   // Primera Division
      '78': 'BL1',   // Bundesliga
      '135': 'SA',   // Serie A
      '61': 'FL1',   // Ligue 1
      '2': 'CL',     // UEFA Champions League
      '88': 'DED',   // Eredivisie
      '71': 'BSA',   // Campeonato Brasileiro Série A
      '72': 'ELC',   // Championship
      '94': 'PPL',   // Primeira Liga
      '4': 'EC'      // European Championship
    }

    const leagueCode = footballDataLeagues[league]
    if (!leagueCode) {
      return response.badRequest({ 
        error: 'Liga tidak didukung untuk fixtures', 
        supportedLeagues: {
          '39': 'Premier League',
          '140': 'Primera Division',
          '78': 'Bundesliga',
          '135': 'Serie A',
          '61': 'Ligue 1',
          '2': 'UEFA Champions League',
          '88': 'Eredivisie',
          '71': 'Campeonato Brasileiro Série A',
          '72': 'Championship',
          '94': 'Primeira Liga',
          '4': 'European Championship'
        }
      })
    }

    try {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
      
      const dateFrom = today.toISOString().split('T')[0]
      const dateTo = nextWeek.toISOString().split('T')[0]
      
      const url = `${this.footballDataUrl}/competitions/${leagueCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
      
      const headers: Record<string, string> = {}
      if (this.footballDataKey) {
        headers['X-Auth-Token'] = this.footballDataKey
      }
      
      const apiResponse = await fetch(url, { headers })
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.text()
        return response.status(apiResponse.status).json({ error: 'API Error', details: errorData })
      }

      const data = await apiResponse.json()
      return response.json(data)
    } catch (error) {
      return response.internalServerError({ error: 'Gagal mengambil data fixtures', details: error.message })
    }
  }

  async predictions({ request, response }: HttpContext) {
    const matchId = request.input('matchId')
    
    if (!matchId) {
      return response.badRequest({ error: 'Parameter matchId wajib diisi' })
    }

    try {
      // Get match details
      const matchUrl = `${this.footballDataUrl}/matches/${matchId}`
      const headers: Record<string, string> = {}
      if (this.footballDataKey) {
        headers['X-Auth-Token'] = this.footballDataKey
      }
      
      const matchResponse = await fetch(matchUrl, { headers })
      if (!matchResponse.ok) {
        return response.status(matchResponse.status).json({ error: 'Match not found' })
      }
      
      const matchData = await matchResponse.json() as any
      console.log('Match data:', matchData)
      
      if (!matchData.homeTeam || !matchData.awayTeam) {
        return response.badRequest({ error: 'Invalid match data structure' })
      }
      
      // const homeTeamId = matchData.homeTeam.id
      // const awayTeamId = matchData.awayTeam.id
      
      // Get head-to-head data
      const h2hUrl = `${this.footballDataUrl}/matches/${matchId}/head2head`
      const h2hResponse = await fetch(h2hUrl, { headers })
      
      let h2hData = null
      if (h2hResponse.ok) {
        h2hData = await h2hResponse.json()
      }
      
      // Generate AI prediction
      const prediction = this.generatePrediction(matchData, h2hData)
      
      return response.json({
        match: matchData,
        headToHead: h2hData,
        prediction: prediction
      })
    } catch (error) {
      return response.internalServerError({ error: 'Gagal mengambil data prediksi', details: error.message })
    }
  }

  private generatePrediction(matchData: any, h2hData: any) {
    let homeScore = 50
    let awayScore = 50
    
    const homeTeamName = matchData.homeTeam?.name || 'Home Team'
    const awayTeamName = matchData.awayTeam?.name || 'Away Team'
    const homeTeamId = matchData.homeTeam?.id
    const awayTeamId = matchData.awayTeam?.id
    
    // Analyze head-to-head if available
    if (h2hData && h2hData.matches && h2hData.matches.length > 0) {
      const recentMatches = h2hData.matches.slice(0, 5) // Last 5 matches
      let homeWins = 0
      let awayWins = 0
      let draws = 0
      
      recentMatches.forEach((match: any) => {
        const homeGoals = match.score?.fullTime?.home || 0
        const awayGoals = match.score?.fullTime?.away || 0
        
        if (homeGoals > awayGoals) {
          if (match.homeTeam?.id === homeTeamId) {
            homeWins++
          } else {
            awayWins++
          }
        } else if (homeGoals < awayGoals) {
          if (match.awayTeam?.id === awayTeamId) {
            awayWins++
          } else {
            homeWins++
          }
        } else {
          draws++
        }
      })
      
      // Adjust scores based on head-to-head
      const totalMatches = recentMatches.length
      if (totalMatches > 0) {
        homeScore = 30 + (homeWins / totalMatches) * 40
        awayScore = 30 + (awayWins / totalMatches) * 40
        
        // Add home advantage
        homeScore += 10
        awayScore -= 5
      }
    } else {
      // Default prediction with home advantage
      homeScore = 55
      awayScore = 45
    }
    
    // Normalize to 100%
    const total = homeScore + awayScore
    homeScore = Math.round((homeScore / total) * 100)
    awayScore = 100 - homeScore
    
    let winner = 'Draw'
    let confidence = 'Low'
    
    if (homeScore > 60) {
      winner = homeTeamName
      confidence = homeScore > 70 ? 'High' : 'Medium'
    } else if (awayScore > 60) {
      winner = awayTeamName
      confidence = awayScore > 70 ? 'High' : 'Medium'
    }
    
    return {
      winner: winner,
      homeWinProbability: homeScore,
      awayWinProbability: awayScore,
      confidence: confidence,
      advice: `Berdasarkan analisis head-to-head, ${winner === 'Draw' ? 'pertandingan kemungkinan berakhir imbang' : winner + ' memiliki peluang menang lebih besar'}`,
      analysis: h2hData ? `Analisis berdasarkan ${h2hData.matches?.length || 0} pertandingan terakhir` : 'Analisis berdasarkan home advantage'
    }
  }

  async standings({ request, response }: HttpContext) {
    const league = request.input('league')
    const season = request.input('season')
    
    if (!league || !season) {
      return response.badRequest({ error: 'Parameter league dan season wajib diisi' })
    }

    // Mapping league ID untuk API standings
    const leagueMapping: Record<string, string> = {
      '39': 'eng.1',     // English Premier League
      '140': 'esp.1',    // Spanish Primera División (La Liga)
      '78': 'ger.1',     // German Bundesliga
      '135': 'ita.1',    // Italian Serie A
      '61': 'fra.1',     // French Ligue 1
      '88': 'ned.1',     // Dutch Eredivisie
      '94': 'por.1',     // Portuguese Liga
      '203': 'tur.1',    // Turkish Super Lig
      '71': 'bra.1',     // Brazilian Serie A
      '262': 'mex.1',    // Mexican Liga BBVA MX
      '1': 'arg.1',      // Argentine Liga Profesional
      '188': 'rus.1',    // Russian Premier League
      '98': 'jpn.1',     // Japanese J League
      '271': 'aus.1',    // Australian A-League
      '253': 'chn.1',    // Chinese Super League
      '317': 'idn.1',    // Indonesian Liga 1
      '286': 'mys.1',    // Malaysian Super League
      '340': 'sgp.1',    // Singaporean Premier League
      '316': 'tha.1',    // Thai Premier League
    }

    const leagueName = leagueMapping[league]
    if (!leagueName) {
      return response.badRequest({ 
        error: 'Liga tidak didukung', 
        supportedLeagues: {
          '39': 'English Premier League',
          '140': 'Spanish La Liga',
          '78': 'German Bundesliga',
          '135': 'Italian Serie A',
          '61': 'French Ligue 1',
          '88': 'Dutch Eredivisie',
          '94': 'Portuguese Liga',
          '203': 'Turkish Super Lig',
          '71': 'Brazilian Serie A',
          '262': 'Mexican Liga BBVA MX',
          '1': 'Argentine Liga Profesional',
          '188': 'Russian Premier League',
          '98': 'Japanese J League',
          '271': 'Australian A-League',
          '253': 'Chinese Super League',
          '317': 'Indonesian Liga 1',
          '286': 'Malaysian Super League',
          '340': 'Singaporean Premier League',
          '316': 'Thai Premier League'
        }
      })
    }

    try {
      const url = `https://football-standings-api.vercel.app/leagues/${leagueName}/standings?season=${season}&sort=asc`
      console.log('Calling URL:', url)
      
      const apiResponse = await fetch(url)
      console.log('Response status:', apiResponse.status)

      if (!apiResponse.ok) {
        const errorData = await apiResponse.text()
        console.log('API Error:', apiResponse.status, errorData)
        return response.status(apiResponse.status).json({ error: 'API Error', details: errorData })
      }

      const data = await apiResponse.json()
      console.log('Success data:', JSON.stringify(data, null, 2))
      return response.json(data)
    } catch (error) {
      console.log('Fetch Error:', error)
      return response.internalServerError({ error: 'Gagal mengambil data klasemen', details: error.message })
    }
  }


}