/**
 * Zestiquee Unified Voice Service
 * Handles:
 * 1. Speech-to-Text (STT) with hybrid browser Web Speech + server Gemini Multimodal Transcribe fallback
 * 2. Text-to-Speech (TTS) with Web Audio API decoding (bulletproof in iframes) + Gemini 3.8 Flash Lite TTS + browser SpeechSynthesis fallback
 * 3. Multilingual support (English, Telugu, Hindi, Tamil, etc.)
 * 4. Audio permission management, state tracking, and mute control
 */

import { getLanguage } from '../i18n/languages';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceServiceOptions {
  languageCode?: string;       // e.g. 'en', 'te', 'hi'
  speechLangCode?: string;     // e.g. 'en-US', 'te-IN', 'hi-IN'
  voiceName?: string;          // e.g. 'Kore', 'Puck', 'Fenrir'
  speechRate?: number;
  onStateChange?: (state: VoiceState) => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

class VoiceService {
  private state: VoiceState = 'idle';
  private isMuted: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private activeOptions: VoiceServiceOptions = {};
  private listeners: Set<(state: VoiceState) => void> = new Set();
  private lastSpokenText: string = '';
  private lastSpokenAudioBase64?: string;
  private browserSpeechFailedWithNetwork: boolean = false;
  private recordedTranscript: string = '';
  private hasFinalizedResult: boolean = false;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('zestiquee_voice_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  public subscribeState(listener: (state: VoiceState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    if (this.activeOptions.onStateChange) {
      this.activeOptions.onStateChange(newState);
    }
    this.listeners.forEach((l) => l(newState));
  }

  public getState(): VoiceState {
    return this.state;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('zestiquee_voice_muted', String(muted));
    } catch {}
    if (muted) {
      this.stopSpeaking();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Prime audio context on user gesture to avoid browser autoplay restrictions
   */
  public unlockAudioContext() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('AudioContext unlock notice:', e);
    }

    if ('speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (_) {}
    }
  }

  /**
   * Resolve full BCP-47 speech language code (e.g. 'te' -> 'te-IN')
   */
  public resolveSpeechLang(langOrCode?: string): string {
    if (!langOrCode) return 'en-US';
    if (langOrCode.includes('-')) return langOrCode;
    const l = getLanguage(langOrCode);
    return l.speechLangCode || 'en-US';
  }

  /* =========================================================
     SPEECH RECOGNITION (INPUT)
     ========================================================= */

  /**
   * Starts listening to user speech using a resilient dual-mode:
   * 1. MediaRecorder records high-fidelity audio chunks
   * 2. Web Speech API (if supported) provides live streaming text
   * 3. If Web Speech fails with "network" error (Google speech service blocked in iframe),
   *    the MediaRecorder audio is seamlessly sent to /api/assistant/transcribe.
   */
  public async startListening(options: VoiceServiceOptions = {}): Promise<void> {
    this.stopSpeaking();
    this.unlockAudioContext();
    this.activeOptions = options;
    this.browserSpeechFailedWithNetwork = false;
    this.recordedTranscript = '';
    this.hasFinalizedResult = false;
    this.audioChunks = [];

    // Check microphone availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Microphone access is not supported in this browser. Please type your message.';
      options.onError?.(err);
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      let errMsg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      } else if (err.name === 'NotFoundError') {
        errMsg = 'No microphone device was detected on your system.';
      }
      this.setState('idle');
      options.onError?.(errMsg);
      return;
    }

    this.setState('listening');

    // 1. Initialize MediaRecorder to safely capture audio data
    try {
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(this.mediaStream, { mimeType: selectedMime })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(200); // collect 200ms slices
    } catch (mrErr) {
      console.warn('MediaRecorder init error:', mrErr);
    }

    // 2. Initialize Web Speech API for fast streaming
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const speechLang = this.resolveSpeechLang(options.speechLangCode || options.languageCode || 'en');

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = speechLang;

        let accumulated = '';

        recognition.onstart = () => {
          this.setState('listening');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulated += piece;
            } else {
              interim += piece;
            }
          }
          const liveText = (accumulated + ' ' + interim).trim();
          if (liveText) {
            this.recordedTranscript = liveText;
            options.onInterimResult?.(liveText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Browser SpeechRecognition event code:', event.error);
          if (event.error === 'network') {
            // Note network error silently; MediaRecorder will send audio to Gemini transcribe
            this.browserSpeechFailedWithNetwork = true;
          } else if (event.error === 'not-allowed') {
            options.onError?.('Microphone permission was denied by browser settings.');
          }
        };

        recognition.onend = () => {
          if (this.recordedTranscript.trim() && !this.browserSpeechFailedWithNetwork) {
            this.handleRecognitionComplete(this.recordedTranscript.trim());
          }
        };

        this.recognition = recognition;
        recognition.start();
      } catch (recErr) {
        console.warn('Web Speech Recognition start error:', recErr);
      }
    }
  }

  /**
   * Stop listening and finalize transcript (sending audio to server if needed)
   */
  public async stopListening(): Promise<string> {
    if (this.state !== 'listening') return this.recordedTranscript || '';

    this.setState('thinking');

    // Stop Web Speech Recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    // Request remaining audio data & stop MediaRecorder
    let audioBlob: Blob | null = null;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      audioBlob = await new Promise<Blob>((resolve) => {
        if (!this.mediaRecorder) return resolve(new Blob([]));
        this.mediaRecorder.onstop = () => {
          const mime = this.mediaRecorder?.mimeType || 'audio/webm';
          resolve(new Blob(this.audioChunks, { type: mime }));
        };
        try {
          if (typeof this.mediaRecorder.requestData === 'function') {
            this.mediaRecorder.requestData();
          }
          this.mediaRecorder.stop();
        } catch (_) {
          resolve(new Blob(this.audioChunks, { type: 'audio/webm' }));
        }
      });
    }

    // Stop microphone tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // If browser speech recognition already successfully captured text, use it
    if (this.recordedTranscript.trim() && !this.browserSpeechFailedWithNetwork) {
      const text = this.recordedTranscript.trim();
      this.handleRecognitionComplete(text);
      return text;
    }

    // If we have recorded audio chunks, transcribe via server Gemini models
    if (audioBlob && audioBlob.size > 50) {
      try {
        const transcript = await this.transcribeAudioOnServer(
          audioBlob,
          this.activeOptions.languageCode || 'en'
        );

        if (transcript && transcript.trim()) {
          const cleaned = transcript.trim();
          this.handleRecognitionComplete(cleaned);
          return cleaned;
        }
      } catch (err: any) {
        console.warn('Server audio transcription notice:', err);
      }
    }

    // If no text was recognized
    this.setState('idle');
    return '';
  }

  private handleRecognitionComplete(transcript: string) {
    if (this.hasFinalizedResult) return;
    this.hasFinalizedResult = true;
    this.recordedTranscript = transcript;
    this.setState('idle');
    this.activeOptions.onFinalResult?.(transcript);
  }

  private async transcribeAudioOnServer(audioBlob: Blob, language: string): Promise<string> {
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const b64 = res.split(',')[1] || res;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const response = await fetch('/api/assistant/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType: audioBlob.type || 'audio/webm',
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.transcript) {
      return data.transcript.trim();
    }
    return '';
  }

  /* =========================================================
     TEXT-TO-SPEECH (OUTPUT)
     ========================================================= */

  /**
   * Speaks the provided text audibly.
   * Priority 1: Direct Gemini TTS audio decoded via Web Audio API (bypasses iframe autoplay blocks)
   * Priority 2: Server /api/assistant/tts (Gemini 3.8 Flash Lite TTS)
   * Priority 3: Native browser SpeechSynthesis with language matching & resume ping
   */
  public async speak(
    text: string,
    options: {
      audioBase64?: string;
      languageCode?: string;
      voiceName?: string;
      speechRate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<boolean> {
    this.stopSpeaking();
    this.lastSpokenText = text;
    this.lastSpokenAudioBase64 = options.audioBase64;

    if (this.isMuted) {
      options.onEnd?.();
      return false;
    }

    if (!text || !text.trim()) {
      options.onEnd?.();
      return false;
    }

    this.unlockAudioContext();
    this.setState('speaking');

    // 1. If base64 audio already provided
    if (options.audioBase64) {
      const played = await this.playBase64Audio(options.audioBase64, options.onStart, options.onEnd);
      if (played) return true;
    }

    // 2. Fetch server-side Gemini 3.8 Flash Lite TTS
    try {
      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: options.voiceName || 'Kore',
          languageCode: options.languageCode || 'en',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.audioBase64) {
          this.lastSpokenAudioBase64 = data.audioBase64;
          const played = await this.playBase64Audio(data.audioBase64, options.onStart, options.onEnd);
          if (played) return true;
        }
      }
    } catch (e) {
      console.warn('Server TTS fetch failed, falling back to browser speech synthesis:', e);
    }

    // 3. Fallback to Browser SpeechSynthesis with accurate language pronunciation
    return this.speakWithBrowserSpeech(text, options);
  }

  /**
   * Play base64 audio with Web Audio API (bypasses HTML5 audio autoplay restrictions in iframes)
   */
  private async playBase64Audio(
    base64: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    const cleanB64 = base64.replace(/^data:[^;]+;base64,/, '');

    // Attempt 1: Web Audio API AudioBufferSourceNode
    try {
      this.unlockAudioContext();
      if (this.audioContext) {
        const binaryString = window.atob(cleanB64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = await this.audioContext.decodeAudioData(bytes.buffer.slice(0));
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        this.setState('speaking');
        onStart?.();

        source.onended = () => {
          this.currentAudioSource = null;
          this.setState('idle');
          onEnd?.();
        };

        this.currentAudioSource = source;
        source.start(0);
        return true;
      }
    } catch (webAudioErr) {
      console.warn('Web Audio decode failed, attempting HTMLAudioElement fallback:', webAudioErr);
    }

    // Attempt 2: HTMLAudioElement fallback
    return new Promise((resolve) => {
      try {
        const audioSrc = `data:audio/wav;base64,${cleanB64}`;
        const audio = new Audio(audioSrc);
        this.currentAudio = audio;

        audio.onplay = () => {
          this.setState('speaking');
          onStart?.();
        };

        audio.onended = () => {
          this.currentAudio = null;
          this.setState('idle');
          onEnd?.();
          resolve(true);
        };

        audio.onerror = (e) => {
          console.warn('Audio element error during playback:', e);
          this.currentAudio = null;
          resolve(false);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play promise rejected:', err);
            this.currentAudio = null;
            resolve(false);
          });
        }
      } catch (err) {
        console.warn('Audio construction error:', err);
        this.currentAudio = null;
        resolve(false);
      }
    });
  }

  private speakWithBrowserSpeech(
    text: string,
    options: {
      languageCode?: string;
      speechRate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): boolean {
    if (!('speechSynthesis' in window)) {
      this.setState('idle');
      options.onEnd?.();
      return false;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      // Clean markdown characters (*, #, _, `, etc.)
      const cleanText = text
        .replace(/[*#_`~>]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = this.resolveSpeechLang(options.languageCode || 'en');
      utterance.lang = targetLang;
      utterance.rate = options.speechRate || 1.0;

      // Match best voice for requested language (e.g. Telugu, Hindi, English)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langPrefix = targetLang.split('-')[0].toLowerCase();
        const bestVoice =
          voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
          voices.find((v) => v.name.toLowerCase().includes(langPrefix));
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
      }

      utterance.onstart = () => {
        this.setState('speaking');
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.setState('idle');
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.currentUtterance = null;
        this.setState('idle');
        options.onError?.(e);
        options.onEnd?.();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      return true;
    } catch (err) {
      console.warn('SpeechSynthesis invocation error:', err);
      this.setState('idle');
      options.onEnd?.();
      return false;
    }
  }

  public stopSpeaking() {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
        this.currentAudioSource.disconnect();
      } catch (_) {}
      this.currentAudioSource = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      this.currentUtterance = null;
    }

    if (this.state === 'speaking') {
      this.setState('idle');
    }
  }

  public replayLast(languageCode: string = 'en') {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, {
        audioBase64: this.lastSpokenAudioBase64,
        languageCode,
      });
    }
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }
}

export const voiceService = new VoiceService();
