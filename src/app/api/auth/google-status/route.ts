import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  const isConfigured = !!(clientId && clientSecret && !clientId.startsWith('your-') && clientId.length > 5)

  return NextResponse.json({
    configured: isConfigured,
    clientId: isConfigured ? `${clientId.slice(0, 12)}...apps.googleusercontent.com` : null,
  })
}

export async function POST(req: Request) {
  try {
    const { clientId, clientSecret } = await req.json()

    if (!clientId?.trim() || !clientSecret?.trim()) {
      return NextResponse.json({ error: 'Both Google Client ID and Client Secret are required' }, { status: 400 })
    }

    const cleanClientId = clientId.trim()
    const cleanClientSecret = clientSecret.trim()

    // Update process.env dynamically in runtime
    process.env.GOOGLE_CLIENT_ID = cleanClientId
    process.env.GOOGLE_CLIENT_SECRET = cleanClientSecret

    // Update .env.local on disk so it persists across restarts
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = ''
    try {
      envContent = fs.readFileSync(envPath, 'utf-8')
    } catch {
      envContent = ''
    }

    let updatedContent = envContent

    // Replace or add GOOGLE_CLIENT_ID
    if (updatedContent.match(/#?\s*GOOGLE_CLIENT_ID=.*/)) {
      updatedContent = updatedContent.replace(/#?\s*GOOGLE_CLIENT_ID=.*/, `GOOGLE_CLIENT_ID=${cleanClientId}`)
    } else {
      updatedContent += `\nGOOGLE_CLIENT_ID=${cleanClientId}`
    }

    // Replace or add GOOGLE_CLIENT_SECRET
    if (updatedContent.match(/#?\s*GOOGLE_CLIENT_SECRET=.*/)) {
      updatedContent = updatedContent.replace(/#?\s*GOOGLE_CLIENT_SECRET=.*/, `GOOGLE_CLIENT_SECRET=${cleanClientSecret}`)
    } else {
      updatedContent += `\nGOOGLE_CLIENT_SECRET=${cleanClientSecret}`
    }

    fs.writeFileSync(envPath, updatedContent, 'utf-8')

    return NextResponse.json({
      success: true,
      message: 'Google OAuth credentials saved successfully! You can now authenticate with Google.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save credentials' }, { status: 500 })
  }
}
