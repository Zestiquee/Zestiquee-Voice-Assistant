import React, { useState, useEffect } from 'react';
import { AppTranslations } from '../i18n/translations';
import { Timer } from '../types';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Plus,
  Bell,
  Sparkles,
  Coffee,
  Flame,
  Egg,
} from 'lucide-react';

interface TimerManagerProps {
  t: AppTranslations;
  timers: Timer[];
  onStartTimer: (label: string, durationSeconds: number) => Promise<void>;
  onTogglePauseTimer: (id: string, isPaused: boolean) => Promise<void>;
  onCancelTimer: (id: string) => Promise<void>;
}

export const TimerManager: React.FC<TimerManagerProps> = ({
  t,
  timers,
  onStartTimer,
  onTogglePauseTimer,
  onCancelTimer,
}) => {
  const [customLabel, setCustomLabel] = useState('');
  const [customMinutes, setCustomMinutes] = useState(10);
  const [activeTimersState, setActiveTimersState] = useState<Timer[]>(timers);

  // Sync timers with prop
  useEffect(() => {
    setActiveTimersState(timers);
  }, [timers]);

  // Interval loop calculating remaining seconds from startTimestamp & endTimestamp
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTimersState((prev) =>
        prev.map((timer) => {
          if (timer.isPaused) return timer;
          const remaining = Math.max(0, Math.round((timer.endTimestamp - now) / 1000));
          if (remaining === 0 && timer.remainingSeconds > 0) {
            playChime();
          }
          return { ...timer, remainingSeconds: remaining };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Web Audio chime generator (always works without external asset files)
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play two pleasant bells
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 1.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const handleStartCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = customLabel.trim() || 'Kitchen Timer';
    const durSec = Math.max(10, customMinutes * 60);
    await onStartTimer(label, durSec);
    setCustomLabel('');
    setCustomMinutes(10);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const PRESETS = [
    { label: 'Chai / Tea Brew', minutes: 3, icon: Coffee },
    { label: 'Boiling Eggs', minutes: 7, icon: Egg },
    { label: 'Steaming Rice', minutes: 12, icon: Flame },
    { label: 'Simmering Dal', minutes: 18, icon: TimerIcon },
    { label: 'Oven Bake', minutes: 25, icon: Bell },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6DFD5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-[#2D5A43] bg-[#EBF3EE] px-3 py-1 rounded-full mb-2">
            <TimerIcon className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Persistent Timestamp Accuracy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2421]">
            {t.timersTitle || 'Kitchen Timers & Alarms'}
          </h2>
          <p className="text-sm text-[#5A625B] mt-1">
            {t.timersSubtitle ||
              'Accurate multi-timers with persistent countdowns even if you refresh or switch tabs.'}
          </p>
        </div>

        <button
          onClick={playChime}
          className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFEA] border border-[#E6DFD5] text-xs font-semibold text-[#1F2421] transition flex items-center space-x-1.5"
          title="Test sound chime"
        >
          <Bell className="w-3.5 h-3.5 text-[#2D5A43]" />
          <span>Test Alarm Chime</span>
        </button>
      </div>

      {/* Quick Presets Slider */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A625B]">
          Instant Kitchen Presets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                onClick={() => onStartTimer(preset.label, preset.minutes * 60)}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#EBF3EE] border border-[#E6DFD5] hover:border-[#2D5A43] transition flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#2D5A43] shadow-2xs mb-2 group-hover:scale-110 transition">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#1F2421]">{preset.label}</div>
                <div className="text-[11px] text-[#5A625B]">{preset.minutes} mins</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Custom Timer Form */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6DFD5] shadow-xs">
        <h3 className="font-serif font-bold text-lg text-[#1F2421] mb-4">
          {t.startNewTimer || 'Set Custom Timer'}
        </h3>

        <form onSubmit={handleStartCustom} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder={t.timerNamePlaceholder || 'Timer name (e.g. Pasta Al Dente)...'}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
          />

          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="300"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-3 rounded-xl border border-gray-300 text-sm text-center font-bold focus:ring-2 focus:ring-[#2D5A43]"
            />
            <span className="text-xs font-semibold text-gray-500">mins</span>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#2D5A43] hover:bg-[#234734] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Start Timer
          </button>
        </form>
      </div>

      {/* Active Timers Grid */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-xl text-[#1F2421]">
          Active Timers ({activeTimersState.length})
        </h3>

        {activeTimersState.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTimersState.map((timer) => {
              const isFinished = timer.remainingSeconds === 0;
              const progressPct =
                timer.durationSeconds > 0
                  ? ((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100
                  : 100;

              return (
                <div
                  key={timer.id}
                  className={`bg-white rounded-3xl p-6 border transition flex flex-col justify-between shadow-xs ${
                    isFinished
                      ? 'border-rose-400 bg-rose-50/50 animate-pulse'
                      : timer.isPaused
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-[#E6DFD5]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-serif font-bold text-lg text-[#1F2421] truncate">
                        {timer.label}
                      </h4>
                      <button
                        onClick={() => onCancelTimer(timer.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title={t.cancelTimer || 'Cancel timer'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Big Countdown display */}
                    <div className="text-center py-4">
                      <div
                        className={`text-4xl sm:text-5xl font-mono font-bold tracking-tight ${
                          isFinished
                            ? 'text-rose-600'
                            : timer.isPaused
                            ? 'text-amber-700'
                            : 'text-[#2D5A43]'
                        }`}
                      >
                        {formatTime(timer.remainingSeconds)}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-[#5A625B] mt-1">
                        {isFinished
                          ? t.timerFinished || 'Timer finished!'
                          : timer.isPaused
                          ? 'Paused'
                          : 'Counting down'}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#E6DFD5] h-1.5 rounded-full overflow-hidden my-3">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          isFinished ? 'bg-rose-500' : 'bg-[#2D5A43]'
                        }`}
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions (Pause / Resume / Cancel) */}
                  <div className="flex items-center justify-center space-x-3 pt-3 border-t border-[#E6DFD5]">
                    {!isFinished && (
                      <button
                        onClick={() => onTogglePauseTimer(timer.id, !timer.isPaused)}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                          timer.isPaused
                            ? 'bg-[#2D5A43] text-white hover:bg-[#234734]'
                            : 'bg-[#FAF7F2] text-[#1F2421] hover:bg-[#F3EFEA] border border-[#E6DFD5]'
                        }`}
                      >
                        {timer.isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>{t.resumeTimer || 'Resume'}</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>{t.pauseTimer || 'Pause'}</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => onCancelTimer(timer.id)}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                    >
                      {isFinished ? 'Dismiss' : t.cancelTimer || 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E6DFD5] shadow-xs max-w-md mx-auto">
            <TimerIcon className="w-12 h-12 text-[#2D5A43]/40 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#1F2421] mb-1">No Active Timers</h3>
            <p className="text-xs text-[#5A625B]">
              {t.noActiveTimers ||
                'No active timers right now. Tap a preset or tell Zestiquee to start one.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
