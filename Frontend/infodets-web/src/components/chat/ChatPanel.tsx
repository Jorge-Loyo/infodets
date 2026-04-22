'use client'

import { Box, Stack, Text, Paper, Textarea, ActionIcon, Group, ThemeIcon } from '@mantine/core'
import { IconSend, IconRobot } from '@tabler/icons-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export function ChatPanel() {
  const [pregunta, setPregunta] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
    }
  }

  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Área de mensajes */}
      <Box style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <Stack align="center" gap="md" mt={60}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <ThemeIcon size={56} radius="xl" variant="light" color="blue">
              <IconRobot size={28} />
            </ThemeIcon>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Stack align="center" gap={4}>
              <Text fw={600} size="lg">¿En qué puedo ayudarte?</Text>
              <Text c="dimmed" size="sm" ta="center" maw={400}>
                Realiza una consulta en lenguaje natural sobre normativas,
                procedimientos o documentos institucionales.
              </Text>
            </Stack>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ width: '100%', maxWidth: 500 }}
          >
            <Stack gap="xs">
              {['¿Cuál es el proceso de licitación?', '¿Qué normativas aplican para permisos?'].map((sugerencia, i) => (
                <Paper
                  key={i}
                  p="sm"
                  radius="md"
                  withBorder
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setPregunta(sugerencia)}
                >
                  <Text size="sm" c="dimmed">{sugerencia}</Text>
                </Paper>
              ))}
            </Stack>
          </motion.div>
        </Stack>
      </Box>

      {/* Input de consulta */}
      <Box
        style={{
          borderTop: '1px solid var(--mantine-color-gray-2)',
          padding: 16,
          backgroundColor: 'var(--mantine-color-white)',
        }}
      >
        <Group align="flex-end" gap="xs">
          <Textarea
            placeholder="Escribe tu consulta aquí..."
            value={pregunta}
            onChange={(e) => setPregunta(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={4}
            radius="md"
            style={{ flex: 1 }}
          />
          <ActionIcon
            size="lg"
            radius="md"
            variant="filled"
            color="blue"
            disabled={!pregunta.trim()}
          >
            <IconSend size={16} />
          </ActionIcon>
        </Group>
        <Text size="xs" c="dimmed" mt={6} ta="center">
          Las respuestas se basan en documentos oficiales verificados.
        </Text>
      </Box>
    </Box>
  )
}
