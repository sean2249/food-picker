import { Mood } from '@/types'

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'tired', label: '很累', emoji: '😴' },
  { value: 'happy', label: '開心', emoji: '😊' },
  { value: 'sad', label: '難過', emoji: '😢' },
  { value: 'stressed', label: '壓力大', emoji: '😤' },
  { value: 'excited', label: '興奮', emoji: '🎉' },
  { value: 'neutral', label: '普通', emoji: '😐' },
]

interface Props {
  value: Mood | null
  onChange: (mood: Mood) => void
}

export function MoodSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MOODS.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${
            value === m.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs mt-1">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
