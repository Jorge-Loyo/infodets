'use client'

import '@/lib/amplifyConfig'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import queryClient from '@/lib/queryClient'

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'var(--font-plus-jakarta)',
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} forceColorScheme="light">
        <Notifications position="top-right" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  )
}
