import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export interface ErrorViewProps {
  code: ReactNode
  title: string
  description: ReactNode
  actions?: ReactNode
  variant?: 'page' | 'embedded'
}

function ErrorDecoration() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 dark:opacity-40">
      <span className="absolute -top-4 -right-3 size-16 rounded-full bg-pink-300/40" />
      <span className="absolute -top-2 right-8 size-12 rotate-12 rounded-2xl bg-amber-200/50" />
      <span className="absolute top-6 -right-6 size-14 rounded-full bg-sky-300/40" />
      <span className="absolute top-10 right-3 size-9 rotate-45 rounded-lg bg-blue-300/40" />
      <span className="absolute top-14 right-16 size-4 rounded-full bg-pink-400/30" />
    </div>
  )
}

export function ErrorView({
  code,
  title,
  description,
  actions,
  variant = 'page',
}: ErrorViewProps) {
  const isTextCode = typeof code === 'string' || typeof code === 'number'

  return (
    <section
      role="alert"
      className={cn(
        'flex w-full items-center justify-center px-4 py-10 sm:px-6',
        variant === 'page' ? 'min-h-svh bg-muted/40' : 'h-full min-h-[60vh]',
      )}
    >
      <div className="relative w-full max-w-[370px] overflow-hidden rounded-2xl bg-card px-8 py-14 shadow-2xl shadow-foreground/5">
        <ErrorDecoration />
        <div className="relative flex flex-col items-center text-center">
          <img
            src="/haruon-logo-dark.svg"
            alt="HARUON"
            className="h-8 w-auto shrink-0 dark:hidden"
          />
          <img src="/haruon-logo.svg" alt="HARUON" className="hidden h-8 w-auto shrink-0 dark:block" />

          <p
            aria-hidden="true"
            className={cn(
              'mt-10 font-black leading-none tracking-tight',
              isTextCode &&
                'bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-[3.5rem] text-transparent sm:text-[4rem]',
            )}
          >
            {code}
          </p>

          <h1 className="mt-4 text-xl font-bold tracking-tight break-keep text-foreground">
            {title}
          </h1>

          <div className="mt-3 text-sm leading-relaxed break-keep text-balance text-muted-foreground">
            {description}
          </div>

          {actions && <div className="mt-8 flex flex-wrap justify-center gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  )
}
