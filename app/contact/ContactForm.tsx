'use client';

import { ArrowRight } from 'lucide-react';

export function ContactForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        try {
          localStorage.setItem(
            'keneya_contact_last',
            JSON.stringify({ ...payload, at: new Date().toISOString() })
          );
        } catch { }
        form.reset();
        alert('Message enregistré (prototype). Merci !');
      }}
      className="mt-5 grid gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-gray-700">
          Nom
          <input
            name="name"
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
            placeholder="Votre nom"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-700">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
            placeholder="vous@exemple.com"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">
        Sujet
        <input
          name="subject"
          required
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
          placeholder="Démo / partenariat / feedback…"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-gray-700">
        Message
        <textarea
          name="message"
          required
          rows={6}
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200"
          placeholder="Décrivez votre besoin…"
        />
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"
      >
        Envoyer (prototype)
        <ArrowRight size={16} />
      </button>
    </form>
  );
}

