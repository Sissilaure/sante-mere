'use client';

import { AppShell } from '../../components/AppShell';
import Link from 'next/link';
import { useState } from 'react';
import { Baby, ScanText, Trash2, ArrowRight } from 'lucide-react';

type StoredQuestion = { text: string; at: string };

function readNum(key: string) {
  try { return Number(localStorage.getItem(key) || '0'); } catch { return 0; }
}
function readList(key: string): StoredQuestion[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as StoredQuestion[]; } catch { return []; }
}
function hasAgentSession() {
  try { return Boolean(localStorage.getItem('keneya_agent_session')); } catch { return false; }
}

export default function AgentDashboardPage() {
  const [ready] = useState(true);
  const [logged] = useState(() => hasAgentSession());
  const [refresh, setRefresh] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  void refresh;
  const kpis = {
    carnetAnalyses: readNum('keneya_kpi_carnet_analyses'),
    bebeQuestions: readNum('keneya_kpi_bebe_questions'),
  };

  const bebe = readList('keneya_questions_bebe');

  if (!ready) {
    return (
      <AppShell title="Dashboard agent" subtitle="Chargement…">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm text-sm text-gray-600">
          Chargement…
        </div>
      </AppShell>
    );
  }

  if (!logged) {
    return (
      <AppShell
        title="Dashboard agent"
        subtitle="Connexion requise (prototype)."
        actions={
          <Link
            href="/agent"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            Se connecter
            <ArrowRight size={16} />
          </Link>
        }
      >
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <div className="font-extrabold">Accès restreint</div>
          <p className="mt-2 leading-7">
            Cet espace est réservé aux agents. Connectez‑vous pour consulter les KPI et les questions.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard agent"
      subtitle="Vue d'ensemble du nourrisson et questions synchronisées depuis le chat PediIA."
      actions={
        <>
          <button
            type="button"
            onClick={() => setRefresh((x) => x + 1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('keneya_kpi_carnet_analyses');
                localStorage.removeItem('keneya_kpi_bebe_questions');
                localStorage.removeItem('keneya_questions_bebe');
              } catch { }
              setRefresh((x) => x + 1);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
          >
            <Trash2 size={16} />
            Réinitialiser stats
          </button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-gray-900">Analyses carnet</div>
            <ScanText size={18} className="text-emerald-700" />
          </div>
          <div className="mt-3 text-4xl font-extrabold text-gray-900">{kpis.carnetAnalyses}</div>
          <div className="mt-1 text-sm text-gray-600">Nombre d'analyses effectuées sur cet appareil.</div>
          <Link
            href="/carnet"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
          >
            Ouvrir carnet
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold text-gray-900">Questions nourrisson</div>
            <Baby size={18} className="text-emerald-700" />
          </div>
          <div className="mt-3 text-4xl font-extrabold text-gray-900">{kpis.bebeQuestions}</div>
          <div className="mt-1 text-sm text-gray-600">Questions envoyées dans le chat nourrisson.</div>
          <Link
            href="/bebe"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-extrabold text-gray-800 hover:bg-gray-50"
          >
            Ouvrir nourrisson
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                <Baby size={20} className="text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Questions Récentes — Nourrisson</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Synchronisées en temps réel depuis le chat PediIA</p>
              </div>
            </div>
            {bebe.length > 0 && (
              <button
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95"
              >
                {showAllQuestions ? '↓ Réduire' : `↑ Voir tous (${bebe.length})`}
              </button>
            )}
          </div>

          {bebe.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <Baby size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Aucune question enregistrée</p>
              <p className="text-xs text-gray-500 mt-1">Les questions posées dans le chat nourrisson apparaîtront ici automatiquement</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${showAllQuestions ? 'md:grid-cols-2' : ''}`}>
              {(showAllQuestions ? bebe : bebe.slice(0, 6)).map((q, idx) => {
                const date = new Date(q.at);
                const now = Date.now();
                const isRecent = now - date.getTime() < 3600000;
                const timeAgo = getTimeAgo(now - date.getTime());

                return (
                  <div
                    key={idx}
                    className="group relative rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 p-4 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
                  >
                    {isRecent && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          NOUVEAU
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                        {date.toLocaleString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">• {timeAgo}</span>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-900 font-medium line-clamp-4">
                      "{q.text}"
                    </p>

                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/50 px-2.5 py-1.5">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Q#{idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {bebe.length > 6 && !showAllQuestions && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllQuestions(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
              >
                Charger toutes les questions ({bebe.length})
              </button>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function getTimeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}m`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}
