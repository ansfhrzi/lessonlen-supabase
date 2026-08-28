'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLMS } from '@/context/lms-context';
import { Activity, QuizQuestion, QuizSubmission } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Award,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface QuizRunnerProps {
  activity: Activity;
  onFinish?: () => void;
}

export function QuizRunner({ activity, onFinish }: QuizRunnerProps) {
  const { user } = useAuth();
  const { getQuizPayload, submitQuiz, quizSubmissions } = useLMS();

  // Load questions without answers (per RPC get_quiz_payload specification!)
  const questions = getQuizPayload(activity.id, false);

  // Check if student already submitted
  const existingSubmission = user
    ? quizSubmissions.find((s) => s.activity_id === activity.id && s.student_id === user.id)
    : null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 mins default
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!existingSubmission);
  const [submissionResult, setSubmissionResult] = useState<any | null>(existingSubmission || null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  const storageKey = `quiz_draft_${activity.id}_${user?.id || 'anon'}`;

  // Load draft from localStorage (anti data loss)
  useEffect(() => {
    if (isSubmitted) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [activity.id, user?.id, isSubmitted]);

  // Anti-cheating: tab-switch detection (deterrent per blueprint)
  useEffect(() => {
    if (isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowCheatWarning(true);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    const nextAnswers = { ...answers, [questionId]: optionKey };
    setAnswers(nextAnswers);
    localStorage.setItem(storageKey, JSON.stringify(nextAnswers));
  };

  const handleSubmitQuiz = () => {
    if (!user) return;
    const timeTaken = 15 * 60 - timeLeft;
    const res = submitQuiz(activity.id, user.id, user.full_name, answers, Math.max(10, timeTaken));
    setSubmissionResult(res);
    setIsSubmitted(true);
    localStorage.removeItem(storageKey);

    // Fire confetti celebration!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If already submitted or just finished, show Score and Review screen!
  if (isSubmitted && submissionResult) {
    const score = submissionResult.score;
    const maxPoints = submissionResult.max_points || 100;
    const percent = Math.round((score / maxPoints) * 100);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-900">Kuis Telah Diselesaikan!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Jawabanmu telah dievaluasi server Supabase secara otomatis.
            </p>
          </div>

          <div className="inline-flex items-baseline gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 px-6 py-3 rounded-2xl border border-amber-200/80">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Skor Akhir:</span>
            <span className="text-3xl font-extrabold text-amber-700 font-mono">{score}</span>
            <span className="text-sm font-semibold text-amber-600 font-mono">/ {maxPoints}</span>
            <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
              {percent}%
            </span>
          </div>
        </div>

        {/* Detailed Results Breakdown */}
        {submissionResult.results && (
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pembahasan & Review Jawaban
            </h4>

            <div className="space-y-3">
              {submissionResult.results.map((res: any, idx: number) => {
                const questionObj = questions.find((q) => q.id === res.question_id);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      res.correct
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-slate-900">
                        {idx + 1}. {questionObj?.question_text || `Soal #${idx + 1}`}
                      </p>
                      <span
                        className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] shrink-0 ${
                          res.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {res.points_earned} / {res.max_points} Poin
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Jawabanmu:{' '}
                      <strong className={res.correct ? 'text-emerald-700' : 'text-rose-700'}>
                        Opsi {res.selected || 'Tidak dijawab'}
                      </strong>
                    </p>

                    {res.explanation && (
                      <p className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                        💡 <strong>Pembahasan:</strong> {res.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            onClick={onFinish}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
          >
            Lanjut ke Aktivitas Berikutnya
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
        <h4 className="font-bold text-sm text-slate-800">Kuis Belum Memiliki Soal</h4>
        <p className="text-xs text-slate-500">Guru belum menerbitkan bank soal untuk aktivitas ini.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Top Bar: Progress, Timer, Anti-cheat status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Progres Kuis</span>
          <p className="text-xs font-extrabold text-slate-900">
            Terjawab {answeredCount} dari {questions.length} Soal
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{tabSwitchCount}x Pindah Tab</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              timeLeft < 180
                ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Tab Switch Warning Modal */}
      {showCheatWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Peringatan Kejujuran:</strong> Kamu terdeteksi berpindah tab/jendela ({tabSwitchCount}x).
              Tetaplah di halaman kuis sampai selesai.
            </span>
          </div>
          <button
            onClick={() => setShowCheatWarning(false)}
            className="text-amber-800 font-bold px-2 py-0.5 rounded hover:bg-amber-100"
          >
            Paham
          </button>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
            Soal No. {currentIndex + 1} dari {questions.length}
          </span>
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {currentQ.points || 10} Poin
          </span>
        </div>

        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-relaxed">
            {currentQ.question_text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options?.map((opt) => {
            const isSelected = answers[currentQ.id] === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, opt.key)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-medium transition flex items-center gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.key}
                </span>
                <span className="flex-1">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Question Pill Navigator & Actions */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                      : isAnswered
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Sebelumnya
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                Berikutnya <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Kirim Jawaban
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
