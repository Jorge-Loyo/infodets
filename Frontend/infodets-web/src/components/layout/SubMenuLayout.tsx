'use client'

import { Box, NavLink, Stack, Text, ThemeIcon, Divider, Select } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'

interface MenuItem {
  label: string
  icon: React.ElementType
  href: string
}

interface SubMenuLayoutProps {
  titulo: string
  menu: MenuItem[]
  children: React.ReactNode
}

export function SubMenuLayout({ titulo, menu, children }: SubMenuLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 62em)')

  return (
    <Box style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Mobile — Select dropdown */}
      {isMobile ? (
        <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
            <Select
              data={menu.map(item => ({ value: item.href, label: item.label }))}
              value={pathname}
              onChange={v => v && router.push(v)}
              radius="md"
              size="sm"
            />
          </Box>
          <Box style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--mantine-color-default-hover)' }}>
            {children}
          </Box>
        </Box>
      ) : (
        /* Desktop — submenú lateral */
        <>
          <Box style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)', overflowY: 'auto', padding: 12 }}>
            <Stack gap={0}>
              <Text size="xs" fw={600} c="dimmed" px="sm" py="xs" tt="uppercase">{titulo}</Text>
              <Divider mb="xs" />
              {menu.map((item, i) => (
                <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <NavLink
                    label={item.label}
                    leftSection={
                      <ThemeIcon size="sm" variant={pathname === item.href ? 'filled' : 'light'} color="blue" radius="sm">
                        <item.icon size={12} />
                      </ThemeIcon>
                    }
                    active={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    style={{ cursor: 'pointer', borderRadius: 8, marginBottom: 2 }}
                  />
                </motion.div>
              ))}
            </Stack>
          </Box>
          <Box style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--mantine-color-default-hover)' }}>
            {children}
          </Box>
        </>
      )}
    </Box>
  )
}
