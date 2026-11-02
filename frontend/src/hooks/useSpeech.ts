import { useState, useRef, useCallback, useEffect } from 'react';

export type EarconType = 'warning' | 'turn' | 'success' | 'alert';
export type VoiceStatus = 'speaking' | 'enabled' | 'muted' | 'unavailable';

interface UseSpeechOptions {
  rate?: number;
  volume?: number;
  cooldownMs?: number;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { rate = 1.0, volume = 1.0, cooldownMs = 5000 } = options;

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSupported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  );

  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSpokenRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const rateRef = useRef<number>(rate);
  const volumeRef = useRef<number>(volume);
  const cooldownRef = useRef<number>(cooldownMs);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    cooldownRef.current = cooldownMs;
  }, [cooldownMs]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Audio API synthesized earcons (reliable, instant acoustic cues)
  const playEarcon = useCallback(
    (type: EarconType) => {
      if (isMuted || typeof window === 'undefined') return;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'warning') {
          // Urgent dual-tone alert (440Hz -> 880Hz)
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.28, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.35);
        } else if (type === 'turn') {
          // Navigation soft double ping (520Hz -> 659Hz)
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.setValueAtTime(659, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'success') {
          // Arrival / Ready melodic triad
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554, now + 0.1);
          osc.frequency.setValueAtTime(659, now + 0.2);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
        } else {
          // Subtle acoustic pulse
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        }
      } catch {
        // AudioContext blocked or unsupported
      }
    },
    [isMuted]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, priority: 'urgent' | 'normal' | 'repeat' = 'normal') => {
      if (isMuted || !speechSupported || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      if (!text || text.trim() === '') return;

      const now = Date.now();

      // Suppress repeated identical announcements within the cooldown window unless explicitly repeated or urgent
      if (
        priority === 'normal' &&
        lastSpokenRef.current.text === text &&
        now - lastSpokenRef.current.time < cooldownRef.current
      ) {
        return;
      }

      lastSpokenRef.current = { text, time: now };

      // Prevent speech queue buildup: clear any pending or stale utterances
      window.speechSynthesis.cancel();

      if (priority === 'urgent') {
        playEarcon('warning');
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rateRef.current;
      utterance.volume = volumeRef.current;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isMuted, speechSupported, playEarcon]
  );

  // Dedicated test voice function
  const speakTest = useCallback(() => {
    if (!speechSupported) return;
    playEarcon('success');
    // Test phrase is fixed, predictable, and clear
    speak('PathSight voice assistance is active and ready.', 'urgent');
  }, [speechSupported, speak, playEarcon]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  const setMuted = useCallback(
    (muted: boolean) => {
      if (muted) {
        stopSpeaking();
      }
      setIsMuted(muted);
    },
    [stopSpeaking]
  );

  // Compute composite voice status
  const voiceStatus: VoiceStatus = !speechSupported
    ? 'unavailable'
    : isMuted
    ? 'muted'
    : isSpeaking
    ? 'speaking'
    : 'enabled';

  return {
    voiceStatus,
    isMuted,
    isSpeaking,
    speechSupported,
    speak,
    speakTest,
    stopSpeaking,
    toggleMute,
    setMuted,
    playEarcon,
  };
}
