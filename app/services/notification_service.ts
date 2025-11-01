import { Resend } from 'resend'
import env from '#start/env'

export default class NotificationService {
  private static subscriptions: Array<{email: string, leagues: string[]}> = []

  static addSubscription(email: string, leagues: string[]) {
    this.subscriptions.push({ email, leagues })
  }

  static async sendDailyNotifications() {
    try {
      const response = await fetch('https://brokoli-football-production.up.railway.app/api/today-matches')
      const data = await response.json() as any
      
      if (data.matches && data.matches.length > 0) {
        console.log(`🏆 ${data.matches.length} pertandingan hari ini! Mengirim email...`)
        
        // Send emails to all subscribers
        for (const subscriber of this.subscriptions) {
          await this.sendEmail(subscriber.email, data.matches)
        }
        
        return { success: true, matchCount: data.matches.length, emailsSent: this.subscriptions.length }
      }
      
      return { success: true, matchCount: 0, emailsSent: 0 }
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
    return this.subscriptions.length
  }
}