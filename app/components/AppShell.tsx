'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ScanText,
  HeartPulse,
  Baby,
  Info,
  Mail,
  BarChart3,
  Shield,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> };

const PRIMARY: NavItem[] = [
  { href: '/accueil', label: 'Accueil', icon: Home },
  { href: '/carnet', label: 'Carnet (OCR)', icon: ScanText },
  { href: '/bebe', label: 'Suivi & Vaccins', icon: Baby },
];

const SECONDARY: NavItem[] = [
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

const AGENT: NavItem[] = [
  { href: '/agent', label: 'Espace agent', icon: Shield },
  { href: '/agent/dashboard', label: 'Dashboard', icon: BarChart3 },
];

function NavLink({ href, label, icon: Icon, onClick }: NavItem & { onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/accueil' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
        active
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'} />
      <span className="truncate">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-white"
        />
      )}
    </Link>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/accueil" className="flex items-center gap-3 group">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition-transform group-hover:scale-105">
              <span className="text-xl font-black">K</span>
            </div>
            <div className="hidden sm:block leading-none">
              <div className="text-lg font-black tracking-tighter text-gray-900">Kénéya</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Santé Infantile</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 mr-4">
              <Link href="/carnet" className="btn-secondary py-2 text-xs">
                <ScanText size={14} />
                Analyser carnet
              </Link>
              <Link href="/agent" className="btn-premium py-2 text-xs bg-gray-900 hover:bg-black">
                <Shield size={14} />
                Agent
              </Link>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-gray-100 text-gray-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[280px_1fr] sm:px-6">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <div className="glass rounded-[2rem] p-4 border border-white/40 shadow-sm">
              <div className="px-3 mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                Menu Principal
              </div>
              <nav className="space-y-1">
                {PRIMARY.map((i) => <NavLink key={i.href} {...i} />)}
              </nav>

              <div className="px-3 mt-8 mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <div className="h-1 w-1 rounded-full bg-pink-400" />
                Assistance
              </div>
              <nav className="space-y-1">
                {SECONDARY.map((i) => <NavLink key={i.href} {...i} />)}
              </nav>
            </div>

            <div className="relative overflow-hidden glass rounded-[2rem] p-6 border-emerald-100/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 group">
              <Sparkles className="absolute -right-2 -top-2 text-emerald-200 opacity-50 group-hover:scale-125 transition-transform" size={64} />
              <h4 className="text-sm font-black text-emerald-900 mb-2">Conseil Expert</h4>
              <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                &ldquo;L&apos;allaitement maternel exclusif jusqu&apos;à 6 mois protège le nourrisson contre les infections.&rdquo;
              </p>
              <Link href="/bebe" className="mt-4 inline-flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:gap-2 transition-all">
                En savoir plus →
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl p-6 pt-24"
            >
              <div className="space-y-8">
                <nav className="grid gap-2">
                  {PRIMARY.map((i) => (
                    <NavLink key={i.href} {...i} onClick={() => setMobileMenuOpen(false)} />
                  ))}
                </nav>
                <div className="h-px bg-gray-100" />
                <nav className="grid gap-2">
                  {AGENT.map((i) => (
                    <NavLink key={i.href} {...i} onClick={() => setMobileMenuOpen(false)} />
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {(title || subtitle || actions) && (
              <div className="mb-8 flex flex-col gap-4 glass rounded-[2.5rem] p-8 border-white/50 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {title && (
                    <h1 className="text-3xl font-black tracking-tighter text-gray-900 sm:text-4xl">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-2 text-sm font-medium text-gray-500 max-w-xl">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex flex-wrap items-center gap-3">
                    {actions}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-8">
              {children}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 glass border-t border-white/20 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">K</div>
                <span className="text-xl font-black">Kénéya</span>
              </div>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Expertise AI au service du nourrisson. Transformons ensemble le futur de la santé infantile.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h5 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Plateforme</h5>
                <ul className="space-y-2 text-sm font-medium text-gray-500">
                  <li><Link href="/accueil" className="hover:text-emerald-600">Accueil</Link></li>
                  <li><Link href="/carnet" className="hover:text-emerald-600">Carnet</Link></li>
                  <li><Link href="/bebe" className="hover:text-emerald-600">Suivi & Vaccins</Link></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Légal</h5>
                <ul className="space-y-2 text-sm font-medium text-gray-500">
                  <li><Link href="/a-propos" className="hover:text-emerald-600">À propos</Link></li>
                  <li><Link href="/contact" className="hover:text-emerald-600">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div className="glass rounded-3xl p-6 border-amber-100 bg-amber-50/30">
              <h5 className="text-sm font-black text-amber-900 mb-2">Sécurité & Santé</h5>
              <p className="text-xs font-medium text-amber-800/80 leading-relaxed">
                ⚠️ Information générale uniquement. En cas d&apos;urgence, contactez immédiatement le centre de santé le plus proche.
              </p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            © {new Date().getFullYear()} Kénéya
          </div>
        </div>
      </footer>
    </div>
  );
}

