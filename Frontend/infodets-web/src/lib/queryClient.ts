import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        console.error('[QueryClient] Error:', error)
      },
    },
  },
})

export default queryClient
