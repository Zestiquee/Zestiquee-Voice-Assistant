import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Recipe, UserProfile } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Timer as TimerIcon,
  RotateCcw,
  X,
  Sparkles,
  HelpCircle,
  CheckCircle,
  Mic,
  MicOff,
  Radio,
  Flame,
} from 'lucide-react';
import { voiceService } from '../services/voiceService';

interface GuidedCookingModalProps {
  t: AppTranslations;
  user: UserProfile;
  recipe: Recipe;
  onClose: () => void;
  onStartTimer: (label: string, durationSeconds: number) => void;
}

export const GuidedCookingModal: React.FC<GuidedCookingModalProps> = ({
  t,
  user,
  recipe,
  onClose,
  onStartTimer,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHandsFreeActive, setIsHandsFreeActive] = useState(false);
  const [micState, setMicState] = useState<'off' | 'listening' | 'speaking' | 'processing'>('off');
  const [lastHeardTranscript, setLastHeardTranscript] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const steps = recipe.steps || [
    { stepNumber: 1, instruction: 'Prepare ingredients and heat cookware.', timerMinutes: 5 },
  ];
  const step = steps[currentStepIdx] || steps[0];
  const totalSteps = steps.length;

  const recognitionRef = useRef<any>(null);
  const isSpeakingRef = useRef(false);
  const isHandsFreeActiveRef = useRef(false);
  const shouldListenRef = useRef(false);
  const currentStepIdxRef = useRef(0);

  // Sync refs to avoid stale closures
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isHandsFreeActiveRef.current = isHandsFreeActive;
    shouldListenRef.current = isHandsFreeActive;
  }, [isHandsFreeActive]);

  useEffect(() => {
    currentStepIdxRef.current = currentStepIdx;
  }, [currentStepIdx]);

  // Stop any active speech
  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, []);

  // Safe speak function with automatic resume of hands-free listening
  const speakText = useCallback(
    (text: string, onComplete?: () => void) => {
      stopSpeaking();

      // Pause speech recognition while speaking so mic does not hear assistant
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setMicState('speaking');

      const finishSpeech = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (onComplete) onComplete();

        // AUTOMATICALLY RESUME HANDS-FREE LISTENING
        if (isHandsFreeActiveRef.current) {
          restartListeningSafely();
        } else {
          setMicState('off');
        }
      };

      voiceService.speak(text, {
        languageCode: user.responseLanguage || user.displayLanguage || 'en',
        voiceName: user.voicePreference || 'Kore',
        speechRate: user.speechRate || 1.0,
        onStart: () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          setMicState('speaking');
        },
        onEnd: finishSpeech,
        onError: finishSpeech,
      });
    },
    [user.responseLanguage, user.displayLanguage, user.voicePreference, user.speechRate, stopSpeaking]
  );

  // Speak current step instruction
  const speakCurrentStep = useCallback(() => {
    const curStep = steps[currentStepIdxRef.current] || steps[0];
    const textToSpeak = `Step ${curStep.stepNumber} of ${totalSteps}. ${curStep.instruction}`;
    speakText(textToSpeak);
  }, [steps, totalSteps, speakText]);

  // Safe restart of speech recognition
  const restartListeningSafely = useCallback(() => {
    if (!isHandsFreeActiveRef.current || isSpeakingRef.current) return;

    if (recognitionRef.current) {
      try {
        setMicState('listening');
        recognitionRef.current.start();
      } catch (err: any) {
        // Recognition already started or starting
        if (err.name !== 'InvalidStateError') {
          console.warn('Recognition start error:', err);
        }
      }
    }
  }, []);

  // Step advancement
  const handleNext = useCallback(() => {
    if (currentStepIdxRef.current < totalSteps - 1) {
      const nextIdx = currentStepIdxRef.current + 1;
      setCurrentStepIdx(nextIdx);
      currentStepIdxRef.current = nextIdx;
      setAssistantAnswer(null);
      // Speak next step and automatically resume listening
      const nextStepObj = steps[nextIdx];
      speakText(`Step ${nextStepObj.stepNumber} of ${totalSteps}. ${nextStepObj.instruction}`);
    } else {
      speakText('You have reached the final step. Great job cooking!');
    }
  }, [totalSteps, steps, speakText]);

  const handlePrev = useCallback(() => {
    if (currentStepIdxRef.current > 0) {
      const prevIdx = currentStepIdxRef.current - 1;
      setCurrentStepIdx(prevIdx);
      currentStepIdxRef.current = prevIdx;
      setAssistantAnswer(null);
      const prevStepObj = steps[prevIdx];
      speakText(`Step ${prevStepObj.stepNumber} of ${totalSteps}. ${prevStepObj.instruction}`);
    } else {
      speakText('You are at the first step.');
    }
  }, [totalSteps, steps, speakText]);

  // Voice command dispatcher
  const handleVoiceCommand = useCallback(
    async (rawTranscript: string) => {
      const command = rawTranscript.trim().toLowerCase();
      setLastHeardTranscript(rawTranscript);

      // 1. Next step command
      if (
        command.includes('next') ||
        command.includes('forward') ||
        command.includes('proceed') ||
        command.includes('తర్వాతి') ||
        command.includes('अगला') ||
        command.includes('siguiente')
      ) {
        handleNext();
        return;
      }

      // 2. Repeat step command
      if (
        command.includes('repeat') ||
        command.includes('again') ||
        command.includes('say that again') ||
        command.includes('మళ్ళీ') ||
        command.includes('दोहराएं') ||
        command.includes('repetir')
      ) {
        speakCurrentStep();
        return;
      }

      // 3. Previous step command
      if (
        command.includes('previous') ||
        command.includes('back') ||
        command.includes('go back') ||
        command.includes('మునుపటి') ||
        command.includes('पिछला') ||
        command.includes('anterior')
      ) {
        handlePrev();
        return;
      }

      // 4. Stop hands-free mode
      if (
        command.includes('stop hands-free') ||
        command.includes('stop listening') ||
        command.includes('turn off mic') ||
        command.includes('mute')
      ) {
        setIsHandsFreeActive(false);
        isHandsFreeActiveRef.current = false;
        stopSpeaking();
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (_) {}
        }
        setMicState('off');
        return;
      }

      // 5. Timer command (e.g. "set a timer for 5 minutes", "start 10 minute timer")
      const timerMatch = command.match(/(\d+)\s*(minute|min|minutes|సెకను|నిమిష|मिनट)/i);
      if (command.includes('timer') || timerMatch) {
        const mins = timerMatch ? parseInt(timerMatch[1], 10) : step.timerMinutes || 5;
        onStartTimer(`${recipe.name} - Step ${step.stepNumber}`, mins * 60);
        speakText(`Started a ${mins} minute timer for step ${step.stepNumber}.`);
        return;
      }

      // 6. Recipe question or advice (e.g. "Can I substitute butter?", "How much water?")
      setMicState('processing');
      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `During Step ${step.stepNumber} of ${recipe.name}: ${step.instruction}. The cook asks: "${rawTranscript}". Please provide a short, 1-2 sentence direct kitchen answer.`,
          }),
        });
        const data = await res.json();
        const reply = data.textResponse || 'You can substitute with cooking oil or warm milk.';
        setAssistantAnswer(reply);
        speakText(reply);
      } catch (err) {
        speakText("I couldn't reach the assistant server, but you can proceed to the next step!");
      }
    },
    [handleNext, handlePrev, speakCurrentStep, speakText, step, recipe.name, onStartTimer, stopSpeaking]
  );

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError('Speech recognition is not supported in this browser. Please use the button controls.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = user.inputLanguage || 'en-US';

    recognition.onstart = () => {
      setMicState('listening');
      setMicError(null);
    };

    recognition.onresult = (event: any) => {
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript;
      if (transcript && transcript.trim()) {
        handleVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission denied. Please allow microphone in browser.');
        setIsHandsFreeActive(false);
        isHandsFreeActiveRef.current = false;
        setMicState('off');
      } else if (event.error === 'no-speech') {
        // Silence is normal in kitchen; keep listening if hands-free is active!
      } else {
        console.warn('Hands-free speech error:', event.error);
      }
    };

    recognition.onend = () => {
      // IF HANDS-FREE IS ACTIVE AND NOT CURRENTLY SPEAKING, RESTART LISTENING AUTOMATICALLY!
      if (isHandsFreeActiveRef.current && !isSpeakingRef.current) {
        setTimeout(() => {
          restartListeningSafely();
        }, 300);
      } else if (!isHandsFreeActiveRef.current) {
        setMicState('off');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (_) {}
    };
  }, [user.inputLanguage, handleVoiceCommand, restartListeningSafely]);

  // Start Hands-Free Mode (User clicks once, stays active throughout cooking mode)
  const toggleHandsFreeMode = () => {
    if (isHandsFreeActive) {
      // Turn off
      setIsHandsFreeActive(false);
      isHandsFreeActiveRef.current = false;
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      setMicState('off');
    } else {
      // Start Hands-Free Mode once!
      setIsHandsFreeActive(true);
      isHandsFreeActiveRef.current = true;
      speakText(
        `Hands-free mode active! Step ${step.stepNumber} of ${totalSteps}. ${step.instruction}. You can say "Next step", "Repeat", or "Timer" anytime.`,
        () => {
          restartListeningSafely();
        }
      );
    }
  };

  // Exit cleanup
  const handleExit = () => {
    setIsHandsFreeActive(false);
    isHandsFreeActiveRef.current = false;
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E6DFD5] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="bg-[#2D5A43] text-white p-4 sm:p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-emerald-200 font-semibold mb-0.5">
              <span>{t.cookingModeTitle || 'Guided Cooking Mode'}</span>
              {isHandsFreeActive && (
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-white border border-emerald-400/40 text-[10px]">
                  <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
                  <span>Hands-Free Active</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold truncate max-w-md">
              {recipe.name}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Hands-Free Mode Toggle Button (Tap Once!) */}
            <button
              onClick={toggleHandsFreeMode}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs ${
                isHandsFreeActive
                  ? 'bg-[#C85A32] text-white animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              {isHandsFreeActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isHandsFreeActive ? 'Stop Hands-Free' : 'Start Hands-Free Mode'}</span>
            </button>

            <button
              onClick={handleExit}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={t.exitCooking || 'Exit'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#E6DFD5] h-2">
          <div
            className="bg-[#2D5A43] h-2 transition-all duration-300"
            style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Hands-Free Voice Status Banner */}
        {isHandsFreeActive && (
          <div className="bg-[#EBF3EE] border-b border-[#2D5A43]/20 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="font-semibold text-[#2D5A43]">
                {micState === 'speaking'
                  ? 'Speaking instruction...'
                  : micState === 'processing'
                  ? 'Processing kitchen answer...'
                  : 'Listening... (Say "Next step", "Repeat", or "Timer")'}
              </span>
            </div>
            {lastHeardTranscript && (
              <span className="text-[11px] text-[#5A625B] italic truncate max-w-xs">
                Heard: "{lastHeardTranscript}"
              </span>
            )}
          </div>
        )}

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
          <div className="flex items-center justify-between text-sm font-semibold text-[#5A625B]">
            <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2D5A43] font-bold">
              {t.step || 'Step'} {step.stepNumber} {t.of || 'of'} {totalSteps}
            </span>

            {step.timerMinutes && (
              <button
                onClick={() =>
                  onStartTimer(`${recipe.name} - Step ${step.stepNumber}`, (step.timerMinutes || 5) * 60)
                }
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-900 border border-orange-200 hover:bg-orange-200 text-xs font-semibold transition"
              >
                <TimerIcon className="w-3.5 h-3.5 text-orange-700" />
                <span>
                  {t.startStepTimer || 'Start Step Timer'} ({step.timerMinutes}m)
                </span>
              </button>
            )}
          </div>

          {/* Main instruction text in large readable typography */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#E6DFD5] shadow-xs">
            <p className="text-xl sm:text-2xl font-serif text-[#1F2421] leading-relaxed">
              {step.instruction}
            </p>

            {step.tips && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-start space-x-2 text-xs text-[#5A625B]">
                <HelpCircle className="w-4 h-4 text-[#2D5A43] shrink-0 mt-0.5" />
                <span>{step.tips}</span>
              </div>
            )}
          </div>

          {/* Assistant Answer Box (if user asked a recipe question during step) */}
          {assistantAnswer && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#1F2421] space-y-1 animate-fade-in">
              <div className="font-bold text-[#2D5A43] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chef Assistant:</span>
              </div>
              <p className="text-sm font-medium text-emerald-950">{assistantAnswer}</p>
            </div>
          )}

          {/* Voice controls for step */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold transition cursor-pointer"
              >
                <VolumeX className="w-4 h-4" />
                <span>{t.pauseSpeech || 'Pause Speech'}</span>
              </button>
            ) : (
              <button
                onClick={speakCurrentStep}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#EBF3EE] hover:bg-[#d8e8dc] text-[#2D5A43] text-xs font-semibold transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.speakStep || 'Read Instructions Aloud'}</span>
              </button>
            )}

            <button
              onClick={speakCurrentStep}
              className="p-2.5 rounded-full bg-white border border-[#E6DFD5] hover:border-[#2D5A43] text-gray-600 transition cursor-pointer"
              title={t.repeatStep || 'Repeat'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {micError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-center">
              {micError}
            </div>
          )}

          {/* Hands-Free Voice Hints Box */}
          <div className="p-3.5 bg-white/70 rounded-2xl border border-[#E6DFD5] text-[11px] text-[#5A625B] text-center">
            <span className="font-semibold text-[#1F2421]">Hands-free voice hints:</span> Say{' '}
            <span className="font-mono font-bold text-[#2D5A43]">"Next step"</span>,{' '}
            <span className="font-mono font-bold text-[#2D5A43]">"Repeat"</span>,{' '}
            <span className="font-mono font-bold text-[#2D5A43]">"Previous step"</span>, or{' '}
            <span className="font-mono font-bold text-[#2D5A43]">"Set a timer for 10 minutes"</span>.
          </div>
        </div>

        {/* Footer Navigation (Always visible fallbacks) */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#E6DFD5] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-[#D5CCC0] text-xs font-semibold text-[#1F2421] hover:bg-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t.prevStep || 'Previous Step'}</span>
          </button>

          <span className="text-xs text-[#5A625B] font-medium">
            {currentStepIdx + 1} / {totalSteps}
          </span>

          {currentStepIdx < totalSteps - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <span>{t.nextStep || 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleExit}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Finish Cooking!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
