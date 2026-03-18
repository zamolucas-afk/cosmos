'use client'

import type { RecorderState } from '@/hooks/useRecorder'

export default function RecordingOrb({
  state,
  onClick,
}: {
  state: RecorderState
  onClick: () => void
}) {
  const isRecording = state === 'recording'
  const isThinking = state === 'thinking'

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={onClick}
        disabled={isThinking}
        className={`relative w-40 h-40 rounded-full cursor-pointer disabled:cursor-default
          flex items-center justify-center${!isRecording && !isThinking ? ' recording-orb-idle' : ''}`}
        style={{
          background: isRecording
            ? 'radial-gradient(circle at 35% 35%, #d8b4fe, #a855f7 40%, #7c3aed 70%, #4c1d95)'
            : 'radial-gradient(circle at 35% 35%, #c084fc, #7c3aed 50%, #4c1d95 80%, #2e1065)',
          boxShadow: isRecording
            ? '0 0 60px #a855f7aa, 0 0 120px #7c3aed66, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(216,180,254,0.3)'
            : '0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.3)',
          animation: isThinking
            ? 'none'
            : isRecording
            ? 'orb-record 1.2s ease-in-out infinite'
            : 'orb-idle 3s ease-in-out infinite',
        }}
        aria-label={isRecording ? 'Save note' : 'Start note'}
      >
        {isThinking ? (
          <div className="w-full h-full rounded-full border-4 border-accent-light/30 border-t-accent-light"
            style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="white" opacity={0.9}>
            {isRecording ? (
              <rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </>
            )}
          </svg>
        )}
      </button>

      <p className="text-text-secondary text-sm tracking-wider uppercase text-xs">
        {isThinking ? 'Processing…' : isRecording ? '' : 'Tap to create note'}
      </p>

      <style>{`
        @keyframes orb-idle {
          0%,100% { transform: scale(1); box-shadow: 0 0 40px #7c3aed88, 0 0 80px #7c3aed44, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 50px #a855f7aa, 0 0 100px #7c3aed55, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(192,132,252,0.4); }
        }
        @keyframes orb-record {
          0%,100% { transform: scale(1); box-shadow: 0 0 60px #a855f7aa, 0 0 120px #7c3aed66, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(216,180,254,0.3); }
          50% { transform: scale(1.12); box-shadow: 0 0 80px #a855f7cc, 0 0 160px #7c3aed88, inset 0 -6px 16px rgba(0,0,0,0.4), inset 0 6px 10px rgba(216,180,254,0.4); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
