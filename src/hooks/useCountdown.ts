import { useEffect, useRef, useState } from 'react'

/**
 * Countdown driven by an absolute start timestamp (drift-free). Fires `onExpire`
 * exactly once when it reaches zero. `running` gates the timer so it does not run
 * before the test starts or after it ends.
 */
export function useCountdown(durationSec: number, running: boolean, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(durationSec)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!running) return
    const start = Date.now()
    let fired = false

    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const left = Math.max(0, durationSec - elapsed)
      setRemaining(left)
      if (left <= 0 && !fired) {
        fired = true
        clearInterval(iv)
        onExpireRef.current()
      }
    }

    tick()
    const iv = setInterval(tick, 250)
    return () => clearInterval(iv)
  }, [running, durationSec])

  return Math.ceil(remaining)
}
