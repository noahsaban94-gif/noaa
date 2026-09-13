import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Sliders,
  Radio,
  Headphones,
  Check,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChevronDown,
  Info
} from 'lucide-react';
import { Order } from '../types';
import {
  CURATED_FEMALE_VOICE_PRESETS,
  FemaleVoiceOption,
  generateVoiceSummaryScript,
  getAvailableHebrewVoices,
  isLikelyFemaleVoice,
  VoiceSummaryScript,
} from '../lib/speechService';

interface VoiceSummaryPlayerProps {
  orders: Order[];
  dateStr: string;
}

export const VoiceSummaryPlayer: React.FC<VoiceSummaryPlayerProps> = ({
  orders,
  dateStr,
}) => {
  // Speech script generated for Noa AI
  const script: VoiceSummaryScript = useMemoScript(orders, dateStr);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Voice selection repository
  const [availableSystemVoices, setAvailableSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoicePresetId, setSelectedVoicePresetId] = useState<string>('noa-warm');
  const [selectedSystemVoiceURI, setSelectedSystemVoiceURI] = useState<string>('');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [pitchBoost, setPitchBoost] = useState<number>(1.18); // Default feminine tone
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [testVoiceSuccess, setTestVoiceSuccess] = useState(false);

  // Keep reference to active utterance to prevent Chromium garbage collection
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<any>(null);

  // Detect voices on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const hebVoices = getAvailableHebrewVoices();
      setAvailableSystemVoices(hebVoices);

      // Auto-select best Hebrew system voice if available
      if (hebVoices.length > 0) {
        const femaleSysVoice = hebVoices.find((v) => isLikelyFemaleVoice(v)) || hebVoices[0];
        setSelectedSystemVoiceURI(femaleSysVoice.voiceURI);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      stopSpeech();
    };
  }, []);

  // Update pitch and rate when preset changes
  const handleSelectPreset = (preset: FemaleVoiceOption) => {
    setSelectedVoicePresetId(preset.id);
    setPitchBoost(preset.pitch);
    setPlaybackRate(preset.rate);
  };

  // Find active system voice to pass to utterance
  const getSelectedSystemVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (availableSystemVoices.length === 0) return null;
    if (selectedSystemVoiceURI) {
      const match = availableSystemVoices.find((v) => v.voiceURI === selectedSystemVoiceURI);
      if (match) return match;
    }
    // Fallback to any Hebrew voice
    return availableSystemVoices[0] || null;
  }, [availableSystemVoices, selectedSystemVoiceURI]);

  // Clean stop
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSectionIndex(-1);
  };

  // Chromium fix: SpeechSynthesis pauses after ~15 seconds without activity
  const startKeepAlive = () => {
    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
    keepAliveIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };

  // Play full summary or specific section
  const playSpeech = (sectionIdx?: number) => {
    if (!speechSupported) return;

    // If currently paused and resuming the same, call resume
    if (isPaused && sectionIdx === undefined) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Otherwise cancel existing and start fresh
    window.speechSynthesis.cancel();

    const textToSpeak =
      sectionIdx !== undefined && script.sections[sectionIdx]
        ? `${script.sections[sectionIdx].title}. ${script.sections[sectionIdx].text}`
        : script.fullText;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Configure Hebrew language
    utterance.lang = 'he-IL';
    utterance.rate = playbackRate;
    utterance.pitch = pitchBoost;

    // Apply specific system voice if available
    const sysVoice = getSelectedSystemVoice();
    if (sysVoice) {
      utterance.voice = sysVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (sectionIdx !== undefined) {
        setActiveSectionIndex(sectionIdx);
      } else {
        setActiveSectionIndex(0);
      }
      startKeepAlive();
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSectionIndex(-1);
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis event error:', e);
      setIsPlaying(false);
      setIsPaused(false);
      setActiveSectionIndex(-1);
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
    };

    // Track section progression approximately via boundary events or start
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  // Preview test voice
  const testVoiceSample = () => {
    if (!speechSupported) return;
    window.speechSynthesis.cancel();
    const sampleText = 'שלום, כאן נועה AI. קול זה ישמש לתדריך הבוקר הלוגיסטי של חברת ח. סבן.';
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = 'he-IL';
    utterance.rate = playbackRate;
    utterance.pitch = pitchBoost;
    const sysVoice = getSelectedSystemVoice();
    if (sysVoice) utterance.voice = sysVoice;

    utterance.onstart = () => setTestVoiceSuccess(true);
    utterance.onend = () => setTimeout(() => setTestVoiceSuccess(false), 2000);
    window.speechSynthesis.speak(utterance);
  };

  if (!speechSupported) {
    return (
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <span>הדפדפן הנוכחי אינו תומך בהקראת קול (Web Speech API). מומלץ להשתמש ב-Google Chrome, Edge או Safari.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Player Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-rose-600 to-indigo-700 text-white p-5 shadow-lg">
        {/* Ambient background decoration */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner flex-shrink-0">
              {isPlaying && !isPaused ? (
                <Radio className="w-6 h-6 text-amber-200 animate-pulse" />
              ) : (
                <Headphones className="w-6 h-6 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>סיכום קולי — נועה AI</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white border border-white/30">
                  Web Speech עברית
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5">
                הקראה קולית מקצועית של סידור העבודה, משימות הנהגים ודגשי הפקדונות למנהל הלוגיסטיקה
              </p>
            </div>
          </div>

          {/* Master Play / Pause Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {isPlaying && !isPaused ? (
              <button
                type="button"
                onClick={pauseSpeech}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-md hover:bg-slate-50 transition active:scale-95"
              >
                <Pause className="w-4 h-4 text-rose-600" />
                <span>השהה הקראה</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => playSpeech()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-md hover:bg-slate-50 transition active:scale-95"
              >
                <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>{isPaused ? 'המשך הקראה' : 'השמע דוח בוקר מלא 🎙️'}</span>
              </button>
            )}

            {(isPlaying || isPaused) && (
              <button
                type="button"
                onClick={stopSpeech}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition active:scale-95"
                title="עצור לחלוטין"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>עצור</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs border transition active:scale-95 ${
                showVoiceSettings
                  ? 'bg-white text-slate-900 border-white'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>הגדרות קול ומאגר נשי</span>
            </button>
          </div>
        </div>

        {/* Audio Waveform Animation when playing */}
        {isPlaying && !isPaused && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-3 text-xs text-white/90">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold">נועה AI מקריאה כעת את דוח הבוקר...</span>
            </div>

            <div className="flex items-end gap-1 h-5">
              {[0.4, 0.8, 0.5, 0.9, 0.6, 1.0, 0.7, 0.4, 0.8, 0.6, 0.9, 0.5].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-white rounded-full transition-all duration-300 animate-pulse"
                  style={{
                    height: `${Math.round(h * 20)}px`,
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Selection & Settings Drawer */}
      {showVoiceSettings && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>מאגר קולות בעברית נשית (Female Hebrew Voice Presets)</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              </span>
            </div>
            <button
              type="button"
              onClick={testVoiceSample}
              className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition flex items-center gap-1 active:scale-95"
            >
              {testVoiceSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{testVoiceSuccess ? 'מושמע כעת...' : 'בדיקת קול דוגמה'}</span>
            </button>
          </div>

          {/* Voice Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CURATED_FEMALE_VOICE_PRESETS.map((preset) => {
              const isSelected = selectedVoicePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-right ${
                    isSelected
                      ? 'bg-white border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                      : 'bg-white/70 hover:bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-black text-slate-800">{preset.name}</span>
                    </div>
                    {preset.isRecommended && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800">
                        ברירת מחדל
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 mr-5">{preset.description}</p>
                </div>
              );
            })}
          </div>

          {/* System Hebrew Voices Detection */}
          {availableSystemVoices.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                מנוע קול עברי מותקן במערכת ההפעלה / דפדפן:
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedSystemVoiceURI}
                  onChange={(e) => setSelectedSystemVoiceURI(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  {availableSystemVoices.map((v) => {
                    const femaleHint = isLikelyFemaleVoice(v) ? '🌸 (קול נשי)' : '';
                    return (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}) {femaleHint}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                זוהו {availableSystemVoices.length} קולות עבריים בדפדפן. נועה AI מכיילת את הטון והגובה (Pitch)
                להשגת צליל נשי טבעי ומזמין.
              </p>
            </div>
          )}

          {/* Speed & Pitch Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/80">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>מהירות דיבור (קצב):</span>
                <span className="text-rose-600 font-mono font-black">{playbackRate.toFixed(2)}x</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0.85, 1.0, 1.15, 1.3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPlaybackRate(r)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      playbackRate === r
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>גובה צליל נשי (Pitch Tuning):</span>
                <span className="text-indigo-600 font-mono font-black">{pitchBoost.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.9"
                max="1.5"
                step="0.05"
                value={pitchBoost}
                onChange={(e) => setPitchBoost(parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>טבעי / עמוק (0.9)</span>
                <span>נועה AI מאוזן (1.18)</span>
                <span>גבוה ובהיר (1.5)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Spoken Sections Transcript Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
            <span>פסקאות התדריך להשמעה נפרדת</span>
            <span className="text-[11px] text-slate-400 font-normal">
              (ניתן להקליק על כל פסקה כדי להשמיע אותה ישירות)
            </span>
          </h4>
          <span className="text-[11px] font-bold text-slate-500">
            {orders.length} משימות • {script.sections.length} מקטעי דיבוב
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {script.sections.map((section, idx) => {
            const isThisSectionActive = activeSectionIndex === idx && isPlaying;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isThisSectionActive
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20 shadow-sm'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          isThisSectionActive
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <h5 className="text-xs font-black text-slate-900">{section.title}</h5>
                      {isThisSectionActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 animate-pulse">
                          מקריא כעת...
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {section.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => playSpeech(idx)}
                    className={`flex-shrink-0 p-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 ${
                      isThisSectionActive
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="השמע פסקה זו בלבד"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">השמע</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function useMemoScript(orders: Order[], dateStr: string): VoiceSummaryScript {
  return React.useMemo(() => {
    return generateVoiceSummaryScript(orders, dateStr);
  }, [orders, dateStr]);
}
