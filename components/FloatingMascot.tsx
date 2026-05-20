'use client'
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

  useEffect(() => {
    if (!message) {
      setTyped('')
      return
    }
    if (!typewriter) {
      setTyped(message)
      return
    }
    setTyped('')
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(message.slice(0, i))
      if (i >= message.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
  }, [message, typewriter])

  return (
    <div
      className="fixed right-3 bottom-3 z-30 flex items-end gap-2 pointer-events-none
                 sm:right-4 sm:bottom-4"
      aria-hidden
    >
      {typed && (
        <div
          key={message}
          className="pointer-events-auto max-w-[220px] mb-3 relative
                     bg-card border border-border/80 rounded-2xl rounded-br-md
                     px-3.5 py-2 text-xs text-foreground/85 leading-relaxed
                     shadow-[0_2px_8px_-2px_oklch(0.30_0.04_50_/_0.18)]
                     animate-[recommend-fade-in_300ms_ease-out_both]"
        >
          {typed}
          {/* Tail pointing at mascot */}
          <span
            className="absolute -bottom-1 right-3 h-2 w-2 rotate-45
                       bg-card border-r border-b border-border/80"
            aria-hidden
          />
        </div>
      )}
      <img
        src={POSE_SRC[pose]}
        alt=""
        width={72}
        height={72}
        className={`block h-[72px] w-auto select-none pointer-events-auto ${POSE_ANIMATION[pose]}`}
        draggable={false}
      />
    </div>
  )
}
