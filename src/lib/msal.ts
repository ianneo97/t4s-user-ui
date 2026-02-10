import {
  EventType,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser'
import type { AuthenticationResult, EventMessage } from '@azure/msal-browser'

import { msalConfig, loginRequest } from '@/app/auth/msal-config'

export const msalInstance = new PublicClientApplication(msalConfig)

export async function initializeMsal(): Promise<PublicClientApplication> {
  await msalInstance.initialize()

  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0])
  }

  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult
      msalInstance.setActiveAccount(payload.account)
    }
  })

  return msalInstance
}

export async function acquireToken(): Promise<string | null> {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return null
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: accounts[0],
    })
    return response.idToken
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect(loginRequest)
    }
    throw error
  }
}

export function logout(): void {
  msalInstance.logoutRedirect()
}
