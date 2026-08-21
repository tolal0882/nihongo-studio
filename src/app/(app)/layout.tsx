import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')
  if (!session.user.onboardingComplete) redirect('/onboarding')

  return <AppShell user={session.user}>{children}</AppShell>
}
