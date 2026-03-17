'use client'

import { useState, useRef, useCallback } from 'react'

export type RecorderState = 'idle' | 'recording' | 'thinking'

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const transcriptRef = useRef<string>('')

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
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-ZA'

    let finalText = ''
    recognition.onresult = (e: SpeechRecognitionEvent) => {
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

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'no-speech') setError(`Recognition error: ${e.error}`)
    }

    recognitionRef.current = recognition
    recognition.start()
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
    setState('thinking')

    return { transcript: finalTranscript, duration: finalDuration }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setTranscript('')
    transcriptRef.current = ''
    setDuration(0)
    setError(null)
    setAnalyser(null)
  }, [])

  return { state, transcript, duration, error, analyser, start, stop, reset }
}
