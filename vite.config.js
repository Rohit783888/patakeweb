import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// On Vercel, files in api/ run as serverless functions. `npm run dev` doesn't
// do that by itself, so this serves /api/order from api/order.js locally too.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/order', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/order.js')
          await handler(req, res)
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Local API error, see terminal.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Make server-only keys from .env (TURNSTILE_SECRET_KEY, FIREBASE_SERVICE_ACCOUNT)
  // available to the local API. They are not VITE_-prefixed, so never reach the browser.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), localApi()],
  }
})
