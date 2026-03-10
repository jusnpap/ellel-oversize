import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_ADMIN === 'true',
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://ellel-oversize.onrender.com",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    ...(process.env.REDIS_URL ? { redisUrl: process.env.REDIS_URL } : {}),
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
