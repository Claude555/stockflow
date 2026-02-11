import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard/nav"
import { StoreProvider } from "@/contexts/store-context"
import { AutoLogout } from "@/components/auth/auto-logout"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <StoreProvider>
      <AutoLogout />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </StoreProvider>
  )
}