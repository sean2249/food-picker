'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export type MascotPose = 'idle' | 'thinking' | 'presenting' | 'sad' | 'celebrating'

const POSE_SRC: Record<MascotPose, string> = {
  idle: '/mascot/idle.png',
  thinking: '/mascot/thinking.png',
  presenting: '/mascot/presenting.png',
  sad: '/mascot/sad.png',
  celebrating: '/mascot/celebrating-small.png',
}

const POSE_ANIMATION: Record<MascotPose, string> = {
  idle: 'animate-[mascot-breathe_4s_ease-in-out_infinite]',
  thinking: 'animate-[mascot-wobble_1.6s_ease-in-out_infinite]',
  presenting: 'animate-[mascot-breathe_3s_ease-in-out_infinite]',
  sad: 'animate-[mascot-breathe_5s_ease-in-out_infinite]',
  celebrating: 'animate-[mascot-celebrate_700ms_ease-in-out_infinite]',
}

interface Props {
  pose: MascotPose
  /** Static bubble text shown next to the mascot. When changed,
   *  the bubble fades and types the new text from scratch. Pass
   *  null/undefined to hide the bubble entirely. */
  message?: string | null
  /** When true, type out the message char-by-char. When false, show instantly. */
  typewriter?: boolean
}

export function FloatingMascot({ pose, message, typewriter = false }: Props) {
  const [typed, setTyped] = useState('')
  // Bubble can be manually dismissed by tapping the mascot. When the state
  // (pose) changes, dismissal resets so a new beat always announces itself.
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissal when the pose changes (adjust during render, not in an effect).
  const [prevPose, setPrevPose] = useState(pose)
  if (prevPose !== pose) {
    setPrevPose(pose)
    if (dismissed) setDismissed(false)
  }

  // The non-animated text is fully derived from the inputs, so reset `typed`
  // during render when message/typewriter change. The effect only drives the
  // typewriter interval (its setState runs inside the timer, not synchronously).
  const msgKey = `${typewriter ? 1 : 0}:${message ?? ''}`
  const [prevMsgKey, setPrevMsgKey] = useState<string | null>(null)
  if (prevMsgKey !== msgKey) {
    setPrevMsgKey(msgKey)
    setTyped(message && !typewriter ? message : '')
  }

  useEffect(() => {
    if (!message || !typewriter) return
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(message.slice(0, i))
      if (i >= message.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [message, typewriter])

  const hasBubble = !!message
  const showBubble = !!typed && !dismissed
  const buttonLabel = dismissed ? '顯示提拉米蘇的提示' : '收起提拉米蘇的提示'

  const mascot = (
    <Image
      src={POSE_SRC[pose]}
      alt=""
      width={56}
      height={56}
      className={`block h-14 w-auto select-none ${POSE_ANIMATION[pose]}`}
      draggable={false}
      priority
    />
  )

  return (
    <div
      className="fixed right-3 bottom-3 z-30 flex items-end gap-2 pointer-events-none
                 sm:right-4 sm:bottom-4"
    >
      {/* Visual bubble — aria-hidden because the typewriter would otherwise
          spam live-region announcements one character at a time. The
          accessible announcement happens in the sr-only sibling below. */}
      {showBubble && (
        <div
          key={message}
          aria-hidden
          className="pointer-events-auto max-w-[220px] mb-2 relative
                     bg-card border border-border/80 rounded-2xl rounded-br-md
                     px-3.5 py-2 text-xs text-foreground/85 leading-relaxed
                     shadow-[0_2px_8px_-2px_oklch(0.30_0.04_50_/_0.18)]
                     animate-[recommend-fade-in_300ms_ease-out_both]"
        >
          {typed}
          <span
            className="absolute -bottom-1 right-3 h-2 w-2 rotate-45
                       bg-card border-r border-b border-border/80"
            aria-hidden
          />
        </div>
      )}

      {/* Accessible announcement — full message, fires once per change. */}
      <div className="sr-only" role="status" aria-live="polite">
        {showBubble ? message : ''}
      </div>

      {hasBubble ? (
        <button
          type="button"
          onClick={() => setDismissed(d => !d)}
          aria-label={buttonLabel}
          className="pointer-events-auto block rounded-full
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-brand/40 focus-visible:ring-offset-2
                     focus-visible:ring-offset-background
                     transition-transform active:scale-95"
        >
          {mascot}
        </button>
      ) : (
        // Idle with no message → decorative, not interactive.
        <span className="pointer-events-none">{mascot}</span>
      )}
    </div>
  )
}
