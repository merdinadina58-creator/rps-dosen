'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  FileText,
  Database,
  Sparkles,
  GraduationCap,
  Users,
  BookOpen,
  Menu,
  Moon,
  Sun,
  GraduationCap as LogoIcon,
  HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMounted } from '@/hooks/use-mounted'
import { useAppStore, type View } from '@/lib/store'
import { DashboardView } from '@/components/views/dashboard-view'
import { RpsListView } from '@/components/views/rps-list-view'
import { RpsDetailView } from '@/components/views/rps-detail-view'
import { DosenView } from '@/components/views/dosen-view'
import { MataKuliahView } from '@/components/views/mata-kuliah-view'
import { AiAssistantView } from '@/components/views/ai-assistant-view'
import { ProdiView } from '@/components/views/prodi-view'
import { PanduanView } from '@/components/views/panduan-view'

interface NavChild {
  id: View
  label: string
  icon: React.ElementType
}

interface NavItem {
  id: View | 'master-data'
  label: string
  icon: React.ElementType
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rps-list', label: 'Daftar RPS', icon: FileText },
  {
    id: 'master-data',
    label: 'Master Data',
    icon: Database,
    children: [
      { id: 'dosen', label: 'Dosen', icon: Users },
      { id: 'mata-kuliah', label: 'Mata Kuliah', icon: BookOpen },
    ],
  },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'prodi', label: 'Program Studi', icon: GraduationCap },
  { id: 'panduan', label: 'Panduan', icon: HelpCircle },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView } = useAppStore()

  const handleSelect = (v: View) => {
    setView(v)
    onNavigate?.()
  }

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const isChildActive = item.children.some((c) => c.id === view)
          return (
            <div key={item.id}>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <item.icon className="size-3.5" />
                {item.label}
              </div>
              <div className="ml-2 space-y-1 border-l border-border pl-2">
                {item.children.map((c) => {
                  const active = view === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <c.icon className="size-4" />
                      {c.label}
                      {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }
        const active = view === item.id
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id as View)}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
            {item.id === 'ai-assistant' && (
              <Badge className="ml-auto bg-primary/20 text-primary border-0 text-[10px] px-1.5">
                AI
              </Badge>
            )}
            {active && item.id !== 'ai-assistant' && (
              <span className="ml-auto size-1.5 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </nav>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  // Avoid hydration mismatch: next-themes reads theme from localStorage (client-only).
  // Render a stable placeholder until mounted, then swap to the actual toggle.
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <Sun className="size-4" />
      </Button>
    )
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="size-4 hidden dark:block" />
    </Button>
  )
}

export function AppShell() {
  const { view, rpsId } = useAppStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // Defer rendering of the Radix Sheet (mobile menu) until after hydration.
  // Radix generates aria-controls IDs via useId which can mismatch server/client.
  // The Sheet is lg:hidden so it's invisible on desktop anyway — no visual flash.
  const mounted = useMounted()

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Mobile menu — only render after mount to avoid Radix useId hydration mismatch */}
          {mounted && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                      <LogoIcon className="size-5 text-primary-foreground" />
                    </div>
                    <span>RPS Dosen</span>
                  </SheetTitle>
                </SheetHeader>
                <NavList onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <LogoIcon className="size-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-none">RPS Dosen</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Sistem Manajemen Rencana Pembelajaran Semester
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-60 border-r bg-background/80 shrink-0">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-thin p-3">
            <NavList />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={view + (rpsId ?? '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ViewRouter />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background/80 py-4 px-4">
        <p className="text-center text-xs text-muted-foreground">
          © 2024 RPS Dosen Management System. Dibuat untuk dosen perguruan tinggi Indonesia.
        </p>
      </footer>
    </div>
  )
}

function ViewRouter() {
  const { view, rpsId } = useAppStore()

  switch (view) {
    case 'dashboard':
      return <DashboardView />
    case 'rps-list':
      return <RpsListView />
    case 'rps-detail':
      return rpsId ? <RpsDetailView rpsId={rpsId} /> : <RpsListView />
    case 'dosen':
      return <DosenView />
    case 'mata-kuliah':
      return <MataKuliahView />
    case 'ai-assistant':
      return <AiAssistantView />
    case 'prodi':
      return <ProdiView />
    case 'panduan':
      return <PanduanView />
    default:
      return <DashboardView />
  }
}
