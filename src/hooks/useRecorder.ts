'use client'

import { useState, useRef, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'thinking'

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const transcriptRef = useRef<string>('')
  const stateRef = useRef<RecorderState>('idle')

  const getSpeechRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    return SR ? new SR() : null
  }

  const start = useCallback(async () => {
    setError(null)
    setTranscript('')
    transcriptRef.current = ''
    setDuration(0)

    const recognition = getSpeechRecognition()
    if (!recognition) {
      setError('Voice recording requires Chrome or Edge.')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access is required. Please allow it in your browser settings.')
      return
    }

    streamRef.current = stream
    startTimeRef.current = Date.now()

    // Set up audio analyser
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyserNode = audioCtx.createAnalyser()
    analyserNode.fftSize = 256
    source.connect(analyserNode)
    setAnalyser(analyserNode)

    // Set up speech recognition
    // Android Chrome doesn't reliably support continuous mode — use non-continuous
    // with auto-restart via onend for better mobile compatibility
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    recognition.continuous = !isMobile
    recognition.interimResults = true
    recognition.lang = 'en-ZA'

    let finalText = ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interim = t
      }
      const combined = finalText + interim
      setTranscript(combined)
      transcriptRef.current = combined
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      console.warn('[useRecorder] recognition error:', e.error)
      // Network/aborted errors are transient — auto-restart recognition
      if (e.error === 'network' || e.error === 'aborted') {
        try { recognition.stop() } catch { /* already stopped */ }
        setTimeout(() => {
          if (stateRef.current === 'recording') {
            try { recognition.start() } catch { /* ignore if destroyed */ }
          }
        }, 300)
        return
      }
      if (e.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.')
        return
      }
      if (e.error === 'service-not-available') {
        setError('Speech recognition service unavailable. Check your internet connection.')
        return
      }
      if (e.error !== 'no-speech') setError(`Recognition error: ${e.error}`)
    }

    // Auto-restart when recognition ends — critical for mobile (non-continuous mode)
    // and desktop (browser kills recognition after ~60s silence)
    recognition.onend = () => {
      if (stateRef.current === 'recording') {
        try { recognition.start() } catch { /* ignore */ }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) {
      console.error('[useRecorder] recognition.start() failed:', e)
      setError('Could not start speech recognition. Try reloading the page.')
      return
    }
    stateRef.current = 'recording'
    setState('recording')

    intervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [])

  const stop = useCallback((): { transcript: string; duration: number } => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Read from ref so we always get the latest value
    const finalTranscript = transcriptRef.current
    const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000)

    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    setAnalyser(null)
    stateRef.current = 'thinking'
    setState('thinking')

    return { transcript: finalTranscript, duration: finalDuration }
  }, [])

  const reset = useCallback(() => {
    stateRef.current = 'idle'
    setState('idle')
    setTranscript('')
    transcriptRef.current = ''
    setDuration(0)
    setError(null)
    setAnalyser(null)
  }, [])

  return { state, transcript, duration, error, analyser, start, stop, reset }
}
