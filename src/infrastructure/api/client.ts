import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import axios from 'axios'

import { env } from '@/config/env'
import { logger } from '@/lib/logger'
import { acquireToken, msalInstance } from '@/lib/msal'
import type { ApiError } from './types'

const TOKEN_KEY = 'api_token'
const EXPIRATION_KEY = 'api_token_exp'

function getStoredToken() {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiration = sessionStorage.getItem(EXPIRATION_KEY)
  return {
    token,
    expirationTime: expiration ? parseInt(expiration) : 0,
  }
}

function setStoredToken(token: string, expirationTime: number) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(EXPIRATION_KEY, expirationTime.toString())
}

function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(EXPIRATION_KEY)
}

function getWorkspaceId() {
  return sessionStorage.getItem('workspace') || ''
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.api.baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use(async (config) => {
    if (config.url) {
      config.url = config.url.replace(/([^:]\/)\/+/g, '$1')
    }

    const workspaceId = getWorkspaceId()
    if (workspaceId && config.headers) {
      config.headers['X-T4S-OWI'] = workspaceId
    }

    const currentTime = Date.now()
    const { token, expirationTime } = getStoredToken()

    if (token && currentTime < expirationTime) {
      if (config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    try {
      const newToken = await acquireToken()
      if (newToken) {
        setStoredToken(newToken, currentTime + 55 * 60 * 1000)
        if (config.headers && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      }
    } catch (error) {
      logger.error('Failed to acquire token', error, { context: 'API' })
    }

    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
        clearStoredToken()
        msalInstance.loginRedirect()
      }

      const apiError: ApiError = {
        message: error.response?.data?.message || error.message,
        code: error.response?.data?.code,
        details: error.response?.data?.details,
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}

export const apiClient = createApiClient()

export class BaseApi {
  protected baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  protected async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<T>(`${this.baseUrl}${path}`, config)
    return response.data
  }

  protected async post<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.post<T>(
      `${this.baseUrl}${path}`,
      data,
      config
    )
    return response.data
  }

  protected async patch<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.patch<T>(
      `${this.baseUrl}${path}`,
      data,
      config
    )
    return response.data
  }

  protected async put<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.put<T>(
      `${this.baseUrl}${path}`,
      data,
      config
    )
    return response.data
  }

  protected async delete<T>(
    path: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await apiClient.delete<T>(`${this.baseUrl}${path}`, config)
    return response.data
  }
}
