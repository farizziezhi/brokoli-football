import { Resend } from 'resend'
import env from '#start/env'
import { createClient } from '@supabase/supabase-js'

export default class NotificationService {
  private static supabase = createClient(
    env.get('SUPABASE_URL') || '',
    env.get('SUPABASE_ANON_KEY') || ''
  )
  
  private static async loadSubscriptions(): Promise<Array<{email: string, leagues: string[]}>> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('email, leagues')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error loading subscriptions:', error)
      return []
    }
  }

  static async addSubscription(email: string, leagues: string[]) {
    try {
      const { error } = await this.supabase
        .from('subscriptions')
        .upsert({ email, leagues }, { onConflict: 'email' })
      
      if (error) throw error
    } catch (error) {
      console.error('Error saving subscription:', error)
    }
  }

  static async sendDailyNotifications() {
    try {
      const response = await fetch('https://brokoli-football-production.up.railway.app/api/today-matches')
      const data = await response.json() as any
      
      if (data.matches && data.matches.length > 0) {
        console.log(`🏆 ${data.matches.length} pertandingan hari ini! Mengirim email...`)
        
        // Send emails to all subscribers
        const subscriptions = await this.loadSubscriptions()
        for (const subscriber of subscriptions) {
          await this.sendEmail(subscriber.email, data.matches)
        }
        
        return { success: true, matchCount: data.matches.length, emailsSent: subscriptions.length }
      }
      
      const subscriptions = await this.loadSubscriptions()
      return { success: true, matchCount: 0, emailsSent: subscriptions.length }
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

  static async getSubscriptionCount() {
    const subscriptions = await this.loadSubscriptions()
    return subscriptions.length
  }
}