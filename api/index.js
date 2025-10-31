// Vercel serverless function entry point
import { createServer } from '../build/bin/server.js'

export default async function handler(req, res) {
  const server = await createServer()
  return server(req, res)
}