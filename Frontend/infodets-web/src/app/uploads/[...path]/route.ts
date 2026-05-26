import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL ?? process.env.NEXT_PUBLIC_DOCS_URL ?? process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:8000'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const backendPath = `/uploads/${path.join('/')}`
  const res = await fetch(`${BACKEND_URL}${backendPath}`)

  if (!res.ok) {
    return new Response('Not found', { status: 404 })
  }

  const headers = new Headers()
  headers.set('Content-Type', res.headers.get('Content-Type') || 'application/octet-stream')
  headers.set('Cache-Control', 'public, max-age=86400')

  return new Response(res.body, { status: 200, headers })
}
