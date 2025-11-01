import type { HttpContext } from '@adonisjs/core/http'
import { GoogleGenerativeAI } from '@google/generative-ai'
import env from '#start/env'

export default class ChatbotController {
  private genAI = new GoogleGenerativeAI(env.get('GEMINI_API_KEY') || '')

  async chat({ request, response }: HttpContext) {
    const { message } = request.only(['message'])

    if (!message) {
      return response.badRequest({ error: 'Message wajib diisi' })
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

      const prompt = `Kamu adalah asisten AI untuk website Brokoli Football. 
      Jawab pertanyaan tentang sepak bola, prediksi pertandingan, klasemen liga, dan jadwal pertandingan.
      Gunakan bahasa Indonesia yang ramah dan informatif.
      
      Pertanyaan user: ${message}`

      const result = await model.generateContent(prompt)
      const aiResponse = result.response.text()

      return response.json({
        success: true,
        message: aiResponse,
      })
    } catch (error: any) {
      console.error('Gemini API error:', error)
      return response.internalServerError({
        error: 'Gagal memproses pesan',
        details: error.message,
      })
    }
  }
}
