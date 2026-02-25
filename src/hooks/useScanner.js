import { useState, useCallback, useRef } from 'react'
import { MOCK_SCAN_FINDINGS } from '../data/mockData'

export function useScanner() {
  const [selectedModel, setSelectedModel] = useState(null)
  const [scanState, setScanState] = useState('idle') // idle | scanning | complete
  const [scanProgress, setScanProgress] = useState(0)
  const [findings, setFindings] = useState([])
  const intervalRef = useRef(null)

  const startScan = useCallback((model) => {
    if (scanState === 'scanning') return
    setSelectedModel(model)
    setScanState('scanning')
    setScanProgress(0)
    setFindings([])

    const duration = 6000 // 6 seconds
    const steps = 60
    const stepMs = duration / steps
    let step = 0

    intervalRef.current = setInterval(() => {
      step++
      const progress = Math.min(100, Math.round((step / steps) * 100))
      setScanProgress(progress)

      if (step >= steps) {
        clearInterval(intervalRef.current)
        const modelFindings = MOCK_SCAN_FINDINGS[model.id] || []
        setFindings(modelFindings)
        setScanState('complete')
      }
    }, stepMs)
  }, [scanState])

  const resetScan = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setScanState('idle')
    setScanProgress(0)
    setFindings([])
  }, [])

  return {
    selectedModel,
    setSelectedModel,
    scanState,
    scanProgress,
    findings,
    startScan,
    resetScan,
  }
}
