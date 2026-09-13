"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------
   Saisie vocale via l'API Web Speech (reconnaissance vocale du navigateur).
   Aucun service externe, aucune cle, aucun cout : tout se passe dans le
   navigateur. Support : Chrome, Edge, Safari et la plupart des navigateurs
   mobiles. Firefox ne l'implemente pas — le bouton se masque alors de lui-meme
   plutot que d'afficher une fonction qui ne repondrait pas.
   ------------------------------------------------------------------------- */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Micro refuse. Autorise l'acces au micro dans le navigateur.",
  "service-not-allowed": "Micro refuse par le navigateur.",
  "no-speech": "Je n'ai rien entendu, reessaie.",
  "audio-capture": "Aucun micro detecte.",
  network: "Reconnaissance vocale indisponible (reseau).",
  aborted: "",
};

export function useVoiceInput(onResult: (text: string) => void, onInterim?: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Les callbacks passent par une ref : la reconnaissance est creee une seule fois,
  // mais doit toujours appeler la derniere version des fonctions du composant.
  const handlersRef = useRef({ onResult, onInterim });
  handlersRef.current = { onResult, onInterim };

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += chunk;
        else interimText += chunk;
      }
      if (interimText) handlersRef.current.onInterim?.(interimText);
      if (finalText.trim()) handlersRef.current.onResult(finalText.trim());
    };

    recognition.onerror = (event) => {
      const message = ERRORS[event.error] ?? "Erreur de reconnaissance vocale.";
      if (message) setError(message);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    setError(null);
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() leve une exception si une session est deja en cours : on resynchronise.
      setListening(false);
    }
  }, [listening]);

  return { supported, listening, error, toggle };
}

/**
 * Bouton micro autonome. Rend `null` si le navigateur ne sait pas faire de
 * reconnaissance vocale, pour ne pas proposer une commande inerte.
 */
export function VoiceButton({
  onResult,
  onInterim,
  label = "Dicter",
  className = "",
}: {
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const { supported, listening, error, toggle } = useVoiceInput(onResult, onInterim);

  if (!supported) return null;

  return (
    <div className="flex flex-col items-stretch">
      <button
        type="button"
        onClick={toggle}
        className={`btn ${listening ? "listening" : ""} ${className}`}
        aria-pressed={listening}
        title={listening ? "Arreter l'ecoute" : "Dicter au micro"}
      >
        <span aria-hidden>{listening ? "⏺" : "🎙️"}</span>
        <span className="hidden sm:inline">{listening ? "J'ecoute…" : label}</span>
      </button>
      {error && <span className="text-[0.6875rem] text-bad mt-1 max-w-[14rem]">{error}</span>}
    </div>
  );
}

/** Message discret affiche la ou la dictee n'est pas disponible (Firefox, surtout). */
export function VoiceUnsupportedHint() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!getRecognitionCtor()), []);
  if (!show) return null;
  return (
    <p className="text-[0.6875rem] text-ink-faint mt-2">
      🎙️ La dictee vocale n'est pas disponible dans ce navigateur. Elle fonctionne dans Chrome, Edge et sur mobile.
    </p>
  );
}
