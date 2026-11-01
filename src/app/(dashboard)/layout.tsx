import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { Providers } from '@/components/providers'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { AgentRunModal } from '@/components/agents/AgentRunModal'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <Providers>
      <div className="flex h-screen bg-background overflow-hidden text-text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header user={session.user} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
            {children}
          </main>
        </div>
        <AgentRunModal />
      </div>
    </Providers>
  )
}
