'use client';

import React, { useState } from 'react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shopping' | 'prayers' | 'foyer' | 'settings'>('tasks');
  const [points, setPoints] = useState(420);
  const [validatedTasks, setValidatedTasks] = useState<number[]>([]);

  // État de la liste de courses
  const [shoppingItems, setShoppingItems] = useState([
    { id: 1, name: 'Courgettes', tag: 'Repas Tajine', qty: '3 pcs', checked: false },
    { id: 2, name: 'Pommes Gala bio', tag: 'Peser en balance', qty: '1 kg', checked: false },
    { id: 3, name: 'Beurre doux de baratte', tag: 'Tartines du matin', qty: '250g', checked: false },
  ]);
  const [caddieItems, setCaddieItems] = useState([
    { id: 99, name: 'Épinards frais (500g)', author: 'Pris par Sarah' }
  ]);

  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Validation parentale
  const handleValidateTask = (id: number, pts: number) => {
    setPoints(prev => prev + pts);
    setValidatedTasks(prev => [...prev, id]);
  };

  // Cocher un article au magasin
  const handleToggleShopItem = (item: typeof shoppingItems[0]) => {
    setShoppingItems(prev => prev.filter(i => i.id !== item.id));
    setCaddieItems(prev => [{ id: item.id, name: `${item.name} (${item.qty})`, author: "À l'instant" }, ...prev]);
  };

  // Dictée vocale IA Gemini
  const handleStartVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    setIsRecording(true);

    recognition.onresult = async (event: any) => {
      setIsRecording(false);
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      try {
        const res = await fetch('/api/parse-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });
        if (res.ok) {
          const data = await res.json();
          alert(`Gemini a analysé votre demande vocale avec succès !`);
        }
      } catch (err) {
        console.error(err);
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  const totalArticles = shoppingItems.length + caddieItems.length;
  const progressPct = Math.round((caddieItems.length / totalArticles) * 100);

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-slate-800 flex flex-col font-sans antialiased pb-28 select-none">
      {/* En-tête Fixe PWA */}
      <header className="sticky top-0 z-30 bg-[#fcf9f2]/95 backdrop-blur px-5 py-3 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#e76f51] flex items-center justify-center text-white font-bold shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-[#e76f51] uppercase">FamilyFlow</h1>
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Famille El Oualidi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1">
            ⭐ <span>{points}</span> pts
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Contenu Principal selon l'onglet actif */}
      <main className="flex-1 px-4 py-4 space-y-6">
        
        {/* ===================== ONGLET 1 : TÂCHES ===================== */}
        {activeTab === 'tasks' && (
          <section className="space-y-5">
            {/* Rappel Prière */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🌅</div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-full">
                    Dans 15 min • 16:15
                  </span>
                  <h3 className="font-bold text-slate-900 mt-1">Salât Al-Asr en famille</h3>
                  <p className="text-xs text-slate-500">Préparation des ablutions ensemble</p>
                </div>
              </div>
              <button onClick={() => alert('Rappel confirmé pour le foyer !')} className="px-3.5 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold shadow hover:bg-teal-800 transition">
                Prêt(e)
              </button>
            </div>

            {/* Filtres Membres */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              <button className="px-3.5 py-1.5 bg-[#e76f51] text-white font-bold rounded-full shadow-sm whitespace-nowrap">Toute la famille (4)</button>
              <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-full whitespace-nowrap">
                Yanis (10 ans) <span className="bg-orange-100 text-[#e76f51] px-1.5 rounded-full text-[10px]">2</span>
              </button>
              <button className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-full whitespace-nowrap">Lina (7 ans)</button>
            </div>

            {/* Espace Parents : Validation Parentale */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Validation Parentale
                  <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                    {validatedTasks.includes(1) ? '0 en attente' : '1 en attente'}
                  </span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Espace Parents</span>
              </div>

              {!validatedTasks.includes(1) ? (
                <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">Y</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Ranger le lave-vaisselle</h4>
                        <p className="text-[11px] text-slate-500">Terminée par Yanis à 15:45</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">+20 pts</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => alert('Renvoyé pour révision !')} className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">À corriger</button>
                    <button onClick={() => handleValidateTask(1, 20)} className="flex-1 py-2 bg-[#e76f51] hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm">
                      Valider (+20 pts)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <span>✓</span> Tâche de Yanis validée et 20 pts crédités !
                </div>
              )}
            </div>

            {/* Tâche en cours */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> En cours (1 active)
                </h2>
                <span className="text-[11px] text-emerald-600 font-medium">Chronomètre actif</span>
              </div>
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">En cours (18 min)</span>
                  <span className="text-slate-500">Chambre</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Ranger la chambre & le bureau</h4>
                <p className="text-xs text-slate-500">Livres, jouets dans le coffre et lit fait</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-3/4"></div>
                </div>
                <button onClick={() => alert('Demande de validation transmise aux parents !')} className="w-full py-2.5 bg-[#e76f51] text-white text-xs font-bold rounded-xl shadow">
                  ✓ J'ai terminé ! (Envoyer aux parents)
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 2 : COURSES ===================== */}
        {activeTab === 'shopping' && (
          <section className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-3.5 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold">Mode Magasin actif</span> • Sync temps réel
              </div>
              <span className="font-semibold text-[11px]">⚡ En direct</span>
            </div>

            {/* Jauge Caddie */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Progression du caddie</h3>
                  <p className="text-xs text-slate-500">{caddieItems.length} sur {totalArticles} articles pris</p>
                </div>
                <span className="text-xl font-black text-teal-700">{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>

            {/* Rayons & Articles à prendre */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Articles restants ({shoppingItems.length})</h4>
              {shoppingItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleToggleShopItem(item)}
                  className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#e76f51] transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center"></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded inline-block font-semibold">{item.tag}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{item.qty}</span>
                </div>
              ))}
            </div>

            {/* Déjà dans le caddie */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><span className="text-teal-600 font-black">✓</span> Déjà dans le caddie</span>
                <span className="text-slate-400">{caddieItems.length} article(s)</span>
              </div>
              <div className="space-y-2">
                {caddieItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                      <span className="text-xs line-through text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.author}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ajout Vocal IA Gemini */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">🛒 Ajout vocal express (IA Gemini)</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Actif 0€</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Ex: 1kg de bananes, café moulu, 6 œufs..."
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#e76f51]"
                />
                <button
                  onClick={handleStartVoice}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow transition ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-[#e76f51] hover:bg-orange-600'}`}
                >
                  🎤
                </button>
              </div>
              <p className="text-[11px] text-slate-500">Dictée convertie et classée automatiquement en rayon par Gemini.</p>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 3 : PRIÈRES ===================== */}
        {activeTab === 'prayers' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Horaires des Prières • Paris</h2>
              <p className="text-xs text-slate-500 mb-4">Calcul officiel UOIF 15° • Rappel sonore 20 min avant</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium">Fajr (Aube)</span>
                  <span className="font-bold text-slate-700">06:12</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium">Dhuhr (Midi)</span>
                  <span className="font-bold text-slate-700">13:30</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-orange-100 border border-orange-300 font-bold text-orange-950">
                  <span>Asr (Après-midi) • Prochaine prière</span>
                  <span>16:15</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium">Maghrib (Coucher)</span>
                  <span className="font-bold text-slate-700">18:45</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium">Isha (Nuit)</span>
                  <span className="font-bold text-slate-700">20:10</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 4 : FOYER & MEMBRES ===================== */}
        {activeTab === 'foyer' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Liaison du Foyer & Synchronisation</h2>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-800">Code Foyer Unique</div>
                  <div className="text-base font-black text-slate-900 tracking-wider">FLOW-9824</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText('FLOW-9824'); alert('Code copié !'); }} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold">
                  Copier
                </button>
              </div>
              <p className="text-xs text-slate-500">Transmettez ce code aux membres pour synchroniser leurs smartphones.</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase">Membres et Préférences Prières</h3>
              <div className="flex items-center justify-between p-2.5 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-100 text-[#e76f51] flex items-center justify-center font-bold">A</div>
                  <div>
                    <div className="font-bold text-slate-900">Adil (Papa)</div>
                    <div className="text-[10px] text-slate-400">Admin du foyer</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Prière Active</span>
              </div>
              <div className="flex items-center justify-between p-2.5 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold">S</div>
                  <div>
                    <div className="font-bold text-slate-900">Sarah (Maman)</div>
                    <div className="text-[10px] text-slate-400">Parent</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">Prière Active</span>
              </div>
              <div className="flex items-center justify-between p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">Y</div>
                  <div>
                    <div className="font-bold text-slate-900">Yanis (10 ans)</div>
                    <div className="text-[10px] text-slate-400">Enfant • Prière non requise</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Désactivée</span>
              </div>
            </div>
          </section>
        )}

        {/* ===================== ONGLET 5 : PARAMÈTRES ===================== */}
        {activeTab === 'settings' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Paramètres & PWA</h2>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <div className="font-bold text-slate-800">Version installée</div>
                  <div className="text-slate-500">v2.5.0 (Cloudflare Pages)</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">À jour</span>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">Notifications Push PWA</span>
                  <input type="checkbox" defaultChecked className="accent-[#e76f51] w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">Rappels 20 min avant la prière</span>
                  <input type="checkbox" defaultChecked className="accent-[#e76f51] w-4 h-4" />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Barre de navigation inférieure fixe (5 onglets) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200/80 px-2 py-2 flex justify-around items-center z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'tasks' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <span className="text-[10px] font-bold">Tâches</span>
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'shopping' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="text-[10px] font-bold">Courses</span>
        </button>
        <button
          onClick={() => setActiveTab('prayers')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'prayers' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span className="text-[10px] font-bold">Prières</span>
        </button>
        <button
          onClick={() => setActiveTab('foyer')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'foyer' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="text-[10px] font-bold">Foyer</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'settings' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-[10px] font-bold">Paramètres</span>
        </button>
      </nav>
    </div>
  );
}
