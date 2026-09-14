'use client';

import React, { useState } from 'react';

interface Member {
  id: string;
  name: string;
  role: string;
  age: string;
  prayerEnabled: boolean;
  avatarBg: string;
}

interface TaskItem {
  id: string;
  title: string;
  assignedTo: string;
  points: number;
  status: 'pending_validation' | 'in_progress' | 'todo' | 'completed';
  time?: string;
  category?: string;
  details?: string;
}

interface ShopItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  note?: string;
}

interface CaddieItem {
  id: string;
  name: string;
  takenBy: string;
  time: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shopping' | 'prayers' | 'foyer' | 'settings'>('tasks');
  const [points, setPoints] = useState(420);

  // Paramètres du foyer
  const [familyName, setFamilyName] = useState('Famille El Oualidi');
  const [foyerCode, setFoyerCode] = useState('FLOW-9824');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [prayerReminderMinutes, setPrayerReminderMinutes] = useState('20');
  const [prayerSoundEnabled, setPrayerSoundEnabled] = useState(true);

  // Membres de la famille
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Adil', role: 'Papa (Admin)', age: 'Adulte', prayerEnabled: true, avatarBg: 'bg-orange-100 text-[#e76f51]' },
    { id: '2', name: 'Sarah', role: 'Maman', age: 'Adulte', prayerEnabled: true, avatarBg: 'bg-teal-100 text-teal-800' },
    { id: '3', name: 'Yanis', role: 'Enfant', age: '10 ans', prayerEnabled: false, avatarBg: 'bg-cyan-100 text-cyan-800' },
    { id: '4', name: 'Lina', role: 'Enfant', age: '7 ans', prayerEnabled: false, avatarBg: 'bg-amber-100 text-amber-800' },
  ]);

  // Filtre actif dans les tâches
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // Tâches
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', title: 'Ranger le lave-vaisselle', assignedTo: 'Yanis', points: 20, status: 'pending_validation', time: '15:45' },
    { id: 't2', title: 'Ranger la chambre & le bureau', assignedTo: 'Yanis', points: 15, status: 'in_progress', category: 'Chambre', details: 'Livres, jouets dans le coffre et lit fait' },
    { id: 't3', title: 'Mettre la table pour le dîner', assignedTo: 'Lina', points: 10, status: 'todo', details: '4 assiettes, verres et couverts' },
  ]);

  // Liste de courses
  const [shoppingItems, setShoppingItems] = useState<ShopItem[]>([
    { id: 's1', name: 'Courgettes', category: '🥦 Fruits & Légumes', quantity: '3 pcs', note: 'Repas Tajine' },
    { id: 's2', name: 'Pommes Gala bio', category: '🥦 Fruits & Légumes', quantity: '1 kg', note: 'Peser en balance' },
    { id: 's3', name: 'Beurre doux de baratte', category: '🧀 Produits Laitiers & Frais', quantity: '250g', note: 'Tartines du matin' },
  ]);

  // Caddie
  const [caddie, setCaddie] = useState<CaddieItem[]>([
    { id: 'c1', name: 'Épinards frais (500g)', takenBy: 'Sarah', time: '14:20' },
  ]);

  const [voicePrompt, setVoicePrompt] = useState('');

  // Actions Tâches
  const validateTask = (id: string, pts: number) => {
    setPoints(prev => prev + pts);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    alert(`Tâche validée ! +${pts} points ajoutés au compteur.`);
  };

  const markTaskDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'pending_validation' } : t));
    alert('Bravo ! Notification de validation envoyée aux parents.');
  };

  const startTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'in_progress' } : t));
  };

  // Actions Courses
  const pickItemToCaddie = (item: ShopItem) => {
    setShoppingItems(prev => prev.filter(s => s.id !== item.id));
    setCaddie(prev => [{ id: item.id, name: `${item.name} (${item.quantity})`, takenBy: 'Adil', time: 'À l\'instant' }, ...prev]);
  };

  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voicePrompt.trim()) return;
    const newItem: ShopItem = {
      id: 's_' + Date.now(),
      name: voicePrompt,
      category: '🥦 Rayon Divers',
      quantity: '1x'
    };
    setShoppingItems(prev => [...prev, newItem]);
    setVoicePrompt('');
    alert(`« ${newItem.name} » ajouté aux courses !`);
  };

  // Bascule prière par membre
  const togglePrayer = (memberId: string) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, prayerEnabled: !m.prayerEnabled } : m));
  };

  const totalShoppingCount = shoppingItems.length + caddie.length;
  const shoppingProgress = totalShoppingCount > 0 ? Math.round((caddie.length / totalShoppingCount) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col font-sans text-slate-800 antialiased select-none pb-24">
      {/* En-tête Fixe PWA */}
      <header className="bg-[#fcf9f2]/95 backdrop-blur sticky top-0 z-30 px-5 py-3 border-b border-orange-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#e76f51] flex items-center justify-center text-white font-bold shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-[#e76f51] uppercase">FamilyFlow</h1>
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {familyName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
            ⭐ <span>{points}</span> pts
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm flex items-center justify-center font-bold text-xs text-orange-600 bg-orange-100">
            A
          </div>
        </div>
      </header>

      {/* Contenu Déroulant Principal */}
      <main className="flex-1 px-4 py-4 space-y-5 max-w-lg mx-auto w-full">

        {/* ======================================================== */}
        {/* ONGLET 1 : TÂCHES & VALIDATION */}
        {/* ======================================================== */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Bannière Prière Prochaine */}
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
              <button
                onClick={() => alert('Rappel confirmé pour le foyer !')}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow transition"
              >
                Prêt(e)
              </button>
            </div>

            {/* Filtres par Membre */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedMemberFilter('all')}
                className={`px-3.5 py-1.5 rounded-full font-bold shadow-sm whitespace-nowrap transition ${selectedMemberFilter === 'all' ? 'bg-[#e76f51] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              >
                Toute la famille ({members.length})
              </button>
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberFilter(m.name)}
                  className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition ${selectedMemberFilter === m.name ? 'bg-[#e76f51] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                >
                  {m.name} ({m.age})
                </button>
              ))}
            </div>

            {/* Validation Parentale */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Validation Parentale
                  <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter(t => t.status === 'pending_validation').length} en attente
                  </span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Espace Parents</span>
              </div>

              {tasks.filter(t => t.status === 'pending_validation').map(task => (
                <div key={task.id} className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                        {task.assignedTo.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                        <p className="text-[11px] text-slate-500">Terminée par {task.assignedTo} à {task.time || '15:45'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      +{task.points} pts
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => alert('Tâche renvoyée avec note explicative !')}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                      À corriger
                    </button>
                    <button
                      onClick={() => validateTask(task.id, task.points)}
                      className="flex-1 py-2 bg-[#e76f51] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm"
                    >
                      Valider (+{task.points} pts)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tâches En cours */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  En cours ({tasks.filter(t => t.status === 'in_progress').length} active)
                </h2>
                <span className="text-[11px] text-emerald-600 font-medium">Chronomètre actif</span>
              </div>

              {tasks.filter(t => t.status === 'in_progress').map(task => (
                <div key={task.id} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">{task.assignedTo} • En cours (18 min)</span>
                    <span className="text-slate-500">{task.category || 'Maison'}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                  {task.details && <p className="text-xs text-slate-500">{task.details}</p>}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-3/4"></div>
                  </div>
                  <button
                    onClick={() => markTaskDone(task.id)}
                    className="w-full py-2.5 bg-[#e76f51] hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    ✓ J'ai terminé ! (Envoyer aux parents)
                  </button>
                </div>
              ))}
            </div>

            {/* Tâches À faire */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">À faire aujourd'hui</h3>
              {tasks.filter(t => t.status === 'todo').map(task => (
                <div key={task.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[11px] text-slate-500 font-semibold">{task.assignedTo} • +{task.points} pts</div>
                    <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                    {task.details && <div className="text-xs text-slate-400">{task.details}</div>}
                  </div>
                  <button
                    onClick={() => startTask(task.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                  >
                    ▶ Démarrer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 2 : COURSES & MODE MAGASIN */}
        {/* ======================================================== */}
        {activeTab === 'shopping' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 px-3.5 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold">Mode Magasin actif</span> • Sync temps réel
              </div>
              <span className="font-semibold text-[11px]">⚡ En direct</span>
            </div>

            {/* Progression */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Progression du caddie</h3>
                  <p className="text-xs text-slate-500">{caddie.length} sur {totalShoppingCount} articles pris</p>
                </div>
                <span className="text-xl font-black text-teal-700">{shoppingProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${shoppingProgress}%` }}></div>
              </div>
            </div>

            {/* Rayons / Articles à prendre */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Articles à récupérer</h3>
              {shoppingItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => pickItemToCaddie(item)}
                  className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-orange-300 transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center hover:border-teal-600"></div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded inline-block font-semibold">
                        {item.note || item.category}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Déjà dans le caddie */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="text-teal-600 font-black">✓</span> Déjà dans le caddie
                </span>
                <span className="text-slate-400">{caddie.length} article(s)</span>
              </div>
              <div className="space-y-2">
                {caddie.map(item => (
                  <div key={item.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                      <span className="text-xs line-through text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.takenBy}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ajout Express */}
            <form onSubmit={handleAddShoppingItem} className="bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  🛒 Ajout express (ou dictée vocale)
                </h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Gratuit 0€
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Bananes, café, 6 œufs..."
                  value={voicePrompt}
                  onChange={(e) => setVoicePrompt(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#e76f51]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#e76f51] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow transition"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 3 : PRIÈRES & RAPPELS */}
        {/* ======================================================== */}
        {activeTab === 'prayers' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Horaires des Prières • Paris</h2>
              <p className="text-xs text-slate-500 mb-4">Calcul astronomique officiel UOIF 15° • Rappel {prayerReminderMinutes} min avant</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium text-slate-700">Fajr (Aube)</span>
                  <span className="font-bold text-slate-800">06:12</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium text-slate-700">Dhuhr (Midi)</span>
                  <span className="font-bold text-slate-800">13:30</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-orange-100/80 border border-orange-300 font-bold text-orange-950">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e76f51] animate-ping"></span>
                    Asr (Après-midi) • Prochaine
                  </span>
                  <span className="text-sm font-black">16:15</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium text-slate-700">Maghrib (Coucher)</span>
                  <span className="font-bold text-slate-800">18:45</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50">
                  <span className="font-medium text-slate-700">Isha (Nuit)</span>
                  <span className="font-bold text-slate-800">20:10</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 4 : FOYER & MEMBRES (AVEC QR CODE & PARTAGE) */}
        {/* ======================================================== */}
        {activeTab === 'foyer' && (
          <div className="space-y-4">
            {/* Liaison du Foyer & Partage Multi-options */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Liaison du Foyer & Partage</h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ⚡ Sync en direct
                </span>
              </div>

              {/* Code Foyer */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Code Foyer Unique</div>
                    <div className="text-xl font-black text-slate-900 tracking-widest">{foyerCode}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(foyerCode);
                        alert(`Code ${foyerCode} copié !`);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Copier le code
                    </button>
                  </div>
                </div>

                {/* QR Code & Lien Magique */}
                <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-center gap-3 bg-white/80 p-3 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                      typeof window !== 'undefined' ? `${window.location.origin}/login?code=${foyerCode}` : `https://familyflow-2.adil-eloualidi.workers.dev/login?code=${foyerCode}`
                    )}&color=e76f51`}
                    alt="QR Code Foyer"
                    className="w-20 h-20 rounded-lg border border-orange-200 shadow-sm"
                  />
                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="text-xs font-bold text-slate-900">Scanner pour rejoindre</div>
                    <p className="text-[11px] text-slate-500">Scannez avec l'appareil photo d'un smartphone pour synchroniser le foyer.</p>
                    <button
                      onClick={() => {
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/login?code=${foyerCode}` : `https://familyflow-2.adil-eloualidi.workers.dev/login?code=${foyerCode}`;
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: 'Rejoindre FamilyFlow',
                            text: `Rejoins notre foyer familial ${familyName} :`,
                            url: url,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(url);
                          alert('Lien magique copié dans le presse-papier !');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#e76f51] hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow transition inline-flex items-center gap-1.5"
                    >
                      🔗 Partager le lien magique
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestion des Membres & Préférence Prières */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Membres et Préférences Prières
              </h3>
              <p className="text-xs text-slate-500">
                Activez ou désactivez les rappels de prière individuellement selon chaque membre.
              </p>

              <div className="divide-y divide-slate-100">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${member.avatarBg} flex items-center justify-center font-bold text-xs shadow-sm`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{member.name} ({member.role})</div>
                        <div className="text-[10px] text-slate-400">
                          {member.prayerEnabled ? '🔔 Prières actives' : '🔕 Prière désactivée'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePrayer(member.id)}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] transition ${
                        member.prayerEnabled 
                          ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {member.prayerEnabled ? 'Activé' : 'Désactivé'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ONGLET 5 : PARAMÈTRES & PWA */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Paramètres de l'application PWA</h2>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <div className="font-bold text-slate-800">Version installée</div>
                  <div className="text-slate-500">v2.5.0 (Cloudflare Pages)</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                  À jour
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">Notifications Push PWA</div>
                    <div className="text-slate-400">Alertes sur écran de veille</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                    className="accent-[#e76f51] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">Rappels de prière (20 min avant)</div>
                    <div className="text-slate-400">Notification discrète</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={prayerSoundEnabled}
                    onChange={(e) => setPrayerSoundEnabled(e.target.checked)}
                    className="accent-[#e76f51] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* BARRE DE NAVIGATION INFÉRIEURE (5 ONGLETS) */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200/80 px-2 py-2 flex justify-around items-center z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'tasks' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[10px] font-bold">Tâches</span>
        </button>

        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'shopping' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-[10px] font-bold">Courses</span>
        </button>

        <button
          onClick={() => setActiveTab('prayers')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'prayers' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[10px] font-bold">Prières</span>
        </button>

        <button
          onClick={() => setActiveTab('foyer')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'foyer' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-[10px] font-bold">Foyer</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 transition ${activeTab === 'settings' ? 'text-[#e76f51]' : 'text-slate-400'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold">Paramètres</span>
        </button>
      </nav>
    </div>
  );
}'use client';

import React, { useState, useEffect } from 'react';

interface Member {
  id: string;
  name: string;
  role: string;
  age?: string;
  prayerEnabled: boolean;
  avatarBg: string;
}

interface TaskItem {
  id: string;
  title: string;
  subtext: string;
  assignee: string;
  points: number;
  status: 'pending_validation' | 'in_progress' | 'to_do' | 'completed';
}

interface ShopItem {
  id: string;
  name: string;
  tag: string;
  qty: string;
}

interface CaddieItem {
  id: string;
  name: string;
  author: string;
  time: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shopping' | 'prayers' | 'foyer' | 'settings'>('tasks');
  const [points, setPoints] = useState(420);
  
  // Paramètres modifiables
  const [familyName, setFamilyName] = useState('Famille El Oualidi');
  const [foyerCode, setFoyerCode] = useState('FLOW-9824');
  const [prayerReminderMinutes, setPrayerReminderMinutes] = useState('20');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Membres du foyer modifiables
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Adil', role: 'Papa (Admin)', age: 'Adulte', prayerEnabled: true, avatarBg: 'bg-orange-100 text-[#e76f51]' },
    { id: '2', name: 'Sarah', role: 'Maman', age: 'Adulte', prayerEnabled: true, avatarBg: 'bg-teal-100 text-teal-800' },
    { id: '3', name: 'Yanis', role: 'Enfant', age: '10 ans', prayerEnabled: false, avatarBg: 'bg-cyan-100 text-cyan-800' },
    { id: '4', name: 'Lina', role: 'Enfant', age: '7 ans', prayerEnabled: false, avatarBg: 'bg-amber-100 text-amber-800' },
  ]);

  // Formulaire d'ajout de membre
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Enfant');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberPrayer, setNewMemberPrayer] = useState(false);

  // Liste de courses interactive
  const [shoppingItems, setShoppingItems] = useState<ShopItem[]>([
    { id: 's1', name: 'Courgettes', tag: 'Fruits & Légumes (Tajine)', qty: '3 pcs' },
    { id: 's2', name: 'Pommes Gala bio', tag: 'Fruits & Légumes', qty: '1 kg' },
    { id: 's3', name: 'Beurre doux de baratte', tag: 'Produits Laitiers', qty: '250g' },
    { id: 's4', name: 'Pain complet', tag: 'Boulangerie', qty: '1 miche' },
  ]);
  const [caddieItems, setCaddieItems] = useState<CaddieItem[]>([
    { id: 'c1', name: 'Épinards frais (500g)', author: 'Pris par Sarah', time: '15:10' }
  ]);
  const [newShopName, setNewShopName] = useState('');
  const [newShopTag, setNewShopTag] = useState('Fruits & Légumes');
  const [newShopQty, setNewShopQty] = useState('1');

  // Tâches
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', title: 'Ranger le lave-vaisselle', subtext: 'Terminée par Yanis à 15:45', assignee: 'Yanis', points: 20, status: 'pending_validation' },
    { id: 't2', title: 'Ranger la chambre & le bureau', subtext: 'Livres, jouets dans le coffre et lit fait', assignee: 'Yanis', points: 15, status: 'in_progress' },
    { id: 't3', title: 'Mettre la table pour le dîner', subtext: '4 assiettes, verres et couverts', assignee: 'Lina', points: 10, status: 'to_do' },
  ]);

  // Chargement / Sauvegarde LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMembers = localStorage.getItem('ff_members');
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      const savedFamily = localStorage.getItem('ff_family_name');
      if (savedFamily) setFamilyName(savedFamily);
      const savedPoints = localStorage.getItem('ff_points');
      if (savedPoints) setPoints(Number(savedPoints));
    }
  }, []);

  const saveMembers = (updated: Member[]) => {
    setMembers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ff_members', JSON.stringify(updated));
    }
  };

  // Basculer la prière d'un membre
  const toggleMemberPrayer = (id: string) => {
    const updated = members.map(m => m.id === id ? { ...m, prayerEnabled: !m.prayerEnabled } : m);
    saveMembers(updated);
  };

  // Supprimer un membre
  const deleteMember = (id: string) => {
    if (confirm("Supprimer ce membre du foyer ?")) {
      const updated = members.filter(m => m.id !== id);
      saveMembers(updated);
    }
  };

  // Ajouter un membre
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const colors = ['bg-orange-100 text-[#e76f51]', 'bg-teal-100 text-teal-800', 'bg-purple-100 text-purple-800', 'bg-rose-100 text-rose-800', 'bg-indigo-100 text-indigo-800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newM: Member = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      role: newMemberRole,
      age: newMemberAge.trim() || undefined,
      prayerEnabled: newMemberPrayer,
      avatarBg: randomColor
    };
    saveMembers([...members, newM]);
    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberPrayer(false);
    setShowAddMember(false);
  };

  // Validation d'une tâche par les parents
  const validateTask = (id: string, pts: number) => {
    setPoints(prev => {
      const np = prev + pts;
      if (typeof window !== 'undefined') localStorage.setItem('ff_points', np.toString());
      return np;
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
  };

  // Transférer un article au caddie
  const checkShopItem = (item: ShopItem) => {
    setShoppingItems(prev => prev.filter(i => i.id !== item.id));
    setCaddieItems(prev => [{
      id: item.id,
      name: `${item.name} (${item.qty})`,
      author: 'Pris en magasin',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);
  };

  // Ajouter un nouvel article de course
  const handleAddShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    setShoppingItems(prev => [...prev, {
      id: Date.now().toString(),
      name: newShopName.trim(),
      tag: newShopTag,
      qty: newShopQty || '1'
    }]);
    setNewShopName('');
  };

  const totalShop = shoppingItems.length + caddieItems.length;
  const shopPct = totalShop > 0 ? Math.round((caddieItems.length / totalShop) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-slate-800 flex flex-col font-sans pb-28 antialiased">
      {/* En-tête Fixe PWA */}
      <header className="sticky top-0 z-30 bg-[#fcf9f2]/95 backdrop-blur px-5 py-3 border-b border-orange-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#e76f51] flex items-center justify-center text-white font-bold shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-[#e76f51] uppercase">FamilyFlow</h1>
            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {familyName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1">
            ⭐ <span>{points}</span> pts
          </span>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-inner">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="flex-1 px-4 py-4 space-y-6">

        {/* ===================== 1. TÂCHES ===================== */}
        {activeTab === 'tasks' && (
          <section className="space-y-5">
            {/* Rappel Prochaine Prière */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">🌅</div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-200/60 px-2 py-0.5 rounded-full">
                    Dans {prayerReminderMinutes} min • 16:15
                  </span>
                  <h3 className="font-bold text-slate-900 mt-1">Salât Al-Asr en famille</h3>
                  <p className="text-xs text-slate-500">Membres notifiés : {members.filter(m => m.prayerEnabled).map(m => m.name).join(', ')}</p>
                </div>
              </div>
              <button onClick={() => alert('Rappel confirmé pour le foyer !')} className="px-3.5 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold shadow hover:bg-teal-800 transition">
                Prêt(e)
              </button>
            </div>

            {/* Filtres Membres */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
              <button className="px-3.5 py-1.5 bg-[#e76f51] text-white font-bold rounded-full shadow-sm whitespace-nowrap">
                Toute la famille ({members.length})
              </button>
              {members.map(m => (
                <button key={m.id} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-full whitespace-nowrap hover:bg-orange-50 transition">
                  {m.name} {m.age ? `(${m.age})` : ''}
                </button>
              ))}
            </div>

            {/* Validation Parentale */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Validation Parentale
                  <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter(t => t.status === 'pending_validation').length} en attente
                  </span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Espace Parents</span>
              </div>

              {tasks.filter(t => t.status === 'pending_validation').length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                  🎉 Aucune validation en attente. Tout est à jour !
                </div>
              ) : (
                tasks.filter(t => t.status === 'pending_validation').map(t => (
                  <div key={t.id} className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                          {t.assignee.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                          <p className="text-[11px] text-slate-500">{t.subtext}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">+{t.points} pts</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => alert('Demande retournée à l\'enfant pour révision')} className="flex-1 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition">
                        À corriger
                      </button>
                      <button onClick={() => validateTask(t.id, t.points)} className="flex-1 py-2 bg-[#e76f51] hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm transition">
                        Valider (+{t.points} pts)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tâches En cours */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> En cours & À faire
              </h2>
              <div className="space-y-2.5">
                {tasks.filter(t => t.status !== 'pending_validation').map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">{t.assignee} • +{t.points} pts</div>
                      <div className="font-bold text-slate-900 text-sm">{t.title}</div>
                      <div className="text-xs text-slate-400">{t.subtext}</div>
                    </div>
                    {t.status === 'completed' ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">✓ Validé</span>
                    ) : (
                      <button onClick={() => alert('Tâche terminée, envoyée aux parents !')} className="px-3 py-1.5 bg-[#e76f51] text-white text-xs font-bold rounded-xl shadow hover:bg-orange-600">
                        Terminé
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== 2. COURSES ===================== */}
        {activeTab === 'shopping' && (
          <section className="space-y-5">
            {/* Barre de progression */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Progression du caddie</h3>
                  <p className="text-xs text-slate-500">{caddieItems.length} sur {totalShop} articles pris</p>
                </div>
                <span className="text-xl font-black text-teal-700">{shopPct}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-300" style={{ width: `${shopPct}%` }}></div>
              </div>
            </div>

            {/* Formulaire d'ajout rapide d'un article */}
            <form onSubmit={handleAddShopItem} className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">➕ Ajouter un article à la liste</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Nom de l'article (ex: Bananes, Yaourts...)"
                  value={newShopName}
                  onChange={e => setNewShopName(e.target.value)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#e76f51] focus:outline-none col-span-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Qté (ex: 500g)"
                    value={newShopQty}
                    onChange={e => setNewShopQty(e.target.value)}
                    className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#e76f51] focus:outline-none"
                  />
                  <button type="submit" className="flex-1 bg-[#e76f51] hover:bg-orange-600 text-white font-bold rounded-xl py-2 shadow-sm transition">
                    Ajouter
                  </button>
                </div>
              </div>
            </form>

            {/* Articles à prendre */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Articles en rayon ({shoppingItems.length})</h4>
              {shoppingItems.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs font-bold">
                  ✓ Tous les articles sont dans le caddie ! Prêt pour la caisse.
                </div>
              ) : (
                shoppingItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => checkShopItem(item)}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#e76f51] shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center hover:border-teal-600 transition"></div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded inline-block font-semibold">{item.tag}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{item.qty}</span>
                  </div>
                ))
              )}
            </div>

            {/* Articles déjà dans le panier */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><span className="text-teal-600 font-black">✓</span> Dans le caddie</span>
                <span className="text-slate-400">{caddieItems.length} article(s)</span>
              </div>
              <div className="space-y-2">
                {caddieItems.map(c => (
                  <div key={c.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">✓</span>
                      <span className="text-xs line-through text-slate-500">{c.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{c.author}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== 3. PRIÈRES ===================== */}
        {activeTab === 'prayers' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Horaires des Prières • Paris</h2>
              <p className="text-xs text-slate-500 mb-4">Calcul officiel UOIF 15° • Rappel sonore {prayerReminderMinutes} min avant</p>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Fajr (Aube)', time: '06:12', active: false },
                  { name: 'Dhuhr (Midi)', time: '13:30', active: false },
                  { name: 'Asr (Après-midi)', time: '16:15', active: true },
                  { name: 'Maghrib (Coucher)', time: '18:45', active: false },
                  { name: 'Isha (Nuit)', time: '20:10', active: false },
                ].map(p => (
                  <div key={p.name} className={`flex justify-between items-center p-3 rounded-xl transition ${p.active ? 'bg-orange-100 border border-orange-300 font-bold text-orange-950' : 'bg-slate-50 text-slate-700'}`}>
                    <span>{p.name} {p.active ? '• Prochaine prière' : ''}</span>
                    <span className="text-sm font-bold">{p.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== 4. FOYER & MEMBRES (MODIFIABLE !) ===================== */}
        {activeTab === 'foyer' && (
          <section className="space-y-5">
            {/* Code Foyer */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Liaison du Foyer</h2>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-800">Code Foyer de synchronisation</div>
                  <div className="text-base font-black text-slate-900 tracking-wider">{foyerCode}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setFoyerCode('FLOW-' + Math.floor(1000 + Math.random() * 9000)); }} className="px-2.5 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200">
                    🔄 Régénérer
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(foyerCode); alert('Code foyer copié ! Partagez-le avec vos proches.'); }} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm">
                    Copier
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">Chaque membre saisit ce code sur son téléphone pour rejoindre ce tableau de bord.</p>
            </div>

            {/* Liste des membres avec gestion interactive */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Membres du Foyer ({members.length})</h3>
                  <p className="text-xs text-slate-400">Activez ou désactivez les rappels de prière par personne</p>
                </div>
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="px-3 py-1.5 bg-[#e76f51] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-orange-600 transition flex items-center gap-1"
                >
                  {showAddMember ? '✕ Fermer' : '➕ Nouveau membre'}
                </button>
              </div>

              {/* Formulaire d'ajout d'un membre */}
              {showAddMember && (
                <form onSubmit={handleAddMemberSubmit} className="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Ajouter une personne au foyer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Prénom (ex: Mohamed, Lina...)"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg focus:border-[#e76f51] focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newMemberRole}
                        onChange={e => setNewMemberRole(e.target.value)}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex-1 focus:border-[#e76f51] focus:outline-none"
                      >
                        <option value="Parent">Parent</option>
                        <option value="Enfant">Enfant</option>
                        <option value="Autre">Autre</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Âge (optionnel)"
                        value={newMemberAge}
                        onChange={e => setNewMemberAge(e.target.value)}
                        className="w-24 p-2.5 bg-white border border-slate-200 rounded-lg focus:border-[#e76f51] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMemberPrayer}
                        onChange={e => setNewMemberPrayer(e.target.checked)}
                        className="accent-[#e76f51] w-4 h-4 rounded"
                      />
                      <span className="font-semibold text-slate-700">Activer les rappels de prière pour ce membre</span>
                    </label>
                    <button type="submit" className="px-4 py-2 bg-[#e76f51] text-white font-bold rounded-lg shadow hover:bg-orange-600 transition">
                      Enregistrer le membre
                    </button>
                  </div>
                </form>
              )}

              {/* Liste réelle des membres avec toggles */}
              <div className="divide-y divide-slate-100">
                {members.map(member => (
                  <div key={member.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${member.avatarBg} flex items-center justify-center font-bold text-xs shadow-sm`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {member.name}
                          {member.age && <span className="text-[10px] font-normal text-slate-500">({member.age})</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">{member.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Interrupteur Prière */}
                      <button
                        onClick={() => toggleMemberPrayer(member.id)}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] transition flex items-center gap-1.5 ${member.prayerEnabled ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-400'}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${member.prayerEnabled ? 'bg-teal-600 animate-pulse' : 'bg-slate-300'}`}></span>
                        {member.prayerEnabled ? 'Prière Active' : 'Prière Désactivée'}
                      </button>

                      {/* Bouton supprimer */}
                      <button
                        onClick={() => deleteMember(member.id)}
                        title="Supprimer"
                        className="text-slate-300 hover:text-rose-500 p-1 transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================== 5. PARAMÈTRES (MODIFIABLE !) ===================== */}
        {activeTab === 'settings' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Paramètres du Foyer & Application</h2>
              
              {/* Modification du nom du foyer */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-slate-700">Nom du Foyer affiché :</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={familyName}
                    onChange={e => {
                      setFamilyName(e.target.value);
                      if (typeof window !== 'undefined') localStorage.setItem('ff_family_name', e.target.value);
                    }}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#e76f51] focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Réglage des rappels de prière */}
              <div className="space-y-1 text-xs pt-2">
                <label className="font-bold text-slate-700">Délai du rappel avant la prière :</label>
                <select
                  value={prayerReminderMinutes}
                  onChange={e => setPrayerReminderMinutes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#e76f51] focus:outline-none"
                >
                  <option value="10">10 minutes avant</option>
                  <option value="15">15 minutes avant</option>
                  <option value="20">20 minutes avant (Recommandé)</option>
                  <option value="30">30 minutes avant</option>
                </select>
              </div>

              {/* Alertes & Notifications */}
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Notifications Push PWA</div>
                    <div className="text-slate-400">Rappels en veille sur smartphone</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={e => setPushEnabled(e.target.checked)}
                    className="accent-[#e76f51] w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">Signal sonore / Vibreur</div>
                    <div className="text-slate-400">Lors des rappels de routine</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={e => setSoundEnabled(e.target.checked)}
                    className="accent-[#e76f51] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Version & Statut */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs mt-3">
                <div>
                  <div className="font-bold text-slate-800">Déploiement Cloudflare Pages</div>
                  <div className="text-slate-500">Mode PWA Connecté</div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">Opérationnel</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Barre de navigation inférieure (5 onglets réactifs) */}
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
