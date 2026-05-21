'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { motion } from 'framer-motion';
import { Keneya3D } from '../components/Keneya3D';
import {
  Sparkles,
  Activity,
  Clock,
  Brain,
  TrendingUp,
} from 'lucide-react';
import type { HealthAnalysisResponse } from '../api/health-analysis/route';

type HealthData = {
  tempLevel: 'normal' | 'high' | 'low';
  alert: boolean;
  heartRate?: number;
  hydration?: string;
  nutrition?: string;
  riskLevel?: 'Vert' | 'Orange' | 'Rouge';
  symptomSeverity?: 'Faible' | 'Modéré' | 'Élevé';
};

type HeartbeatAnalysisResponse = {
  heart_rate: number;
  status: string;
  risk: string;
  confidence: number;
  model_prediction: string;
  recommendation: string;
};

type PatientForm = {
  temperature: string;
  poids: string;
  taille: string;
  hydration: string;
  alimentation: string;
  ageMonths: string;
  symptoms: string;
  notes: string;
};

const DEFAULT_FORM: PatientForm = {
  temperature: '36.8',
  poids: '5.6',
  taille: '58',
  hydration: 'Bonne (6+ couches mouillées/jour)',
  alimentation: 'Allaitement maternel exclusif',
  ageMonths: '3',
  symptoms: 'Bébé sourit, aucun symptôme anormal détecté.',
  notes: 'Sommeil paisible, pas de régurgitations importantes, vaccins à jour.',
};

