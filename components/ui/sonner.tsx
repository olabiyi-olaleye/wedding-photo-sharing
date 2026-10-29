'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl shadow-lg shadow-foreground/5 border border-border/50',
          title: 'font-medium text-sm',
          description: 'text-xs text-muted-foreground',
          success: 'border-success/30 bg-success/5',
          error: 'border-destructive/30 bg-destructive/5',
          warning: 'border-warning/30 bg-warning/5',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--popover)',
          '--success-text': 'var(--success)',
          '--success-border': 'var(--success)',
          '--error-bg': 'var(--popover)',
          '--error-text': 'var(--destructive)',
          '--error-border': 'var(--destructive)',
          '--border-radius': '1rem',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
