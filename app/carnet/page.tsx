'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import {
  Upload,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

type VaccineCard = { vaccine: string; date?: string };
type AnalysisResult = {
  upToDate: VaccineCard[];
  upcomingVaccines: VaccineCard[];
  missingUrgent: { vaccine: string }[];
  conseil: string;
  summary?: string;
  ageMonth: number;
};

function bumpMetric(key: string, by = 1) {
  try {
    const v = Number(localStorage.getItem(key) || '0') + by;
    localStorage.setItem(key, String(v));
  } catch { }
}

export default function CarnetPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ageMonth, setAgeMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Veuillez sélectionner une photo.'); return; }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (ageMonth.trim()) formData.append('ageMonth', ageMonth.trim());
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Erreur lors de l’analyse.');
      }
      const data: AnalysisResult = await res.json();
      setResult(data);
      bumpMetric('keneya_kpi_carnet_analyses', 1);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setAgeMonth('');
  };

  return (
    <AppShell
      title="Analyse du carnet (photo → extraction → statut)"
      subtitle="Prenez une photo nette, puis Kénéya produit un bilan clair : à jour / à prévoir / urgent."
      actions={
        <>
          <Link
            href="/accueil"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Sparkles size={16} />
            Retour accueil
          </Link>
          <Link
            href="/agent/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            <ShieldCheck size={16} />
            Voir KPI (agent)
          </Link>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Importer une photo</h2>
              <p className="mt-1 text-sm text-gray-600">JPEG/PNG — photo directe acceptée.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <Camera size={16} />
              Vision + IA
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="relative block h-56 cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50 transition hover:border-emerald-500">
              {preview ? (
                <Image
                  src={preview}
                  alt="Aperçu du carnet"
                  fill
                  className="object-contain p-3"
                  unoptimized
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div>
                    <Upload size={34} className="mx-auto text-emerald-700" aria-hidden="true" />
                    <div className="mt-3 text-base font-extrabold text-gray-900">Choisissez une photo du carnet</div>
                    <div className="mt-1 text-sm text-gray-600">Idéal : page à plat, bonne lumière, sans reflets</div>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm font-extrabold text-gray-700">
                Âge de l’enfant (mois)
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={ageMonth}
                  onChange={(e) => setAgeMonth(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ex : 12"
                />
              </label>

              <button
                type="submit"
                disabled={loading || !file}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Analyse…
                  </>
                ) : (
                  <>
                    Lancer l’analyse
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {file && !result && (
              <button
                type="button"
                onClick={reset}
                className="mx-auto block text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-gray-800"
              >
                Réinitialiser
              </button>
            )}
          </form>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <div className="flex items-center gap-2 font-extrabold">
                <AlertCircle size={18} />
                Erreur
              </div>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">Résultat</h2>
          <p className="mt-1 text-sm text-gray-600">
            Après analyse, tu obtiens un bilan lisible + un conseil d’action.
          </p>

          {!result ? (
            <div className="mt-5 rounded-3xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600">
              <div className="font-extrabold text-gray-900">Astuce démo</div>
              <p className="mt-1 leading-7">
                Tu peux utiliser une photo de carnet réelle, ou générer une image de test côté backend (si tu gardes Flask).
              </p>
              <div className="mt-4">
                <Link
                  href="/bebe"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Voir suivi nourrisson
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
                <div className="font-extrabold">💡 Conseil</div>
                <p className="mt-1 leading-7">{result.conseil}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="text-3xl font-extrabold text-emerald-700">{result.upToDate.length}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">À jour</div>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <div className="text-3xl font-extrabold text-amber-700">{result.upcomingVaccines.length}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-700">À prévoir</div>
                </div>
                <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-center">
                  <div className="text-3xl font-extrabold text-red-700">{result.missingUrgent.length}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-red-700">Urgent</div>
                </div>
              </div>

              <div className="grid gap-4">
                {result.summary && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                  <div className="font-extrabold text-slate-900">Résumé IA</div>
                  <p className="mt-2 leading-7">{result.summary}</p>
                </div>
              )}
              {result.upToDate.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      <CheckCircle size={18} className="text-emerald-700" />
                      Vaccins à jour
                    </div>
                    <div className="space-y-2">
                      {result.upToDate.map((v, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                          <span className="font-semibold text-emerald-950">{v.vaccine}</span>
                          {v.date && <span className="text-emerald-900/70">{v.date}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.upcomingVaccines.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      <Clock size={18} className="text-amber-700" />
                      À prévoir prochainement
                    </div>
                    <div className="space-y-2">
                      {result.upcomingVaccines.map((v, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                          <span className="font-semibold text-amber-950">{v.vaccine}</span>
                          {v.date && <span className="text-amber-900/70">{v.date}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.missingUrgent.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-gray-900">
                      <AlertCircle size={18} className="text-red-700" />
                      Manquants / urgents
                    </div>
                    <div className="space-y-2">
                      {result.missingUrgent.map((v, i) => (
                        <div key={i} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                          {v.vaccine}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={reset}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-800 hover:bg-gray-50"
              >
                Nouvelle analyse
              </button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

