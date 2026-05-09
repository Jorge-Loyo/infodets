'use client'

import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useMemo } from 'react'
import queryClient from '@/lib/queryClient'
import { AuthProvider } from '@/components/layout/AuthProvider'
import { useUiStore } from '@/store/uiStore'

function ThemedApp({ children }: { children: ReactNode }) {
  const { tipografia, paletaColor, colorScheme } = useUiStore()

  const theme = useMemo(() => createTheme({
    primaryColor: paletaColor as Parameters<typeof createTheme>[0]['primaryColor'],
    fontFamily: tipografia,
    defaultRadius: 'md',
    components: {
      Button: { defaultProps: { radius: 'md' } },
    },
  }), [tipografia, paletaColor])

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme}>
      <Notifications position="top-right" />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemedApp>
        {children}
      </ThemedApp>
    </QueryClientProvider>
  )
}