const STATS = [
  { label: 'Bien-être Bébé', value: '—', icon: Activity, color: 'text-emerald-500', trend: '—' },
  { label: 'Indicateur Croissance', value: '—', icon: Brain, color: 'text-blue-500', trend: '—' },
  { label: 'Score Alimentation', value: '—', icon: Sparkles, color: 'text-amber-500', trend: '—' },
];

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<HealthAnalysisResponse | null>(null);
  const [form, setForm] = useState<PatientForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimulationAlert, setShowSimulationAlert] = useState(false);
  const [heartbeatAnalysis, setHeartbeatAnalysis] = useState<HeartbeatAnalysisResponse | null>(null);
  const [heartbeatLoading, setHeartbeatLoading] = useState(false);
  const [heartbeatError, setHeartbeatError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const liveHealthData = useMemo<HealthData>(() => {
    const tempVal = Number(form.temperature);
    const hasFever = tempVal >= 38.0;
    const isHypothermia = tempVal < 35.5;
    const tempLevel = hasFever ? 'high' : isHypothermia ? 'low' : 'normal';

    const symptomSeverity = /diarrhée|vomissement|fièvre|respiration rapide|convulsion/i.test(form.symptoms)
      ? 'Élevé'
      : /toux|rhume|colique|pleurs inhabituels/i.test(form.symptoms)
      ? 'Modéré'
      : 'Faible';

    let heartRate = 120; // Rythme cardiaque bébé standard
    if (hasFever) heartRate += 15;
    if (isHypothermia) heartRate -= 15;
    if (/respiration rapide|palpitations|pleurs/i.test(form.symptoms)) heartRate += 10;

    const feedingStatus = /exclusif|sein|bon|excellent/i.test(form.alimentation)
      ? 'Excellent'
      : /mixte|diversifié/i.test(form.alimentation)
      ? 'Bon'
      : 'À améliorer';

    const ageMonthsVal = Number(form.ageMonths);
    const isVeryYoungFever = ageMonthsVal <= 3 && hasFever;

    const riskLevel = isVeryYoungFever || tempVal >= 39.0 || symptomSeverity === 'Élevé'
      ? 'Rouge'
      : hasFever || isHypothermia || feedingStatus === 'À améliorer'
      ? 'Orange'
      : 'Vert';

    return {
      tempLevel,
      alert: riskLevel !== 'Vert',
      heartRate,
      hydration: form.hydration,
      nutrition: form.alimentation,
      riskLevel,
      symptomSeverity,
    };
  }, [form]);

  const displayedHealthData = useMemo<HealthData>(() => {
    const base = analysis
      ? ({
          ...liveHealthData,
          tempLevel: analysis.indicators.tension === 'élevée' ? 'high' : 'normal',
          alert: analysis.riskLevel !== 'Vert',
          heartRate: analysis.heartRate ?? liveHealthData.heartRate,
          riskLevel: analysis.riskLevel,
          symptomSeverity: analysis.indicators.stress === 'Élevé' ? 'Élevé' : analysis.indicators.stress === 'Modéré' ? 'Modéré' : 'Faible',
        } as HealthData)
      : liveHealthData;

    return {
      ...base,
      alert: showSimulationAlert ? true : base.alert,
    };
  }, [analysis, liveHealthData, showSimulationAlert]);

  const buildPayload = () => ({
    history: [{ role: 'user', text: form.symptoms }],
    journal: [
      {
        date: new Date().toISOString().slice(0, 10),
        symptom: form.symptoms,
        note: form.notes,
      },
    ],
    carnetData: {
      temperature: Number(form.temperature),
      poids: Number(form.poids),
      taille: Number(form.taille),
      hydration: form.hydration,
      alimentation: form.alimentation,
      ageMonths: Number(form.ageMonths),
      notes: form.notes,
    },
  });

  const loadAnalysis = async (body: ReturnType<typeof buildPayload>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/health-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok || !payload.report) {
        throw new Error(payload.error || 'Impossible de charger l’analyse.');
      }

      setAnalysis(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHeartbeat = async (audioBlob: Blob) => {
    setHeartbeatLoading(true);
    setHeartbeatError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'heartbeat.wav');

      const response = await fetch('/api/heartbeat-analysis', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'analyse des battements.');
      }

      setHeartbeatAnalysis(result);

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Rythme cardiaque de bébé détecté : ${result.heart_rate} battements par minute. ${result.status}. ${result.recommendation}`
        );
        utterance.lang = 'fr-FR';
        speechSynthesis.speak(utterance);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setHeartbeatError(message);
      setHeartbeatAnalysis(null);
    } finally {
      setHeartbeatLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        analyzeHeartbeat(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setIsRecording(true);
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 10000);
    } catch (err) {
      setHeartbeatError('Erreur d\'accès au microphone.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await loadAnalysis(buildPayload());
  };

  const dynamicStats = analysis
    ? [
        {
          label: 'Bien-être Bébé',
          value: analysis.riskLevel === 'Vert' ? '95%' : analysis.riskLevel === 'Orange' ? '78%' : '55%',
          icon: Activity,
          color: analysis.riskLevel === 'Vert' ? 'text-emerald-500' : analysis.riskLevel === 'Orange' ? 'text-amber-500' : 'text-red-500',
          trend: analysis.riskLevel === 'Vert' ? '+3%' : analysis.riskLevel === 'Orange' ? '-3%' : '-15%',
        },
        {
          label: 'Indicateur Croissance',
          value: analysis.indicators.stress === 'Élevé' ? 'À surveiller' : analysis.indicators.stress === 'Modéré' ? 'Moyen' : 'Excellent',
          icon: Brain,
          color: analysis.indicators.stress === 'Élevé' ? 'text-red-500' : analysis.indicators.stress === 'Modéré' ? 'text-amber-500' : 'text-emerald-500',
          trend: analysis.indicators.stress === 'Élevé' ? '-5%' : '+2%',
        },
        {
          label: 'Alimentation & Hydratation',
          value: analysis.indicators.nutrition,
          icon: Sparkles,
          color: analysis.indicators.nutrition === 'À améliorer' ? 'text-red-500' : analysis.indicators.nutrition === 'Bon' ? 'text-amber-500' : 'text-emerald-500',
          trend: analysis.indicators.nutrition === 'À améliorer' ? '-4%' : '+3%',
        },
      ]
    : STATS;

  const summaryText = analysis?.summary ?? 'Saisissez les données pédiatriques de bébé et lancez l’analyse.';
  const modelLabel = analysis ? `Source : ${analysis.modelUsed}` : 'Analyse disponible après validation.';

  return (
    <AppShell title="Dashboard Nourrisson" subtitle="Visualisez les constantes physiologiques et la courbe de croissance de bébé en temps réel.">
      <div className="grid gap-8 lg:grid-cols-[1.8fr_1.2fr]">
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {dynamicStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-[2rem] border-white/50"
              >
                <div className={`h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</div>
                <div className="text-xl font-black text-gray-900">{s.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={12} className={s.trend.startsWith('+') ? 'text-emerald-500' : 'text-blue-500'} />
                  <span className="text-[10px] font-bold text-gray-400">{s.trend}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <Keneya3D data={{
              tension: displayedHealthData.tempLevel === 'high' ? 'high' : 'normal',
              alert: displayedHealthData.alert,
              heartRate: displayedHealthData.heartRate,
              riskLevel: displayedHealthData.riskLevel,
              symptomSeverity: displayedHealthData.symptomSeverity,
            }} />
            <div className="absolute top-6 right-6 flex gap-3">
              <button
                onClick={() => setShowSimulationAlert((prev) => !prev)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  displayedHealthData.alert ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/50 text-gray-600 backdrop-blur-md border border-white/50 hover:bg-white'
                }`}
              >
                {showSimulationAlert ? 'Désactiver alerte' : 'Simuler alerte'}
              </button>
            </div>
          </motion.div>

          <div className="glass rounded-[2.5rem] p-8 border-white/50 bg-white/30">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Clock size={20} className="text-emerald-600" />
                  Journal d&apos;Analyse Pédiatrique IA
                </h3>
                <p className="text-sm text-gray-500 mt-2">{summaryText}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{modelLabel}</span>
                <button
                  onClick={() => loadAnalysis(buildPayload())}
                  className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                >
                  {loading ? 'Actualisation...' : 'Rafraîchir'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 shadow-sm">
                Erreur : {error}
              </div>
            )}

            <div className="space-y-6">
              {analysis ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[2rem] bg-slate-50 p-5 border border-slate-200 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-2">Risque pédiatrique</div>
                      <div className={`text-3xl font-black ${analysis.riskLevel === 'Vert' ? 'text-emerald-600' : analysis.riskLevel === 'Orange' ? 'text-amber-500' : 'text-red-500'}`}>
                        {analysis.riskLevel}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">Analyse basée sur la température, la croissance et les symptômes de bébé.</p>
                    </div>
                    <div className="rounded-[2rem] bg-slate-50 p-5 border border-slate-200 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-2">Synthèse clinique</div>
                      <p className="text-sm leading-6 text-slate-700">{analysis.summary}</p>
                    </div>
                    <div className="rounded-[2rem] bg-slate-50 p-5 border border-slate-200 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-2">Indicateurs clés</div>
                      <ul className="space-y-3 text-sm text-slate-700">
                        <li>
                          <span className="font-black">Fièvre :</span> {analysis.indicators.tension === 'élevée' ? 'Oui (température élevée)' : 'Non (température normale)'}
                        </li>
                        <li>
                          <span className="font-black">Croissance :</span> {analysis.indicators.stress === 'Élevé' ? 'À surveiller' : 'Normale'}
                        </li>
                        <li>
                          <span className="font-black">Nutrition :</span> {analysis.indicators.nutrition}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[2rem] bg-white/95 p-6 border border-slate-200 shadow-xl">
                      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h4 className="text-lg font-black text-slate-900">Rapport pédiatrique détaillé</h4>
                          <p className="text-sm text-slate-500">Un compte-rendu clair et structuré pour votre pédiatre ou médecin.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.35em] text-slate-600">
                          {analysis.modelUsed}
                        </span>
                      </div>
                      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 text-sm text-slate-700 leading-7">
                        {analysis.report.split('\n').map((line, index) => (
                          <p key={index} className={line.startsWith('###') ? 'mt-4 font-black text-slate-900' : line.startsWith('- ') ? 'ml-4 text-sm text-slate-700' : 'text-sm text-slate-700'}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-[2rem] bg-slate-50 p-5 border border-slate-200 shadow-sm">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-3">Recommandations</div>
                        <ul className="space-y-3 text-sm text-slate-700">
                          {analysis.recommendations.length > 0 ? (
                            analysis.recommendations.map((item, index) => (
                              <li key={index} className="rounded-2xl bg-white p-3 border border-slate-200">{item}</li>
                            ))
                          ) : (
                            <li className="text-slate-500">Aucune recommandation spécifique fournie.</li>
                          )}
                        </ul>
                      </div>
                      <div className="rounded-[2rem] bg-slate-50 p-5 border border-slate-200 shadow-sm">
                        <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-3">Questions pour le pédiatre</div>
                        <ul className="space-y-3 text-sm text-slate-700">
                          {analysis.nextQuestions.length > 0 ? (
                            analysis.nextQuestions.map((item, index) => (
                              <li key={index} className="rounded-2xl bg-white p-3 border border-slate-200">{item}</li>
                            ))
                          ) : (
                            <li className="text-slate-500">Aucune question particulière détectée.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[2rem] bg-slate-50 p-6 text-sm text-slate-600 ring-1 ring-slate-200/80 shadow-sm">
                  Aucune analyse disponible. Veuillez valider le formulaire à droite pour lancer l&apos;intelligence artificielle.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-[2.5rem] p-8 border-white/50 bg-white/90 shadow-xl">
            <h3 className="text-xl font-black mb-4">Données du nourrisson</h3>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.8rem] bg-emerald-50 p-4 text-sm text-emerald-900 border border-emerald-100 shadow-sm">
                <div className="text-[9px] uppercase tracking-[0.35em] text-emerald-700/70">Rythme Cardique</div>
                <div className="mt-3 text-2xl font-black">{displayedHealthData.heartRate ?? 120} bpm</div>
                <div className="mt-2 text-[11px] text-emerald-700">Normal : 100-140</div>
              </div>
              <div className="rounded-[1.8rem] bg-amber-50 p-4 text-sm text-amber-900 border border-amber-100 shadow-sm">
                <div className="text-[9px] uppercase tracking-[0.35em] text-amber-700/70">Risque</div>
                <div className="mt-3 text-2xl font-black">{displayedHealthData.riskLevel ?? 'Vert'}</div>
                <div className="mt-2 text-[11px] text-amber-700">Vigilance clinique</div>
              </div>
              <div className="rounded-[1.8rem] bg-slate-100 p-4 text-sm text-slate-900 border border-slate-200 shadow-sm">
                <div className="text-[9px] uppercase tracking-[0.35em] text-slate-500">Symptômes</div>
                <div className="mt-3 text-2xl font-black">{displayedHealthData.symptomSeverity ?? 'Faible'}</div>
                <div className="mt-2 text-[11px] text-slate-500">Niveau de gravité</div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700">
                  Température corporelle (°C)
                  <input
                    value={form.temperature}
                    onChange={(e) => setForm((prev) => ({ ...prev, temperature: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="ex. 36.8"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700">
                  Poids actuel (kg)
                  <input
                    type="number"
                    value={form.poids}
                    step="0.01"
                    onChange={(e) => setForm((prev) => ({ ...prev, poids: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="ex. 5.6"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700">
                  Hydratation (couches/jour)
                  <select
                    value={form.hydration}
                    onChange={(e) => setForm((prev) => ({ ...prev, hydration: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                  >
                    <option>Bonne (6+ couches mouillées/jour)</option>
                    <option>Moyenne (4-5 couches mouillées/jour)</option>
                    <option>Faible (moins de 3 couches mouillées/jour) ⚠️</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-gray-700">
                  Alimentation
                  <input
                    value={form.alimentation}
                    onChange={(e) => setForm((prev) => ({ ...prev, alimentation: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="Ex. allaitement exclusif"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-gray-700">
                  Âge du nourrisson (mois)
                  <input
                    type="number"
                    value={form.ageMonths}
                    onChange={(e) => setForm((prev) => ({ ...prev, ageMonths: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="3"
                  />
                </label>
                <label className="space-y-2 text-sm text-gray-700">
                  Taille actuelle (cm)
                  <input
                    type="number"
                    value={form.taille}
                    onChange={(e) => setForm((prev) => ({ ...prev, taille: e.target.value }))}
                    className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                    placeholder="58"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm text-gray-700">
                Symptômes observés
                <input
                  value={form.symptoms}
                  onChange={(e) => setForm((prev) => ({ ...prev, symptoms: e.target.value }))}
                  className="w-full rounded-3xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Ex. aucune anomalie, coliques, toux"
                />
              </label>

              <label className="space-y-2 text-sm text-gray-700">
                Notes et observations complémentaires
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full min-h-[100px] rounded-[2rem] border border-gray-200 px-4 py-4 text-sm shadow-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Détaillez le sommeil, le comportement général, les selles ou traitements reçus."
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Analyse en cours…' : 'Analyser les données'}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-[2.5rem] p-8 border-white/50 bg-white/90 shadow-xl">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Activity size={24} className="text-red-500" />
              Analyse des Battements Cardiaques
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enregistrez le rythme cardiaque de votre nourrisson pour une analyse IA pédiatrique automatique.
              </p>

              <button
                onClick={startRecording}
                disabled={isRecording || heartbeatLoading}
                className={`w-full rounded-3xl px-6 py-3 text-sm font-black uppercase tracking-[0.2em] shadow-lg transition ${
                  isRecording
                    ? 'bg-red-600 text-white shadow-red-600/20 animate-pulse'
                    : heartbeatLoading
                    ? 'bg-gray-600 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-500'
                }`}
              >
                {isRecording ? 'Enregistrement en cours... (10s)' : heartbeatLoading ? 'Analyse en cours...' : 'Démarrer l\'enregistrement'}
              </button>

              {heartbeatError && (
                <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  Erreur : {heartbeatError}
                </div>
              )}

              {heartbeatAnalysis && (
                <div className="rounded-[2rem] bg-red-50 p-6 border border-red-200">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.35em] text-red-600 mb-2">Rythme cardiaque</div>
                      <div className="text-3xl font-black text-red-700">{heartbeatAnalysis.heart_rate} bpm</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.35em] text-red-600 mb-2">État</div>
                      <div className="text-lg font-black text-red-700">{heartbeatAnalysis.status}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] uppercase tracking-[0.35em] text-red-600 mb-2">Recommandation</div>
                    <p className="text-sm text-red-800">{heartbeatAnalysis.recommendation}</p>
                  </div>
                  <div className="mt-4 text-xs text-red-600">
                    Confiance du modèle : {heartbeatAnalysis.confidence}% | Prédiction : {heartbeatAnalysis.model_prediction}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-[2.5rem] p-8 border-white/50 bg-emerald-600 text-white relative overflow-hidden group">
            <Brain className="absolute -right-8 -bottom-8 text-white opacity-10 group-hover:scale-110 transition-transform" size={180} />
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <Sparkles size={24} />
              Jumeau Numérique Bébé
            </h3>
            <div className="space-y-4 text-sm leading-6 text-emerald-50/90 font-medium">
              <p>Le jumeau biométrique modélise en temps réel la physiologie cardiovasculaire, respiratoire et thermique de votre enfant.</p>
              <p>Une accélération cardiaque (bpm) ou une hausse thermique (°C) déclenchera immédiatement des alertes préventives.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
