import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="flex w-full flex-col px-6 py-8 lg:w-[30%] lg:px-8 lg:py-10">
        <Link to="/" className="mx-auto inline-flex w-fit shrink-0">
          <img src="/haruon-logo-dark.svg" alt="HARUON" className="h-16 w-auto dark:hidden" />
          <img
            src="/haruon-logo.svg"
            alt="HARUON"
            className="hidden h-8 w-auto dark:block"
          />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Card className="ring-0 shadow-none [--card-spacing:1.1rem]">
              <CardHeader className="pb-8 text-center">
                <CardTitle className="text-[3.375rem] leading-tight font-bold">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
            {footer && (
              <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
            )}
          </div>
        </main>
      </div>

      <div className="relative hidden overflow-hidden lg:block lg:w-[70%]">
        <img src="/login-cover.jpg" alt="" className="size-full object-cover" />
      </div>
    </div>
  )
}
