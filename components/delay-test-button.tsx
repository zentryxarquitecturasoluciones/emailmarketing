"use client"

import { useState } from "react"

interface DelayTestButtonProps {
  portal: "a" | "b"
}

export function DelayTestButton({ portal }: DelayTestButtonProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const runTest = async () => {
    setTesting(true)
    setResult(null)

    const delayMs = portal === "a" ? 54000 : 20000 // 54s Portal A, 20s Portal B
    const testDelayMs = 3000 // Test con 3 segundos para no esperar tanto

    const start = Date.now()

    // Simular el delay del sistema
    await new Promise((resolve) => setTimeout(resolve, testDelayMs))

    const elapsed = Date.now() - start
    const isAccurate = Math.abs(elapsed - testDelayMs) < 500 // Tolerancia de 500ms

    setResult(
      isAccurate
        ? `OK: ${elapsed}ms (esperado: ${testDelayMs}ms). Sistema de ${delayMs / 1000}s funcionando.`
        : `WARN: ${elapsed}ms (esperado: ${testDelayMs}ms). Revisar sistema.`,
    )
    setTesting(false)
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={runTest}
        disabled={testing}
        className="text-[8px] text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors cursor-pointer disabled:cursor-wait"
        title="Test de delay"
      >
        {testing ? "..." : "·"}
      </button>
      {result && <span className="text-[8px] text-muted-foreground/30 max-w-[200px] text-center">{result}</span>}
    </div>
  )
}
