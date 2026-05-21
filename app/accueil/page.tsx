'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  BarChart3,
  Heart,
  Activity,
  Clock 
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Carnet Intelligent',
    desc: 'Photo → IA → Bilan. Numérisez le suivi papier de votre enfant en un clin d&apos;œil.',
    icon: Activity,
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    title: 'PediIA Expert Chat',
    desc: 'Discutez avec notre intelligence artificielle pédiatrique pour le suivi de bébé.',
    icon: Sparkles,
    color: 'bg-pink-50 text-pink-600'
  },
  {
    title: 'Vaccination Pro',
    desc: 'Suivez le calendrier du Burkina Faso et anticipez les dates clés.',
    icon: ShieldCheck,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    title: 'Dashboard Bébé',
    desc: 'Visualisez la croissance et la santé de bébé en temps réel.',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600'
  }
];

export default function AccueilPage() {
  return (
    <AppShell>
      {/* Hero Section */}
      <section className="relative overflow-hidden glass rounded-[3rem] p-8 lg:p-16 border-white/50 mb-8">
        <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-700 mb-6">
              <Sparkles size={14} />
              L&apos;excellence au service de la vie
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-gray-900 mb-6 leading-[1.1]">
                Le Suivi de Votre <span className="text-emerald-600">Nourrisson</span>, Optimisé par l&apos;IA.
            </h1>
            <p className="text-lg text-gray-500 font-medium leading-relaxed mb-10 max-w-lg">
              Kénéya pédiatrique transforme le suivi du carnet de santé classique et la planification des vaccins en une expérience prédictive, rassurante et experte.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bebe" className="btn-premium py-4 px-8 text-base">
                Suivi & Calendrier Vaccinal
                <ArrowRight size={20} />
              </Link>
              <Link href="/carnet" className="btn-secondary py-4 px-8 text-base">
                Numériser Carnet (OCR)
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-600/10 border-8 border-white">
              <Image
                src="/enfant.png"
                alt="Kénéya Pédiatrie"
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Stats Card Overlay */}
            <div className="absolute -bottom-6 -left-6 glass p-6 rounded-3xl border-white shadow-xl max-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <div className="text-2xl font-black text-gray-900">98%</div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Précision de l&apos;analyse</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="glass p-8 rounded-[2rem] border-white/50 hover:border-emerald-200 transition-colors group"
          >
            <div className={`h-14 w-14 rounded-2xl ${f.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <f.icon size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{f.title}</h3>
            <p className="text-sm font-medium text-gray-500 leading-relaxed">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Call to Action Section */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="glass rounded-[3rem] p-10 border-white/50 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4">Espace Professionnel</h2>
            <p className="text-gray-400 font-medium mb-8 max-w-sm">
              Accédez au dashboard agent, suivez les indicateurs clés (KPI) et gérez les urgences terrain.
            </p>
            <Link href="/agent" className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-colors">
              Connexion Agent <ShieldCheck size={18} />
            </Link>
          </div>
          <BarChart3 className="absolute -right-8 -bottom-8 text-white/5 opacity-10" size={240} />
        </div>

        <div className="glass rounded-[3rem] p-10 border-white/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-widest mb-4">
              <Clock size={14} /> En direct
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Besoin d&apos;une démo ?</h2>
            <p className="text-gray-500 font-medium mb-8">
              Découvrez comment Kénéya peut être déployé dans votre centre de santé ou votre ONG.
            </p>
          </div>
          <Link href="/contact" className="btn-premium bg-pink-600 hover:bg-pink-700 shadow-pink-500/20 w-fit">
            Prendre rendez-vous <PhoneCall size={18} />
          </Link>
        </div>
      </section>

      {/* Safety Alert */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-12 p-8 rounded-[2.5rem] glass border-amber-100 bg-amber-50/20 text-amber-900"
      >
        <div className="flex gap-4 items-start">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-black text-lg mb-1">Note de sécurité importante</h4>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              Kénéya est un outil de support et de prévention. Les informations fournies par nos IA ne remplacent en aucun cas un examen médical réel. En cas de symptômes graves, rendez-vous immédiatement à l&apos;hôpital.
            </p>
          </div>
        </div>
      </motion.section>
    </AppShell>
  );
}
