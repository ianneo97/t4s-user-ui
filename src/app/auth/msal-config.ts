import type { Configuration } from '@azure/msal-browser'
import { LogLevel } from '@azure/msal-browser'

import { env } from '@/config/env'
import { logger } from '@/lib/logger'

export const msalConfig: Configuration = {
  auth: {
    clientId: env.azure.clientId,
    authority: env.azure.authority,
    knownAuthorities: [env.azure.knownAuthority],
    redirectUri: env.azure.redirectUri,
    postLogoutRedirectUri: '/',
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return

        const context = 'MSAL'
        switch (level) {
          case LogLevel.Error:
            logger.error(message, undefined, { context })
            return
          case LogLevel.Info:
            logger.info(message, undefined, { context })
            return
          case LogLevel.Verbose:
            logger.debug(message, undefined, { context })
            return
          case LogLevel.Warning:
            logger.warn(message, undefined, { context })
            return
        }
      },
    },
  },
}

export const loginRequest = {
  scopes: [env.azure.scope],
}
