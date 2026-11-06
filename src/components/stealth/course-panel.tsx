'use client'

// CAPYBER — Painel do CURSO no PC do quarto (Sala Segura · Capivara Silenciosa).
// 8 módulos de privacidade/OPSEC com aula + checklist + quiz de 3 perguntas.
// Precisa acertar ≥ 2 para concluir o módulo. 8/8 desbloqueiam as missões.

import { useCallback, useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  Globe2,
  GraduationCap,
  ListChecks,
  Lock,
  MessagesSquare,
  Radar,
  RotateCcw,
  Server,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { COURSE_MODULES, type ModuleIcon } from '@/lib/stealth-content'

const ICONS: Record<ModuleIcon, typeof Radar> = {
  radar: Radar,
  shield: ShieldCheck,
  globe: Globe2,
  fingerprint: Fingerprint,
  file: BookOpen,
  message: MessagesSquare,
  user: GraduationCap,
  server: Server,
}

interface CoursePanelProps {
  modulesDone: string[]
  onCompleteModule: (id: string) => void
}

type QuizPhase = 'aula' | 'pergunta' | 'resultado'

export function CoursePanel({ modulesDone, onCompleteModule }: CoursePanelProps) {
  const [activeId, setActiveId] = useState<string>(COURSE_MODULES[0].id)
  const [phase, setPhase] = useState<QuizPhase>('aula')
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finalScore, setFinalScore] = useState<number | null>(null)

  const mod = useMemo(() => COURSE_MODULES.find((m) => m.id === activeId) ?? COURSE_MODULES[0], [activeId])
  const done = modulesDone.includes(mod.id)
  const doneCount = modulesDone.length

  const openModule = useCallback((id: string) => {
    setActiveId(id)
    setPhase('aula')
    setQIdx(0)
    setPicked(null)
    setScore(0)
    setFinalScore(null)
  }, [])

  const startQuiz = useCallback(() => {
    setPhase('pergunta')
    setQIdx(0)
    setPicked(null)
    setScore(0)
    setFinalScore(null)
  }, [])

  const pick = useCallback(
    (optionIdx: number) => {
      if (picked !== null) return
      const question = mod.quiz[qIdx]
      const correct = optionIdx === question.correct
      setPicked(optionIdx)
      if (correct) setScore((s) => s + 1)
    },
    [mod, qIdx, picked],
  )

  const next = useCallback(() => {
    if (qIdx < mod.quiz.length - 1) {
      setQIdx((i) => i + 1)
      setPicked(null)
      return
    }
    // fim do quiz: `score` já inclui a última resposta
    setFinalScore(score)
    if (score >= 2) onCompleteModule(mod.id)
    setPhase('resultado')
  }, [mod, qIdx, score, onCompleteModule])

  const question = mod.quiz[qIdx]

  return (
    <div className="flex flex-col gap-3 text-[#cfe8ff]">
      {/* faixa educativa */}
      <div className="cap-mono rounded-md border border-[#15324d] bg-[#0a1e33] px-3 py-2 text-xs leading-relaxed text-[#7cb6ec]">
        <ShieldCheck className="mr-1.5 inline h-4 w-4 text-[#21a44a]" aria-hidden />
        Conteúdo de DEFESA: privacidade, anti-doxing e OPSEC legítimo — o mesmo conhecimento que protege
        jornalistas, ativistas e profissionais de segurança. Conclua os 8 módulos para desbloquear as missões.
        <span className="ml-1 font-bold text-[#4ade80]">{doneCount}/8</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[248px_1fr]">
        {/* lista de módulos */}
        <nav aria-label="Módulos do curso" className="stealth-scroll max-h-64 overflow-y-auto pr-1 md:max-h-[520px]">
          <ul className="flex flex-col gap-1.5">
            {COURSE_MODULES.map((m, i) => {
              const Icon = ICONS[m.icon]
              const mDone = modulesDone.includes(m.id)
              const active = m.id === activeId
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openModule(m.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7bd4] ${
                      active
                        ? 'border-[#2f7bd4] bg-[#0d2a45]'
                        : 'border-[#15324d] bg-[#0b2033] hover:border-[#24507c] hover:bg-[#0e2540]'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                        mDone ? 'bg-[#123c22] text-[#4ade80]' : 'bg-[#12304e] text-[#7cb6ec]'
                      }`}
                    >
                      {mDone ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Icon className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="cap-mono block text-[10px] font-bold tracking-wider text-[#5f8fc0]">
                        MÓDULO {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="block truncate font-semibold text-[#d9ecff]">{m.title}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#3f6f9f]" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* conteúdo do módulo */}
        <section
          aria-label={`Conteúdo do módulo: ${mod.title}`}
          className="stealth-scroll max-h-[520px] overflow-y-auto rounded-md border border-[#15324d] bg-[#071626] p-4 sm:p-5"
        >
          <header className="mb-3 border-b border-[#15324d] pb-3">
            <p className="cap-mono text-[11px] font-bold tracking-widest text-[#4ade80]">
              CAPY-OS · curso de privacidade · módulo {String(COURSE_MODULES.indexOf(mod) + 1).padStart(2, '0')}
            </p>
            <h3 className="cap-heading mt-1 text-lg text-[#eaf5ff]">{mod.title}</h3>
            <p className="mt-1 text-sm text-[#8fb4d9]">{mod.summary}</p>
          </header>

          {phase === 'aula' && (
            <div className="cap-fade-in">
              <div className="space-y-3 text-sm leading-relaxed text-[#c3dcf5]">
                {mod.lesson.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-4 rounded-md border border-[#1d4a2c] bg-[#0a2117] p-3.5">
                <p className="cap-mono mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#4ade80]">
                  <ListChecks className="h-4 w-4" aria-hidden /> CHECKLIST PRÁTICO
                </p>
                <ul className="space-y-1.5 text-sm text-[#bfe6cd]">
                  {mod.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#21a44a]" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {done ? (
                  <span className="cap-mono inline-flex items-center gap-1.5 rounded-md border border-[#1d4a2c] bg-[#0f2a1a] px-3 py-2 text-sm font-bold text-[#4ade80]">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Módulo concluído — pode refazer o quiz
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="cap-btn-primary inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden />
                    Fazer o quiz (3 perguntas · acerte ≥ 2)
                  </button>
                )}
                {!done && (
                  <p className="cap-mono flex items-center gap-1.5 text-xs text-[#5f8fc0]">
                    <Lock className="h-3.5 w-3.5" aria-hidden /> acerte ≥ 2 para concluir o módulo
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === 'pergunta' && question && (
            <div className="cap-fade-in" aria-live="polite">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="cap-mono text-xs font-bold tracking-wider text-[#7cb6ec]">
                  PERGUNTA {qIdx + 1}/{mod.quiz.length} · acertos: {score}
                </p>
                <div className="flex gap-1" aria-hidden>
                  {mod.quiz.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-6 rounded-full ${i < qIdx ? 'bg-[#21a44a]' : i === qIdx ? 'bg-[#f5920b]' : 'bg-[#15324d]'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="mb-3 text-base font-bold text-[#eaf5ff]">{question.q}</p>

              <div className="flex flex-col gap-2">
                {question.options.map((opt, i) => {
                  const isPicked = picked === i
                  const isCorrect = i === question.correct
                  const revealed = picked !== null
                  let cls = 'border-[#15324d] bg-[#0b2033] hover:border-[#24507c] hover:bg-[#0e2540]'
                  if (revealed && isCorrect) cls = 'border-[#21a44a] bg-[#0f2a1a]'
                  else if (revealed && isPicked && !isCorrect) cls = 'border-[#a4232f] bg-[#2a0f13]'
                  else if (revealed) cls = 'border-[#15324d] bg-[#0b2033] opacity-60'
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={picked !== null}
                      onClick={() => pick(i)}
                      className={`flex min-h-[44px] items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7bd4] ${cls}`}
                    >
                      <span className="cap-mono flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#12304e] text-xs font-bold text-[#7cb6ec]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-[#d9ecff]">{opt}</span>
                      {revealed && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ade80]" aria-hidden />}
                      {revealed && isPicked && !isCorrect && <XCircle className="h-5 w-5 shrink-0 text-[#ff5f6d]" aria-hidden />}
                    </button>
                  )
                })}
              </div>

              {picked !== null && (
                <div
                  className={`mt-3 rounded-md border p-3 text-sm ${
                    picked === question.correct
                      ? 'border-[#1d4a2c] bg-[#0a2117] text-[#bfe6cd]'
                      : 'border-[#4a0a12] bg-[#230a10] text-[#ffd7dc]'
                  }`}
                >
                  <p className="cap-mono mb-1 text-xs font-bold tracking-wider">
                    {picked === question.correct ? '✔ CORRETO' : '✘ NÃO FOI DESSA VEZ'}
                  </p>
                  <p>{question.explain}</p>
                  <button
                    type="button"
                    onClick={next}
                    className="cap-btn-steel mt-3 inline-flex min-h-[40px] items-center gap-1.5 px-4 text-sm"
                  >
                    {qIdx < mod.quiz.length - 1 ? 'Próxima pergunta' : 'Ver resultado'}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'resultado' && finalScore !== null && (
            <div className="cap-fade-in text-center" aria-live="polite">
              <div
                className={`mx-auto max-w-md rounded-md border p-5 ${
                  finalScore >= 2 ? 'border-[#1d4a2c] bg-[#0a2117]' : 'border-[#4a0a12] bg-[#230a10]'
                }`}
              >
                <p className="cap-mono text-4xl font-extrabold text-[#eaf5ff]">
                  {finalScore}/{mod.quiz.length}
                </p>
                <p className={`mt-2 text-sm font-bold ${finalScore >= 2 ? 'text-[#4ade80]' : 'text-[#ff5f6d]'}`}>
                  {finalScore >= 2
                    ? doneCount === 8
                      ? 'Curso completo! Todas as missões desbloqueadas.'
                      : 'Módulo concluído! O mentor capivara aprova.'
                    : 'Precisa acertar pelo menos 2 de 3. Revise a aula e tente de novo.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={startQuiz}
                    className="cap-btn-ghost inline-flex min-h-[44px] items-center gap-1.5 px-4 text-sm"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Refazer quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('aula')}
                    className="cap-btn-steel inline-flex min-h-[44px] items-center gap-1.5 px-4 text-sm"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden /> Voltar à aula
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CoursePanel
