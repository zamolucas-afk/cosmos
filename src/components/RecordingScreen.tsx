'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useRecorder } from '@/hooks/useRecorder'
import { saveNote } from '@/lib/actions/notes'
import StarField from './StarField'
import RecordingOrb from './RecordingOrb'
import Waveform from './Waveform'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

function FallbackTextInput() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSave() {
    if (!text.trim()) return
    startTransition(async () => {
      try {
        const { id } = await saveNote(text.trim(), 0)
        router.push(`/notes/${id}`)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div className="w-full max-w-lg px-4 flex flex-col gap-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your note here instead..."
        className="w-full h-32 bg-surface border border-accent-dim/30 rounded-lg p-3
          text-text-primary text-sm resize-none focus:outline-none focus:border-accent-violet"
      />
      {error && <p className="text-error text-xs">{error}</p>}
      <button onClick={handleSave} disabled={isPending || !text.trim()}
        className="py-2 rounded bg-accent-violet text-white text-sm disabled:opacity-50 cursor-pointer">
        {isPending ? 'Saving…' : 'Save note'}
      </button>
    </div>
  )
}

function hasSpeechRecognition() {
  if (typeof window === 'undefined') return false
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
}

export default function RecordingScreen() {
  const router = useRouter()
  const { state, transcript, duration, error, analyser, start, stop, reset } = useRecorder()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  const handleOrbClick = useCallback(async () => {
    if (state === 'idle') {
      await start()
    } else if (state === 'recording') {
      const { transcript: raw, duration: dur } = stop()
      setSaveError(null)
      if (!raw.trim()) {
        reset()
        setSaveError('No transcript captured. Please try again.')
        return
      }
      try {
        const { id } = await saveNote(raw, dur)
        router.push(`/notes/${id}`)
      } catch (e: any) {
        reset()
        const msg = e.message || ''
        // Never show raw SQL or technical details to the user
        const isSafe = msg && !msg.includes('select ') && !msg.includes('insert ') && !msg.includes('Failed query') && msg.length < 200
        setSaveError(isSafe ? msg : 'Failed to save note. Please try again.')
      }
    }
  }, [state, start, stop, reset, router])

  const handleBack = () => {
    if (state === 'recording') {
      setShowBackConfirm(true)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <StarField />

      {/* Back */}
      <button onClick={handleBack}
        className="absolute top-6 left-6 text-text-muted hover:text-text-primary transition-colors z-10 cursor-pointer">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Timer */}
      {state === 'recording' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-text-secondary text-sm font-mono z-10">
          {formatTime(duration)}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg px-4">
        {!showFallback ? (
          <>
            <RecordingOrb state={state} onClick={handleOrbClick} />
            <Waveform analyser={analyser} active={state === 'recording'} />

            {/* Live transcript */}
            {(state === 'recording' || transcript) && (
              <div className="w-full max-h-[35vh] overflow-y-auto rounded-lg bg-surface/60 backdrop-blur-sm
                border border-accent-dim/20 p-4 text-sm text-text-secondary leading-relaxed">
                {transcript || <span className="text-text-muted italic">Start speaking…</span>}
              </div>
            )}

            {/* Errors */}
            {(error || saveError) && (
              <p className="text-error text-sm text-center bg-error/10 rounded px-4 py-2 max-w-sm">
                {error || saveError}
              </p>
            )}

            {/* Show fallback option when speech recognition is unavailable or errored */}
            {(error || !hasSpeechRecognition()) && state === 'idle' && (
              <div className="flex flex-col items-center gap-2">
                {!hasSpeechRecognition() && (
                  <p className="text-text-secondary text-sm text-center">
                    Voice recording is not supported on this browser.
                    {/iPhone|iPad/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '')
                      ? ' Try Chrome on Android or desktop.'
                      : ' Try Chrome or Edge.'}
                  </p>
                )}
                <button onClick={() => setShowFallback(true)}
                  className="text-accent-light text-sm underline underline-offset-2 hover:text-accent-violet transition-colors cursor-pointer">
                  Type a note instead
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setShowFallback(false)}
              className="text-text-muted text-sm hover:text-text-primary transition-colors cursor-pointer mb-2">
              ← Back to voice recording
            </button>
            <FallbackTextInput />
          </>
        )}
      </div>

      {/* Back confirmation dialog */}
      {showBackConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface rounded-xl p-6 max-w-sm w-full border border-accent-dim/30">
            <p className="text-text-primary font-heading mb-2">Discard note?</p>
            <p className="text-text-secondary text-sm mb-6">Your current note will be discarded.</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/')}
                className="flex-1 py-2 rounded bg-error/20 text-error text-sm border border-error/30 hover:bg-error/30 transition-colors cursor-pointer">
                Discard
              </button>
              <button onClick={() => setShowBackConfirm(false)}
                className="flex-1 py-2 rounded bg-surface-raised text-text-secondary text-sm border border-accent-dim/30 hover:bg-accent-dim/20 transition-colors cursor-pointer">
                Keep note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
