import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email || 'analyst@edocode.in'

  try {
    let user = null
    if (userId && !userId.startsWith('demo-')) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      })
    } else if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
      })
    }

    if (user) {
      return NextResponse.json({ data: user })
    }
  } catch (dbErr) {
    console.warn('[profile-api] DB read error, serving demo profile fallback:', dbErr)
  }

  // Fallback demo profile
  return NextResponse.json({
    data: {
      id: userId || 'demo-analyst-1',
      name: session.user.name || 'Elena Rostova',
      email: userEmail,
      image: session.user.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      username: 'elena_rostova',
      bio: 'Senior Security Analyst & Vector RAG Architect at edocode455. Focus on threat intelligence and automated remediation.',
      role: 'Senior Security Analyst',
      department: 'Cybersecurity & Threat Ops',
      phone: '+1 (555) 019-2834',
      githubUsername: 'edocode455',
      linkedinUrl: 'https://linkedin.com/in/edocode455',
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, username, bio, role, department, phone, githubUsername, linkedinUrl } = body
  const userId = session.user.id
  const userEmail = session.user.email

  try {
    if (userId && !userId.startsWith('demo-')) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(username !== undefined && { username }),
          ...(bio !== undefined && { bio }),
          ...(role !== undefined && { role }),
          ...(department !== undefined && { department }),
          ...(phone !== undefined && { phone }),
          ...(githubUsername !== undefined && { githubUsername }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
        },
      })
      return NextResponse.json({ data: updated })
    } else if (userEmail) {
      const updated = await prisma.user.upsert({
        where: { email: userEmail },
        create: {
          email: userEmail,
          name: name || session.user.name || 'Elena Rostova',
          username,
          bio,
          role,
          department,
          phone,
          githubUsername,
          linkedinUrl,
        },
        update: {
          ...(name && { name }),
          ...(username !== undefined && { username }),
          ...(bio !== undefined && { bio }),
          ...(role !== undefined && { role }),
          ...(department !== undefined && { department }),
          ...(phone !== undefined && { phone }),
          ...(githubUsername !== undefined && { githubUsername }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
        },
      })
      return NextResponse.json({ data: updated })
    }
  } catch (err: any) {
    console.warn('[profile-api] DB update skipped, returning updated body in demo mode:', err?.message)
  }

  return NextResponse.json({
    data: {
      id: userId || 'demo-analyst-1',
      email: userEmail || 'analyst@edocode.in',
      image: session.user.image,
      name: name || session.user.name || 'Elena Rostova',
      username: username || 'elena_rostova',
      bio: bio || 'Senior Security Analyst at edocode455',
      role: role || 'Security Analyst',
      department: department || 'Cybersecurity',
      phone: phone || null,
      githubUsername: githubUsername || 'edocode455',
      linkedinUrl: linkedinUrl || null,
      updatedAt: new Date().toISOString(),
    },
  })
}
