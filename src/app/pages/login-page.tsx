import type { RedirectRequest } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { ArrowRight, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { loginRequest } from '@/app/auth/msal-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FormData {
  email: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { instance } = useMsal()
  const [isLoading, setIsLoading] = useState(false)

  const predeterminedWorkspace = searchParams.get('workspace')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<FormData>({
    mode: 'onChange',
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    const request: RedirectRequest = {
      ...loginRequest,
      loginHint: data.email,
    }

    if (predeterminedWorkspace) {
      sessionStorage.setItem('predeterminedWorkspace', predeterminedWorkspace)
    }

    await instance.loginRedirect(request)
  }

  const handleGoogleLogin = () => {
    setIsLoading(true)
    instance.loginRedirect({
      ...loginRequest,
      loginHint: getValues('email'),
      prompt: 'login',
    })
  }

  const handleDevBypass = () => {
    sessionStorage.setItem('devBypass', 'true')
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-9rem] h-[28rem] w-[28rem] rounded-full bg-[hsl(16_96%_58%/.22)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[20%] h-[24rem] w-[24rem] rounded-full bg-[hsl(222_90%_56%/.18)] blur-3xl" />
        <div className="absolute bottom-[-11rem] left-[35%] h-[24rem] w-[24rem] rounded-full bg-[hsl(184_86%_45%/.14)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.32]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <section className="hidden w-[54%] flex-col justify-between px-12 py-10 lg:flex xl:px-16 xl:py-12">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[0_20px_28px_-18px_hsl(var(--primary)/0.9)]">
              T4S
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Your Company
              </p>
              <p className="text-base font-semibold">Traceability Studio</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Trusted Workflow
            </p>

            <h1 className="mt-5 text-6xl leading-[0.98] text-balance">
              Build visibility across every supplier layer.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Track products, materials, and BOM composition in one operational
              workspace designed for modern sourcing teams.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: '40+', label: 'Markets' },
                { value: '5k+', label: 'Users' },
                { value: '99.9%', label: 'Uptime' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/80 bg-card/75 p-4"
                >
                  <p className="text-3xl">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Your Company
            </p>
            <a
              href="#"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              yourcompany.com
            </a>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-[46%]">
          <div className="surface-panel w-full max-w-[460px] rounded-3xl p-6 sm:p-8">
            <div className="mb-7">
              <p className="inline-flex items-center gap-2 rounded-full bg-secondary/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Secure Sign-In
              </p>
              <h2 className="mt-4 text-4xl">Welcome back</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Sign in to continue into your traceability workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold">
                  Work Email
                </label>
                <Input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: EMAIL_REGEX,
                      message: 'Please enter a valid email',
                    },
                  })}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  disabled={isLoading}
                  error={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs font-semibold text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                disabled={!isValid || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <span className="bg-card px-3">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDevBypass}
                className="mt-4 h-10 w-full rounded-xl border border-dashed border-border text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:bg-secondary/75"
              >
                Dev: Skip Login
              </Button>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
