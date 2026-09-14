'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'join'>('choice');
  const [foyerCode, setFoyerCode] = useState('');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Membres récupérés pour ce code de foyer
  const dummyMembers = [
    { id: '1', name: 'Adil', role: 'Papa (Admin)', avatar: 'bg-orange-100 text-[#e76f51]' },
    { id: '2', name: 'Sarah', role: 'Maman', avatar: 'bg-teal-100 text-teal-800' },
    { id: '3', name: 'Yanis', role: 'Enfant (10 ans)', avatar: 'bg-cyan-100 text-cyan-800' },
    { id: '4', name: 'Lina', role: 'Enfant (7 ans)', avatar: 'bg-amber-100 text-amber-800' },
  ];

  const handleConnect = () => {
    if (!selectedMember) {
      alert('Veuillez sélectionner votre profil');
      return;
    }
    // Enregistre l'utilisateur connecté dans le stockage du smartphone
    localStorage.setItem('ff_current_user', selectedMember);
    localStorage.setItem('ff_foyer_code', foyerCode || 'FLOW-9824');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col justify-center items-center px-4 py-8 select-none font-sans text-slate-800">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-orange-100 p-6 shadow-xl space-y-6">
        
        {/* Logo & Titre */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-[#e76f51] flex items-center justify-center text-white text-2xl font-black shadow-md">
            FF
          </div>
          <h1 className="text-xl font-black text-slate-900">FamilyFlow</h1>
          <p className="text-xs text-slate-500">Organisation sereine de la maison & du foyer</p>
        </div>

        {mode === 'choice' ? (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setMode('join')}
              className="w-full py-3.5 px-4 bg-[#e76f51] hover:bg-orange-600 text-white font-bold rounded-2xl shadow transition text-sm flex items-center justify-center gap-2"
            >
              🔑 Rejoindre avec un Code Foyer
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl border border-slate-200 transition text-xs"
            >
              Créer un nouveau foyer (Admin)
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Code Foyer (reçu des parents)
              </label>
              <input
                type="text"
                placeholder="Ex: FLOW-9824"
                value={foyerCode}
                onChange={(e) => setFoyerCode(e.target.value.toUpperCase())}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-base font-black tracking-widest text-[#e76f51] uppercase focus:outline-none focus:border-[#e76f51]"
              />
            </div>

            {/* Choix du membre */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">Qui utilise ce téléphone ?</label>
              <div className="grid grid-cols-2 gap-2">
                {dummyMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMember(m.name)}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                      selectedMember === m.name 
                        ? 'border-[#e76f51] bg-orange-50/50 shadow-sm' 
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${m.avatar} flex items-center justify-center font-bold text-xs`}>
                      {m.name.charAt(0)}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{m.name}</span>
                    <span className="text-[10px] text-slate-400">{m.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('choice')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConnect}
                className="flex-1 py-3 bg-[#e76f51] hover:bg-orange-600 text-white font-bold rounded-2xl shadow transition text-xs"
              >
                Entrer dans le Foyer →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
