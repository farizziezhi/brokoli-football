export default class NotificationService {
  private static subscriptions: Array<{endpoint: string, keys: any, leagues: string[]}> = []

  static addSubscription(subscription: any, leagues: string[]) {
    this.subscriptions.push({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      leagues: leagues
    })
  }

  static async sendDailyNotifications() {
    try {
      const response = await fetch('https://brokoli-football-production.up.railway.app/api/today-matches')
      const data = await response.json() as any
      
      if (data.matches && data.matches.length > 0) {
        console.log(`🏆 ${data.matches.length} pertandingan hari ini! Mengirim notifikasi...`)
        return { success: true, matchCount: data.matches.length, subscribers: this.subscriptions.length }
      }
      
      return { success: true, matchCount: 0, subscribers: this.subscriptions.length }
    } catch (error: any) {
      console.error('Error sending daily notifications:', error)
      return { success: false, error: error.message }
    }
  }

  static getSubscriptionCount() {
    return this.subscriptions.length
  }
}