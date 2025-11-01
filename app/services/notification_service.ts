import { Resend } from 'resend'
import env from '#start/env'
import fs from 'fs'
import path from 'path'

export default class NotificationService {
  private static subscriptionsFile = path.join(process.cwd(), 'subscriptions.json')
  
  private static loadSubscriptions(): Array<{email: string, leagues: string[]}> {
    try {
      if (fs.existsSync(this.subscriptionsFile)) {
        const data = fs.readFileSync(this.subscriptionsFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    }
    return []
  }
  
  private static saveSubscriptions(subscriptions: Array<{email: string, leagues: string[]}>) {
    try {
      fs.writeFileSync(this.subscriptionsFile, JSON.stringify(subscriptions, null, 2))
    } catch (error) {
      console.error('Error saving subscriptions:', error)
    }
  }

  static addSubscription(email: string, leagues: string[]) {
    const subscriptions = this.loadSubscriptions()
    
    // Check if email already exists
    const existingIndex = subscriptions.findIndex(sub => sub.email === email)
    if (existingIndex >= 0) {
      subscriptions[existingIndex].leagues = leagues // Update leagues
    } else {
      subscriptions.push({ email, leagues }) // Add new
    }
    
    this.saveSubscriptions(subscriptions)
  }

  static async sendDailyNotifications() {
    try {
      const response = await fetch('https://brokoli-football-production.up.railway.app/api/today-matches')
      const data = await response.json() as any
      
      if (data.matches && data.matches.length > 0) {
        console.log(`🏆 ${data.matches.length} pertandingan hari ini! Mengirim email...`)
        
        // Send emails to all subscribers
        const subscriptions = this.loadSubscriptions()
        for (const subscriber of subscriptions) {
          await this.sendEmail(subscriber.email, data.matches)
        }
        
        return { success: true, matchCount: data.matches.length, emailsSent: subscriptions.length }
      }
      
      return { success: true, matchCount: 0, emailsSent: this.loadSubscriptions().length }
    } catch (error: any) {
      console.error('Error sending daily notifications:', error)
      return { success: false, error: error.message }
    }
  }

  private static async sendEmail(email: string, matches: any[]) {
    try {
      const resend = new Resend(env.get('RESEND_API_KEY'))

      const matchList = matches.map(match => 
        `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name} - ${new Date(match.utcDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
      ).join('\n')

      await resend.emails.send({
        from: 'Brokoli Football <noreply@resend.dev>',
        to: email,
        subject: `🏆 ${matches.length} Pertandingan Hari Ini`,
        text: `Halo! Ada ${matches.length} pertandingan menarik hari ini:\n\n${matchList}\n\nKunjungi https://brokoli-football-production.up.railway.app untuk prediksi AI!`
      })

      console.log(`Email sent to ${email}`)
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error)
    }
  }

  static getSubscriptionCount() {
    return this.loadSubscriptions().length
  }
}