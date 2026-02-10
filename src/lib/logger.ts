const isDev = import.meta.env.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  level?: LogLevel
  context?: string
}

function formatMessage(level: LogLevel, message: string, context?: string): string {
  const timestamp = new Date().toISOString()
  const prefix = context ? `[${context}]` : ''
  return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`
}

export const logger = {
  debug(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      const formatted = formatMessage('debug', message, options?.context)
      if (data !== undefined) {
        console.debug(formatted, data)
      } else {
        console.debug(formatted)
      }
    }
  },

  info(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      const formatted = formatMessage('info', message, options?.context)
      if (data !== undefined) {
        console.info(formatted, data)
      } else {
        console.info(formatted)
      }
    }
  },

  warn(message: string, data?: unknown, options?: LoggerOptions) {
    if (isDev) {
      const formatted = formatMessage('warn', message, options?.context)
      if (data !== undefined) {
        console.warn(formatted, data)
      } else {
        console.warn(formatted)
      }
    }
  },

  error(message: string, error?: unknown, options?: LoggerOptions) {
    const formatted = formatMessage('error', message, options?.context)
    if (error !== undefined) {
      console.error(formatted, error)
    } else {
      console.error(formatted)
    }
  },
}
