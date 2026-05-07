'use client'

import { useFormStatus } from 'react-dom'

type Props = {
  children: React.ReactNode
  pendingChildren?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function PendingButton({ children, pendingChildren, className, style }: Props) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={{ ...style, opacity: pending ? 0.75 : undefined, pointerEvents: pending ? 'none' : undefined }}
    >
      {pending
        ? (pendingChildren ?? (
            <>
              <span className="forge-spinner" />
              Starting…
            </>
          ))
        : children}
    </button>
  )
}
