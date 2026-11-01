import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { supabaseAdmin } from '@/lib/db/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email || ''

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
    console.warn('[profile-api] Prisma read failed, attempting Supabase client:', (dbErr as any)?.message)
  }

  // Fallback to Supabase direct query
  if (userEmail) {
    try {
      const { data: sbUser } = await supabaseAdmin
        .from('User')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle()

      if (sbUser) {
        return NextResponse.json({
          data: {
            id: sbUser.id,
            name: sbUser.name || session.user.name,
            email: sbUser.email,
            image: sbUser.image || session.user.image,
            username: sbUser.username || userEmail.split('@')[0],
            bio: sbUser.bio || 'Security Analyst & Threat Intelligence Operator',
            role: sbUser.role || 'Security Analyst',
            department: sbUser.department || 'Cybersecurity',
            phone: sbUser.phone || null,
            githubUsername: sbUser.github_username || null,
            linkedinUrl: sbUser.linkedin_url || null,
            createdAt: sbUser.createdAt || new Date().toISOString(),
            updatedAt: sbUser.updatedAt || new Date().toISOString(),
          },
        })
      }
    } catch (sbErr) {
      console.warn('[profile-api] Supabase read fallback skipped:', sbErr)
    }
  }

  // Fallback profile based on session
  return NextResponse.json({
    data: {
      id: userId || 'analyst-1',
      name: session.user.name || 'Security Analyst',
      email: userEmail,
      image: session.user.image || null,
      username: userEmail ? userEmail.split('@')[0] : 'analyst',
      bio: 'Security Analyst & Threat Intelligence Operator',
      role: 'Security Analyst',
      department: 'Cybersecurity',
      phone: null,
      githubUsername: null,
      linkedinUrl: null,
      createdAt: new Date().toISOString(),
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

  let updatedUser = null

  // 1. Try Prisma
  try {
    if (userId && !userId.startsWith('demo-')) {
      updatedUser = await prisma.user.update({
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
    } else if (userEmail) {
      updatedUser = await prisma.user.upsert({
        where: { email: userEmail },
        create: {
          email: userEmail,
          name: name || session.user.name || 'Security Analyst',
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
    }
  } catch (err: any) {
    console.warn('[profile-api] Prisma update skipped, attempting Supabase sync:', err?.message)
  }

  // 2. Fallback to Supabase direct update
  if (userEmail) {
    try {
      const { data: sbUpdated } = await supabaseAdmin
        .from('User')
        .upsert(
          {
            email: userEmail,
            name: name || session.user.name || 'Security Analyst',
            username,
            bio,
            role,
            department,
            phone,
            github_username: githubUsername,
            linkedin_url: linkedinUrl,
            updatedAt: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle()

      if (sbUpdated) {
        updatedUser = {
          ...sbUpdated,
          githubUsername: sbUpdated.github_username,
          linkedinUrl: sbUpdated.linkedin_url,
        }
      }
    } catch (sbErr) {
      console.warn('[profile-api] Supabase direct update skipped:', sbErr)
    }
  }

  if (updatedUser) {
    return NextResponse.json({ data: updatedUser })
  }

  return NextResponse.json({
    data: {
      id: userId || 'analyst-1',
      email: userEmail || '',
      image: session.user.image,
      name: name || session.user.name || 'Security Analyst',
      username: username || (userEmail ? userEmail.split('@')[0] : 'analyst'),
      bio: bio || '',
      role: role || 'Security Analyst',
      department: department || 'Cybersecurity',
      phone: phone || null,
      githubUsername: githubUsername || null,
      linkedinUrl: linkedinUrl || null,
      updatedAt: new Date().toISOString(),
    },
  })
}
