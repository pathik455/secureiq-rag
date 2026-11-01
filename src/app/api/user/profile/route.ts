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
    console.warn('[profile-api] Prisma read failed, attempting Supabase client:', (dbErr as any)?.message)
  }

  // Fallback to Supabase direct query
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
          githubUsername: sbUser.github_username || 'edocode455',
          linkedinUrl: sbUser.linkedin_url || null,
          createdAt: sbUser.createdAt || new Date().toISOString(),
          updatedAt: sbUser.updatedAt || new Date().toISOString(),
        },
      })
    }
  } catch (sbErr) {
    console.warn('[profile-api] Supabase read fallback skipped:', sbErr)
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
