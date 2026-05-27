import type { RyunixComponent, RyunixNode } from '../../types/internal.js'

const perfNow = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now()

interface RenderSample {
  component: string
  duration: number
  timestamp: number
}

interface ProfilerStats {
  total: number
  avg: number
  max: number
  min: number
  count: number
}

interface ComponentAggregate {
  total: number
  count: number
  max: number
}

interface ComponentStats {
  name: string
  avg: number
  max: number
  count: number
}

class Profiler {
  enabled: boolean
  measures: Map<string, number>
  renderTimes: RenderSample[]
  maxSamples: number

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production'
    this.measures = new Map()
    this.renderTimes = []
    this.maxSamples = 100
  }

  startMeasure(name: string): void {
    if (!this.enabled) return
    this.measures.set(name, perfNow())
  }

  endMeasure(name: string): number | undefined {
    if (!this.enabled) return
    const start = this.measures.get(name)
    if (!start) return

    const duration = perfNow() - start
    this.measures.delete(name)

    return duration
  }

  recordRender(componentName: string, duration: number): void {
    if (!this.enabled) return

    this.renderTimes.push({
      component: componentName,
      duration,
      timestamp: Date.now(),
    })

    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift()
    }
  }

  getStats(): ProfilerStats | null {
    if (!this.enabled) return null

    const total = this.renderTimes.reduce((sum, r) => sum + r.duration, 0)
    const avg = total / this.renderTimes.length
    const max = Math.max(...this.renderTimes.map((r) => r.duration))
    const min = Math.min(...this.renderTimes.map((r) => r.duration))

    return { total, avg, max, min, count: this.renderTimes.length }
  }

  getSlowestComponents(limit = 10): ComponentStats[] {
    if (!this.enabled) return []

    const byComponent = new Map<string, ComponentAggregate>()

    this.renderTimes.forEach(({ component, duration }) => {
      if (!byComponent.has(component)) {
        byComponent.set(component, { total: 0, count: 0, max: 0 })
      }
      const stats = byComponent.get(component)!
      stats.total += duration
      stats.count++
      stats.max = Math.max(stats.max, duration)
    })

    return Array.from(byComponent.entries())
      .map(([name, stats]) => ({
        name,
        avg: stats.total / stats.count,
        max: stats.max,
        count: stats.count,
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, limit)
  }

  logStats(): void {
    if (!this.enabled) return

    const stats = this.getStats()
    if (!stats) return

    console.group('🔍 Ryunix Performance Stats')
    console.log(`Total renders: ${stats.count}`)
    console.log(`Avg render time: ${stats.avg.toFixed(2)}ms`)
    console.log(
      `Min: ${stats.min.toFixed(2)}ms | Max: ${stats.max.toFixed(2)}ms`,
    )

    const slowest = this.getSlowestComponents(5)
    if (slowest.length > 0) {
      console.log('\n⚠️  Slowest components:')
      slowest.forEach((comp, i) => {
        console.log(
          `${i + 1}. ${comp.name}: ${comp.avg.toFixed(2)}ms avg (${comp.count} renders)`,
        )
      })
    }
    console.groupEnd()
  }

  clear(): void {
    this.renderTimes = []
    this.measures.clear()
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }
}

const profiler = new Profiler()

export function useProfiler(componentName: string): () => void {
  const startTime = perfNow()

  return () => {
    const duration = perfNow() - startTime
    profiler.recordRender(componentName, duration)
  }
}

export function withProfiler(
  Component: RyunixComponent,
  name: string,
): RyunixComponent {
  const Profiled = (props: Record<string, unknown>): RyunixNode => {
    profiler.startMeasure(name)
    const result = Component(props as never)
    const duration = profiler.endMeasure(name)
    if (duration) profiler.recordRender(name, duration)
    return result
  }

  return Profiled as RyunixComponent
}

export { profiler }
