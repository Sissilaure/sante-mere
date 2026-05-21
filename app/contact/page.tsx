import { AppShell } from '../components/AppShell';
import Link from 'next/link';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { ContactForm } from './ContactForm';

export default function ContactPage() {
  return (
    <AppShell
      title="Contact"
      subtitle="Pour une démo, un partenariat (centre de santé, ONG, programme SMI), ou des retours terrain."
      actions={
        <Link
          href="/agent"
          className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Espace agent
          <ArrowRight size={16} />
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-extrabold text-gray-900">Écrivez‑nous</h2>
          <p className="mt-2 text-sm leading-7 text-gray-600">
            Formulaire local (prototype). En production : envoi email + CRM + tickets.
          </p>
          <ContactForm />
        </section>

        <aside className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">Informations</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 text-emerald-600" />
              <div>
                <div className="font-extrabold">Email</div>
                <div className="text-gray-600">contact@keneya.app (exemple)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 text-emerald-600" />
              <div>
                <div className="font-extrabold">Téléphone</div>
                <div className="text-gray-600">+223 00 00 00 00 (exemple)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 text-emerald-600" />
              <div>
                <div className="font-extrabold">Zone</div>
                <div className="text-gray-600">Afrique de l’Ouest (prototype)</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

