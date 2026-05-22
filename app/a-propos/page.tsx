import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { GitBranch, Code2, Shield, Users, Target, Zap } from 'lucide-react';

export default function AProposPage() {
  return (
    <AppShell
      title="À propos de Kénéya"
      subtitle="Plateforme numérique pour la continuité des soins mère-enfant en contexte de ressources limitées."
      actions={
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Nous contacter
          <Zap size={16} />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-extrabold text-gray-900">Mission & Contexte</h2>
          <p className="mt-3 text-sm leading-7 text-gray-700">
            Kénéya adresse un problème structurel : la mortalité maternelle et infantile persiste largement en raison 
            de défaillances logistiques — données dispersées, carnets perdus, ruptures de continuité de soins, 
            retards de diagnostic. Notre approche repose sur une numérisation progressive du suivi (carnet → données) 
            et des rappels intelligents, sans complexité technologique côté utilisateur final.
          </p>

          <h3 className="mt-8 text-sm font-extrabold uppercase tracking-wider text-gray-500">Architecture & Principes</h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            <li className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <Code2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Vision & OCR</div>
                  <div className="mt-1 text-sm text-gray-600">Extraction structurée des données du carnet papier via analyse d&apos;image. Point d&apos;entrée non-intrusif.</div>
                </div>
              </div>
            </li>
            <li className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <GitBranch size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Interopérabilité</div>
                  <div className="mt-1 text-sm text-gray-600">Données structurées, intégration avec systèmes existants (SMS, WhatsApp, registres locaux).</div>
                </div>
              </div>
            </li>
            <li className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <Shield size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Prudence Médicale</div>
                  <div className="mt-1 text-sm text-gray-600">Jamais de diagnostic. Décisions concrètes (quand vacciner) + redirection immédiate en urgence.</div>
                </div>
              </div>
            </li>
            <li className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-2">
                <Users size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Designed for Field</div>
                  <div className="mt-1 text-sm text-gray-600">Fonctionne hors ligne. Interface simple. Pas de dépendance logicielle lourde.</div>
                </div>
              </div>
            </li>
          </ul>
          <h3 className="mt-8 text-sm font-extrabold uppercase tracking-wider text-gray-500">Composantes Actuelles</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="font-semibold text-emerald-900">Carnet OCR</div>
              <p className="mt-1 text-sm text-emerald-800/80">Photographie & analyse du carnet de santé → extraction vaccins, dates, dépistages.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="font-semibold text-emerald-900">Chat Spécialisé (Bébé)</div>
              <p className="mt-1 text-sm text-emerald-800/80">Questions structurées sur santé nourrisson, alimentation, signes d&apos;alerte. Réponses guidées.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="font-semibold text-emerald-900">Dashboard Agent</div>
              <p className="mt-1 text-sm text-emerald-800/80">Agrégation de KPI, questions récurrentes, détection de tendances pour agents de santé locaux.</p>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-extrabold mb-3">
              <Target size={18} />
              Principes de Conception
            </div>
            <ul className="space-y-3 leading-7">
              <li><strong>Clarté :</strong> langage accessible, actions concrètes documentées.</li>
              <li><strong>Sécurité :</strong> pas de diagnostic, urgences immédiatement signalées.</li>
              <li><strong>Faible friction :</strong> fonctionne avec photo ; pas de compte obligatoire.</li>
              <li><strong>Évolutif :</strong> architecture modulaire pour add-ons (SMS, epidemio, analytics).</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-900">
            <div className="flex items-center gap-2 font-extrabold mb-3">
              <Code2 size={18} />
              Stack Technique
            </div>
            <ul className="space-y-2 text-xs font-medium">
              <li><strong>Frontend :</strong> Next.js, React, Tailwind CSS</li>
              <li><strong>API :</strong> OpenRouter (LLM), Vision APIs</li>
              <li><strong>Persistence :</strong> LocalStorage, future cloud sync</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-extrabold mb-2">
              ⚠️
              Responsabilité
            </div>
            <p className="text-xs leading-relaxed">
              Kénéya est un outil de soutien, pas un substitut au jugement clinique. En urgence : direction immédiate vers centre de santé agréé.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}




