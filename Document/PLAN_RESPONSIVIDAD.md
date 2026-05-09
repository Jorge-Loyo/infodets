# PLAN DE RESPONSIVIDAD — INFODETS

> **Estado:** Pendiente  
> **Objetivo:** Hacer la aplicación completamente responsive para mobile, tablet y desktop  
> **Breakpoints Mantine:** xs=36em, sm=48em, md=62em, lg=75em, xl=88em

---

## PRIORIDAD 1 — Layout base (afecta toda la app)

### 1.1 Header
- [ ] El burger menu ya existe pero no colapsa el sidebar en mobile
- [ ] En mobile: ocultar nombre de usuario y rol, mostrar solo avatar
- [ ] En mobile: reducir padding y gap de los iconos de notificaciones
- [ ] Logo/nombre debe escalar correctamente

### 1.2 Sidebar
- [ ] En mobile: el sidebar debe estar oculto por defecto y abrirse como drawer (overlay)
- [ ] En tablet (md): sidebar colapsado mostrando solo iconos
- [ ] En desktop: sidebar completo con labels
- [ ] Usar `Drawer` de Mantine para mobile en vez de Box fijo

### 1.3 Footer
- [ ] En mobile: apilar las 3 zonas en columna
- [ ] Ocultar links del centro en xs
- [ ] Reducir padding

---

## PRIORIDAD 2 — Páginas principales

### 2.1 `/consulta` — ChatBot
- [ ] En mobile: ocultar `HistorialPanel` (panel derecho de conversaciones)
- [ ] Agregar botón para mostrar/ocultar historial en mobile
- [ ] El área de input debe ocupar el ancho completo
- [ ] Los mensajes deben tener `maxWidth: 90%` en mobile

### 2.2 `/dashboard` — Panel administrativo
- [ ] El submenú lateral del dashboard debe colapsar en mobile
- [ ] Las cards deben pasar de 3 columnas → 2 → 1 (ya usa Grid de Mantine, revisar spans)
- [ ] Mismo ajuste para `/configuracion` y `/configuracion-chat`

### 2.3 `/noticias`
- [ ] Grid de noticias: 3 col → 2 col → 1 col
- [ ] Cards de noticias: ajustar imagen y texto

### 2.4 `/documentacion`
- [ ] Formulario de carga y tabla: apilar en mobile (ya usa Grid, revisar spans)
- [ ] Tabla de documentos: scroll horizontal en mobile

### 2.5 `/mis-consultas`
- [ ] Lista de conversaciones: ancho completo en mobile

---

## PRIORIDAD 3 — Dashboard interno

### 3.1 Layouts con submenú lateral
- [ ] `/dashboard/layout.tsx` — submenú de 260px debe colapsar en mobile
- [ ] `/configuracion/layout.tsx` — mismo ajuste
- [ ] `/configuracion-chat/layout.tsx` — mismo ajuste
- [ ] Solución: en mobile mostrar un `Select` o `Tabs` en vez del submenú lateral

### 3.2 `/dashboard/usuarios`
- [ ] Tabla de usuarios: scroll horizontal o cards en mobile
- [ ] Modal de crear/editar: formulario en columna única en mobile

### 3.3 `/dashboard/derechos`
- [ ] Cards de perfiles: 3 col → 2 col → 1 col (ya usa Grid)
- [ ] Modal de permisos: scroll en mobile

### 3.4 `/dashboard/temas`
- [ ] Sección Logo: apilar las 3 columnas en mobile
- [ ] Cards de temas: scroll horizontal o wrap
- [ ] SimpleGrid de colores: 1 col en mobile

### 3.5 `/dashboard/notificaciones` y `/configuracion-chat/notificaciones`
- [ ] Tickets: ancho completo, reducir padding
- [ ] Hilo de mensajes: altura reducida en mobile

---

## PRIORIDAD 4 — Páginas de configuración

### 4.1 `/configuracion/perfil`
- [ ] Formulario: columna única en mobile (ya usa Grid, revisar spans)
- [ ] Tarjeta de identidad: ancho completo en mobile

### 4.2 `/configuracion/soporte`
- [ ] Cards de canales: 3 col → 1 col
- [ ] Grid de horarios y prioridades: apilar en mobile

---

## ESTRATEGIA TÉCNICA

### Breakpoints a usar
```
base  → mobile  (< 48em)
sm    → tablet  (≥ 48em)
md    → desktop (≥ 62em)
```

### Patrón para submenús laterales en mobile
```tsx
// En mobile: Tabs en vez de submenú lateral
// En desktop: submenú lateral fijo
const isMobile = useMediaQuery('(max-width: 62em)')

{isMobile ? (
  <Tabs value={pathname} onChange={router.push}>
    {MENU.map(item => <Tabs.Tab value={item.href}>{item.label}</Tabs.Tab>)}
  </Tabs>
) : (
  <Box style={{ width: 260, ... }}>
    {/* submenú lateral */}
  </Box>
)}
```

### Patrón para Sidebar en mobile
```tsx
// Usar Drawer de Mantine
<Drawer opened={sidebarAbierto} onClose={closeSidebar} size={240} padding={0}>
  <SidebarContent />
</Drawer>
```

---

## ORDEN DE EJECUCIÓN

| Paso | Componente | Impacto |
|------|-----------|---------|
| 1 | Sidebar → Drawer en mobile | Alto — afecta toda la app |
| 2 | Header → ajustes mobile | Alto — afecta toda la app |
| 3 | Footer → apilar en mobile | Bajo |
| 4 | Layouts con submenú → Tabs en mobile | Alto — dashboard, config |
| 5 | `/consulta` → ocultar historial en mobile | Alto |
| 6 | Páginas de contenido → revisar Grid spans | Medio |
| 7 | Tablas → scroll horizontal en mobile | Medio |
| 8 | Modales → columna única en mobile | Bajo |

---

*INFODETS — Plan de Responsividad v1.0*
