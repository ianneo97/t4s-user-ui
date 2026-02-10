import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import axios from 'axios'

import { env } from '@/config/env'
import type { ApiError } from './types'

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

    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
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
