'use client';

import { AppShell } from '../components/AppShell';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ShieldCheck, KeyRound, BarChart3 } from 'lucide-react';

function setAgentSession() {
  try { localStorage.setItem('keneya_agent_session', JSON.stringify({ at: new Date().toISOString() })); } catch { }
}
function hasAgentSession() {
  try { return Boolean(localStorage.getItem('keneya_agent_session')); } catch { return false; }
}

export default function AgentLoginPage() {
  const [ready] = useState(true);
  const [logged, setLogged] = useState(() => hasAgentSession());

  return (
    <AppShell
      title="Espace agent de santé"
      subtitle="Connexion (prototype) pour accéder au dashboard, KPI et aux questions des patientes."
      actions={
        <Link
          href="/agent/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          <BarChart3 size={16} />
          Dashboard
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <ShieldCheck size={14} />
            Accès agent
          </div>
          <h2 className="mt-3 text-xl font-extrabold text-gray-900">Se connecter</h2>
          <p className="mt-1 text-sm text-gray-600">
            Prototype : la “connexion” est locale pour la démo. En production : comptes, rôles, audit, conformité.
          </p>

          {!ready ? (
            <div className="mt-6 text-sm text-gray-500">Chargement…</div>
          ) : logged ? (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              <div className="font-extrabold">Vous êtes déjà connecté(e).</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/agent/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
                >
                  Ouvrir le dashboard
                  <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem('keneya_agent_session'); } catch { }
                    setLogged(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-extrabold text-gray-800 hover:bg-gray-50"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          ) : (
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setAgentSession();
                setLogged(true);
              }}
            >
              <label className="grid gap-2 text-sm font-extrabold text-gray-700">
                Identifiant
                <input
                  required
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
                  placeholder="agent.smi"
                  autoComplete="username"
                />
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-gray-700">
                Code (démo)
                <input
                  required
                  type="password"
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-black"
              >
                <KeyRound size={16} />
                Se connecter (prototype)
              </button>
              <p className="text-xs text-gray-500">
                Pour la démo, tout identifiant/code fonctionne (session locale).
              </p>
            </form>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">Ce que vous verrez</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-extrabold text-gray-900">KPI</div>
              <div className="mt-1 text-sm text-gray-600">Analyses carnet, questions, tendances.</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-extrabold text-gray-900">Questions</div>
              <div className="mt-1 text-sm text-gray-600">Grossesse et nourrisson, horodatées.</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-extrabold text-gray-900">Priorisation</div>
              <div className="mt-1 text-sm text-gray-600">Triage, urgences, conseils standardisés.</div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-extrabold text-gray-900">Pilotage</div>
              <div className="mt-1 text-sm text-gray-600">Qualité des réponses, actions terrain.</div>
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-extrabold">Note</div>
            <p className="mt-1 leading-7">
              Pour commercialiser : auth réelle, stockage sécurisé, conformité, anonymisation, et intégrations SMS/WhatsApp.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

