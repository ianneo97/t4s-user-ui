import { z } from 'zod'

const envSchema = z.object({
  VITE_AZURE_ADB2C_CLIENT_ID: z.string().min(1, 'Azure AD B2C Client ID is required'),
  VITE_AZURE_ADB2C_AUTHORITY: z.string().min(1, 'Azure AD B2C Authority is required'),
  VITE_AZURE_ADB2C_KNOWN_AUTHORITY: z.string().min(1, 'Azure AD B2C Known Authority is required'),
  VITE_AZURE_ADB2C_REDIRECT_URI: z.string().default('/'),
  VITE_AZURE_ADB2C_SCOPE: z.string().default('openid'),
  VITE_API_BASE_URL: z.string().optional(),
})

function validateEnv() {
  if (import.meta.env.DEV) {
    const result = envSchema.safeParse(import.meta.env)
    if (!result.success) {
      console.warn(
        'Environment validation warnings:',
        result.error.flatten().fieldErrors
      )
    }
    return
  }

  envSchema.parse(import.meta.env)
}

validateEnv()

export const env = {
  azure: {
    clientId: import.meta.env.VITE_AZURE_ADB2C_CLIENT_ID || '',
    authority: import.meta.env.VITE_AZURE_ADB2C_AUTHORITY || '',
    knownAuthority: import.meta.env.VITE_AZURE_ADB2C_KNOWN_AUTHORITY || '',
    redirectUri: import.meta.env.VITE_AZURE_ADB2C_REDIRECT_URI || '/',
    scope: import.meta.env.VITE_AZURE_ADB2C_SCOPE || 'openid',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}
