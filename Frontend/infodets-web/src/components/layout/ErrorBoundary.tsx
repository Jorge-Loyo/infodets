'use client'

import { Component, ReactNode } from 'react'
import { Container, Title, Text, Button } from '@mantine/core'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container py="xl" ta="center">
          <Title order={3} mb="sm">Ocurrió un error inesperado</Title>
          <Text c="dimmed" mb="md">Por favor recargue la página o contacte al administrador.</Text>
          <Button onClick={() => this.setState({ hasError: false })}>Reintentar</Button>
        </Container>
      )
    }
    return this.props.children
  }
}
