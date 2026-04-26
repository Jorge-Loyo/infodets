'use client'

import { Center, Loader } from '@mantine/core'
import { motion } from 'framer-motion'

export function PageLoader() {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Center h="100vh">
        <Loader size="md" />
      </Center>
    </motion.div>
  )
}
