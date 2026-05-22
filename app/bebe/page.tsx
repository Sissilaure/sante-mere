'use client';

import { AppShell } from '../components/AppShell';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  Copy,
  Send,
  Sparkles,
  Calendar,
  Activity,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  LineChart,
  MessageSquare
} from 'lucide-react';

type Message = { role: 'user' | 'model'; text: string };

type GrowthEntry = {
  id: string;
  date: string;
  weight: number;
  height: number;
  temp: number;
};

function readStoredString(key: string, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const QUICK = [
  'Bébé a 6 mois, que changer dans son alimentation ?',
  'Diarrhée et vomissements depuis ce matin, que faire ?',
  'Mon nourrisson a de la fièvre (38.4°C), que faire en premier ?',
  'Quel est le rôle du vaccin R21 contre le paludisme ?',
  'Mon enfant a raté son vaccin de 3 mois, comment rattraper ?',
];

const VACCINES = [
  { id: 'bcg', name: 'BCG', target: 'Tuberculose', ageGroup: 'Naissance', weeksOffset: 0, desc: 'Protège contre les formes graves de la tuberculose.' },
  { id: 'vpo0', name: 'VPO 0', target: 'Poliomyélite', ageGroup: 'Naissance', weeksOffset: 0, desc: 'Dose zéro du vaccin oral contre la poliomyélite.' },
  { id: 'hepb', name: 'HépB', target: 'Hépatite B', ageGroup: 'Naissance', weeksOffset: 0, desc: 'Protège le foie contre l\'hépatite B dès la naissance.' },

  { id: 'dtc_hepb_hib1', name: 'DTC-HepB-Hib 1', target: 'DTC, HépB, Hib', ageGroup: '6 semaines (2 mois)', weeksOffset: 6, desc: 'Première dose du vaccin pentavalent combiné.' },
  { id: 'vpo1', name: 'VPO 1', target: 'Poliomyélite', ageGroup: '6 semaines (2 mois)', weeksOffset: 6, desc: 'Première dose orale contre la poliomyélite.' },
  { id: 'rota1', name: 'Rota 1', target: 'Diarrhées à Rotavirus', ageGroup: '6 semaines (2 mois)', weeksOffset: 6, desc: 'Protège contre les diarrhées graves dues au rotavirus.' },
  { id: 'pneumo1', name: 'Pneumo 1', target: 'Pneumococoque (PCV13)', ageGroup: '6 semaines (2 mois)', weeksOffset: 6, desc: 'Protège contre les infections à pneumocoques (pneumonie, méningite).' },

  { id: 'dtc_hepb_hib2', name: 'DTC-HepB-Hib 2', target: 'Pentavalent 2', ageGroup: '10 semaines (3 mois)', weeksOffset: 10, desc: 'Deuxième dose du vaccin pentavalent.' },
  { id: 'vpo2', name: 'VPO 2', target: 'Poliomyélite', ageGroup: '10 semaines (3 mois)', weeksOffset: 10, desc: 'Deuxième dose orale de poliomyélite.' },
  { id: 'rota2', name: 'Rota 2', target: 'Diarrhées à Rotavirus', ageGroup: '10 semaines (3 mois)', weeksOffset: 10, desc: 'Deuxième dose buvable contre le Rotavirus.' },
  { id: 'pneumo2', name: 'Pneumo 2', target: 'Pneumocoque (PCV13)', ageGroup: '10 semaines (3 mois)', weeksOffset: 10, desc: 'Deuxième dose contre le Pneumocoque.' },

  { id: 'dtc_hepb_hib3', name: 'DTC-HepB-Hib 3', target: 'Pentavalent 3', ageGroup: '14 semaines (4 mois)', weeksOffset: 14, desc: 'Troisième et dernière dose primaire du pentavalent.' },
  { id: 'vpo3', name: 'VPO 3', target: 'Poliomyélite', ageGroup: '14 semaines (4 mois)', weeksOffset: 14, desc: 'Troisième dose orale contre la poliomyélite.' },
  { id: 'pneumo3', name: 'Pneumo 3', target: 'Pneumocoque (PCV13)', ageGroup: '14 semaines (4 mois)', weeksOffset: 14, desc: 'Troisième dose contre le Pneumocoque.' },
  { id: 'vpi1', name: 'VPI 1', target: 'Poliomyélite (Injectable)', ageGroup: '14 semaines (4 mois)', weeksOffset: 14, desc: 'Première dose de vaccin polio injectable pour une protection renforcée.' },

  { id: 'paludisme1', name: 'Paludisme 1 (R21)', target: 'Paludisme', ageGroup: '5 mois', weeksOffset: 21.7, desc: '1ère dose du vaccin antipaludique R21/Matrix-M introduit au Burkina.' },
  { id: 'paludisme2', name: 'Paludisme 2 (R21)', target: 'Paludisme', ageGroup: '6 mois', weeksOffset: 26, desc: '2ème dose du vaccin antipaludique + supplémentation Vitamine A.' },
  { id: 'paludisme3', name: 'Paludisme 3 (R21)', target: 'Paludisme', ageGroup: '7 mois', weeksOffset: 30.3, desc: '3ème dose complétant la série primaire antipaludique.' },

  { id: 'rr1', name: 'RR 1', target: 'Rougeole & Rubéole', ageGroup: '9 mois', weeksOffset: 39, desc: 'Première dose protégeant contre la rougeole et la rubéole.' },
  { id: 'vaa', name: 'VAA (Amarile)', target: 'Fièvre Jaune', ageGroup: '9 mois', weeksOffset: 39, desc: 'Dose unique pour immuniser contre le virus de la fièvre jaune.' },
  { id: 'vpi2', name: 'VPI 2', target: 'Poliomyélite (Injectable)', ageGroup: '9 mois', weeksOffset: 39, desc: 'Deuxième dose injectable contre la poliomyélite.' },

  { id: 'vita12', name: 'Vitamine A & Déparasitant', target: 'Immunité & Vers', ageGroup: '12 mois', weeksOffset: 52, desc: 'Supplémentation en Vitamine A et déparasitage systématique contre les helminthes.' },

  { id: 'rr2', name: 'RR 2', target: 'Rougeole & Rubéole', ageGroup: '15 mois', weeksOffset: 65, desc: 'Deuxième dose de rappel contre la rougeole et la rubéole.' },
  { id: 'mena', name: 'Mén-A', target: 'Méningite A', ageGroup: '15 mois', weeksOffset: 65, desc: 'Protège contre les épidémies de méningite à méningocoque A.' },
  { id: 'paludisme4', name: 'Paludisme 4 (R21)', target: 'Paludisme (Rappel)', ageGroup: '15 mois', weeksOffset: 65, desc: 'Quatrième dose indispensable de rappel pour prolonger la protection contre le paludisme.' }
];

function renderMessage(text: string) {
  const blocks = text.split(/\n{2,}/g).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((l) => /^[-•*]\s+/.test(l) || /^\d+\.\s+/.test(l));
    const looksLikeTitle = lines.length === 1 && /^[A-ZÉÈÀÙÂÊÎÔÛÇ][^:]{2,60}:?$/.test(lines[0]);

    if (looksLikeTitle) {
      return (
        <p key={idx} className="font-extrabold text-gray-900 mt-3 first:mt-0">
          {lines[0].replace(/:$/, '')}
        </p>
      );
    }

    if (isList) {
      return (
        <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
          {lines.map((l, j) => (
            <li key={j}>{l.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '')}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={idx} className="whitespace-pre-wrap leading-relaxed">
        {block}
      </p>
    );
  });
}

export default function BebePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'vaccins' | 'croissance'>('vaccins');
  const [expandedAgeGroup, setExpandedAgeGroup] = useState<string | null>('Naissance');
  
  // State Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text:
        "Bonjour, je suis PediIA, votre assistante dédiée au nourrisson.\n\nPosez vos questions sur la santé de votre enfant, ses vaccins, son alimentation ou sa croissance au Burkina Faso.\n\n⚠️ Si bébé a moins de 3 mois avec une fièvre >= 38°C, c'est une urgence. Rendez-vous immédiatement dans le centre de santé le plus proche.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // State Vaccins
  const [birthDate, setBirthDate] = useState<string>(() => readStoredString('keneya_bebe_birthdate', ''));
  const [completedVaccines, setCompletedVaccines] = useState<Record<string, boolean>>(() =>
    readStoredJson<Record<string, boolean>>('keneya_vaccines_status', {})
  );

  // State Croissance
  const [growthData, setGrowthData] = useState<GrowthEntry[]>(() =>
    readStoredJson<GrowthEntry[]>('keneya_growth_data', [])
  );
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [temp, setTemp] = useState('');

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, activeTab]);

  // Actions Chat
  const send = async (text?: string) => {
    const msgToSend = (text ?? chatInput).trim();
    if (!msgToSend || chatLoading) return;
    setChatInput('');

    const updated: Message[] = [...messages, { role: 'user', text: msgToSend }];
    setMessages(updated);
    setChatLoading(true);

    // Save question to localStorage for dashboard sync
    try {
      const existing = localStorage.getItem('keneya_questions_bebe');
      const questions: { text: string; at: string }[] = existing ? JSON.parse(existing) : [];
      questions.unshift({ text: msgToSend, at: new Date().toISOString() });
      localStorage.setItem('keneya_questions_bebe', JSON.stringify(questions.slice(0, 50)));
      
      const count = Number(localStorage.getItem('keneya_kpi_bebe_questions') || '0');
      localStorage.setItem('keneya_kpi_bebe_questions', String(count + 1));
    } catch { }

    try {
      const res = await fetch('/api/chat-bebe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setMessages((prev) => [...prev, { role: 'model', text: `❌ Impossible de joindre PediIA : ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Actions Vaccins
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    localStorage.setItem('keneya_bebe_birthdate', val);
  };

  const toggleVaccine = (id: string) => {
    const next = { ...completedVaccines, [id]: !completedVaccines[id] };
    setCompletedVaccines(next);
    localStorage.setItem('keneya_vaccines_status', JSON.stringify(next));
  };

  const calculateVaccineDate = (weeksOffset: number) => {
    if (!birthDate) return '—';
    const date = new Date(birthDate);
    date.setDate(date.getDate() + Math.round(weeksOffset * 7));
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getVaccineStatus = (weeksOffset: number, id: string) => {
    if (completedVaccines[id]) return 'complet';
    if (!birthDate) return 'attente';
    const date = new Date(birthDate);
    date.setDate(date.getDate() + Math.round(weeksOffset * 7));
    const now = new Date();
    return now > date ? 'retard' : 'avenir';
  };

  const vaccineProgress = (() => {
    const total = VACCINES.length;
    const completed = VACCINES.filter((v) => completedVaccines[v.id]).length;
    return Math.round((completed / total) * 100);
  })();

  // Group vaccines by ageGroup
  const vaccinesByAgeGroup = (() => {
    const groups = new Map<string, typeof VACCINES>();
    VACCINES.forEach((v) => {
      const group = v.ageGroup;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(v);
    });
    // Return in order
    const order = ['Naissance', '6 semaines (2 mois)', '10 semaines (3 mois)', '14 semaines (4 mois)', '5 mois', '6 mois', '7 mois', '9 mois', '12 mois', '15 mois'];
    return order.filter(age => groups.has(age)).map(age => ({ age, vaccines: groups.get(age)! }));
  })();

  // Actions Croissance
  const addGrowth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height || !temp) return;
    const entry: GrowthEntry = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      weight: parseFloat(weight),
      height: parseFloat(height),
      temp: parseFloat(temp),
    };
    const updated = [entry, ...growthData];
    setGrowthData(updated);
    localStorage.setItem('keneya_growth_data', JSON.stringify(updated));
    setWeight('');
    setHeight('');
    setTemp('');
  };

  const deleteGrowth = (id: string) => {
    const updated = growthData.filter((g) => g.id !== id);
    setGrowthData(updated);
    localStorage.setItem('keneya_growth_data', JSON.stringify(updated));
  };

  return (
    <AppShell
      title="Suivi Pédiatrique & Vaccins"
      subtitle="Gérez le calendrier vaccinal officiel du Burkina Faso et discutez avec l'IA pédiatrique pour le bien-être de votre nourrisson."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md transition-all active:scale-95"
        >
          <Activity size={16} />
          Jumeau Biométrique
        </Link>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main interactive panel */}
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <nav className="flex p-1.5 bg-white/70 backdrop-blur-md rounded-3xl w-fit border border-gray-100/50 shadow-sm gap-1">
            <button
              onClick={() => setActiveTab('vaccins')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                activeTab === 'vaccins'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
              }`}
            >
              <Calendar size={18} />
              <span>Vaccination BF</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                activeTab === 'chat'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
              }`}
            >
              <MessageSquare size={18} />
              <span>Chat PediIA</span>
            </button>
            <button
              onClick={() => setActiveTab('croissance')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                activeTab === 'croissance'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50'
              }`}
            >
              <LineChart size={18} />
              <span>Journal Croissance</span>
            </button>
          </nav>

          {/* Dynamic Panel Content */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* TAB 1: VACCINES */}
              {activeTab === 'vaccins' && (
                <motion.div
                  key="vaccins"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-[2rem] p-8 border-white/50 bg-white/80 shadow-sm space-y-6">
                    <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                      <Calendar className="text-emerald-600" />
                      Planificateur de Vaccination (PEV Burkina Faso)
                    </h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">
                      Saisissez la date de naissance de votre enfant pour générer son calendrier de vaccination personnalisé et suivre sa couverture vaccinale en temps réel.
                    </p>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Birthdate Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Date de naissance</label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => handleBirthDateChange(e.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
                        />
                      </div>
                      
                      {/* Stats Cover */}
                      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Progression</span>
                          <span className="text-xl font-black text-emerald-700">{vaccineProgress}%</span>
                        </div>
                        <div className="w-full bg-emerald-100/60 rounded-full h-3.5 mt-3 overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${vaccineProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {!birthDate && (
                      <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-900 flex gap-3 items-start">
                        <AlertCircle size={20} className="shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-extrabold">Date de naissance requise</p>
                          <p className="mt-1 opacity-80 leading-relaxed font-medium">
                            Veuillez entrer la date de naissance ci-dessus pour calculer automatiquement les dates exactes des prochains rendez-vous de vaccination.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Vaccines list grouped by age */}
                    <div className="space-y-3 pt-2">
                      {vaccinesByAgeGroup.map(({ age, vaccines: ageVaccines }) => (
                        <div key={age} className="border border-gray-100 rounded-3xl overflow-hidden bg-white">
                          <button
                            onClick={() => setExpandedAgeGroup(expandedAgeGroup === age ? null : age)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar size={18} className="text-emerald-600" />
                              <div className="text-left">
                                <h4 className="font-extrabold text-gray-900 text-sm">{age}</h4>
                                <p className="text-xs text-gray-500 font-medium">{ageVaccines.length} vaccin{ageVaccines.length > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs font-bold text-emerald-600">
                                  {ageVaccines.filter(v => completedVaccines[v.id]).length}/{ageVaccines.length}
                                </div>
                              </div>
                              <div className={`transform transition-transform duration-300 ${expandedAgeGroup === age ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            </div>
                          </button>
                          
                          {expandedAgeGroup === age && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-100 bg-gray-50/30"
                            >
                              <div className="p-4 space-y-3">
                                {ageVaccines.map((v) => {
                                  const status = getVaccineStatus(v.weeksOffset, v.id);
                                  return (
                                    <div
                                      key={v.id}
                                      className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ${
                                        completedVaccines[v.id]
                                          ? 'bg-emerald-50 border border-emerald-100'
                                          : 'bg-white border border-gray-100 hover:border-emerald-100'
                                      }`}
                                    >
                                      {/* Checkbox */}
                                      <button
                                        onClick={() => toggleVaccine(v.id)}
                                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all border mt-0.5 ${
                                          completedVaccines[v.id]
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                            : 'bg-white border-gray-200 text-transparent hover:border-emerald-500'
                                        }`}
                                      >
                                        <Check size={18} className="stroke-[3px]" />
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <span className="font-bold text-gray-900 text-sm">{v.name}</span>
                                          <span className="text-xs font-semibold text-gray-400">• {v.target}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{v.desc}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Calendar size={12} className="text-gray-400" />
                                          <span className="text-xs font-semibold text-gray-600">{calculateVaccineDate(v.weeksOffset)}</span>
                                        </div>
                                      </div>

                                      {/* Status badge */}
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wider shrink-0 ${
                                          status === 'complet'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : status === 'retard'
                                            ? 'bg-red-100 text-red-800 animate-pulse'
                                            : status === 'avenir'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-500'
                                        }`}
                                      >
                                        {status === 'complet' ? '✓ Fait' : status === 'retard' ? '⚠️ Retard' : 'À venir'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: CHAT */}
              {activeTab === 'chat' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <div className="glass rounded-[2.5rem] p-8 border-white/50 bg-white/80 shadow-sm flex flex-col h-[620px]">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-4">
                      <Sparkles className="text-pink-500" />
                      Discuter avec PediIA
                    </h3>

                    {/* Alert details */}
                    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-xs text-blue-950 flex gap-2">
                      <Baby size={18} className="text-blue-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-semibold">
                        Afin d&apos;obtenir une réponse optimale, veuillez préciser si possible : l&apos;âge exact de bébé (en mois), sa température (°C), son poids actuel, son alimentation et la durée des symptômes.
                      </p>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto rounded-3xl bg-gray-50/50 border border-gray-100 p-4 space-y-4">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm shadow-sm leading-relaxed ${
                              m.role === 'user'
                                ? 'bg-emerald-600 text-white shadow-emerald-600/10'
                                : 'bg-white border border-gray-200/60 text-gray-800'
                            }`}
                          >
                            <div className="space-y-1">{renderMessage(m.text)}</div>
                            {m.role === 'model' && (
                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={async () => { try { await navigator.clipboard.writeText(m.text); } catch { } }}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition-colors shadow-sm"
                                >
                                  <Copy size={12} />
                                  Copier
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-2 items-center text-emerald-600 font-black text-xs animate-pulse pl-2">
                          <Sparkles size={14} />
                          PediIA formule sa réponse...
                        </div>
                      )}
                      <div ref={endRef} />
                    </div>

                    {/* Form input */}
                    <div className="mt-4 flex gap-3">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Posez votre question sur la santé ou la vaccination de bébé..."
                        className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        disabled={chatLoading}
                      />
                      <button
                        onClick={() => send()}
                        disabled={chatLoading || !chatInput.trim()}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95 shrink-0"
                        title="Envoyer"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: GROWTH */}
              {activeTab === 'croissance' && (
                <motion.div
                  key="croissance"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="glass rounded-[2rem] p-8 border-white/50 bg-white/80 shadow-sm space-y-6">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                      <LineChart className="text-emerald-600" />
                      Journal de Croissance du Nourrisson
                    </h3>

                    {/* Form logger */}
                    <form onSubmit={addGrowth} className="grid gap-4 sm:grid-cols-4 items-end bg-slate-50/50 p-6 rounded-3xl border border-gray-100">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Poids (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5.4"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Taille (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 58"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Température (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 36.8"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Ajouter
                      </button>
                    </form>

                    {/* History logs list */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Historique des constantes</h4>
                      
                      {growthData.length === 0 ? (
                        <div className="text-center py-10 rounded-3xl border border-dashed border-gray-200 text-gray-400 font-semibold text-sm">
                          Aucune constante enregistrée. Complétez le formulaire ci-dessus.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {growthData.map((g) => {
                            const isFever = g.temp >= 38;
                            const isHypo = g.temp < 35.5;
                            return (
                              <div
                                key={g.id}
                                className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-all"
                              >
                                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 flex-1">
                                  <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Date</div>
                                    <div className="font-extrabold text-gray-800 mt-0.5">{g.date}</div>
                                  </div>
                                  <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Poids</div>
                                    <div className="font-extrabold text-emerald-600 mt-0.5">{g.weight} kg</div>
                                  </div>
                                  <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Taille</div>
                                    <div className="font-extrabold text-gray-800 mt-0.5">{g.height} cm</div>
                                  </div>
                                  <div className="text-xs">
                                    <div className="text-gray-400 font-bold uppercase tracking-wider text-[8px]">Température</div>
                                    <div className={`font-extrabold mt-0.5 flex items-center gap-1.5 ${
                                      isFever ? 'text-red-600 font-black' : isHypo ? 'text-blue-500 font-black' : 'text-gray-800'
                                    }`}>
                                      {g.temp} °C
                                      {(isFever || isHypo) && <div className={`h-2 w-2 rounded-full animate-pulse ${isFever ? 'bg-red-500' : 'bg-blue-500'}`} />}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => deleteGrowth(g.id)}
                                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl text-gray-400 transition-all shrink-0 ml-3"
                                  title="Supprimer la ligne"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info Section */}
        <aside className="space-y-6">
          <div className="glass rounded-[2.5rem] p-6 border-white/50 bg-white/90 shadow-sm">
            <Image
              src="/enfant.png"
              alt="Suivi Nourrisson"
              width={520}
              height={360}
              className="h-44 w-full rounded-3xl object-cover shadow-sm mb-5 border-4 border-white"
            />
            <h3 className="text-lg font-black text-gray-900">Questions Fréquentes</h3>
            <p className="text-xs font-semibold text-gray-400 mt-1 mb-4">Cliquez pour lancer une demande immédiate à PediIA.</p>
            
            <div className="flex flex-col gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setActiveTab('chat');
                    send(q);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl border border-emerald-100/50 bg-emerald-50/20 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 transition-all duration-300 active:scale-98 leading-relaxed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-amber-100 bg-amber-50/50 p-6 text-sm text-amber-900 shadow-sm space-y-3">
            <div className="font-black text-base flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-600" />
              Signes d&apos;Alerte Clinique
            </div>
            <p className="text-xs font-semibold text-amber-800 opacity-80 leading-relaxed">
              Consultez d&apos;urgence un centre de santé (CSPS/Hôpital) si le nourrisson présente l&apos;un de ces symptômes :
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-xs font-bold leading-relaxed text-amber-900">
              <li>Fièvre chez un nourrisson de moins de 3 mois</li>
              <li>Difficultés ou sifflements respiratoires</li>
              <li>Refus systématique de s&apos;alimenter / somnolence extrême</li>
              <li>Vomissements persistants ou signes de déshydratation</li>
              <li>Selles fréquentes très liquides ou contenant du sang</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
