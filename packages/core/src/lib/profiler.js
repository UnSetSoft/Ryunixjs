const perfNow = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now()
class Profiler {
  enabled
  measures
  renderTimes
  maxSamples
  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production'
    this.measures = new Map()
    this.renderTimes = []
    this.maxSamples = 100
  }
  startMeasure(name) {
    if (!this.enabled) return
    this.measures.set(name, perfNow())
  }
  endMeasure(name) {
    if (!this.enabled) return
    const start = this.measures.get(name)
    if (!start) return
    const duration = perfNow() - start
    this.measures.delete(name)
    return duration
  }
  recordRender(componentName, duration) {
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
  getStats() {
    if (!this.enabled) return null
    const total = this.renderTimes.reduce((sum, r) => sum + r.duration, 0)
    const avg = total / this.renderTimes.length
    const max = Math.max(...this.renderTimes.map((r) => r.duration))
    const min = Math.min(...this.renderTimes.map((r) => r.duration))
    return { total, avg, max, min, count: this.renderTimes.length }
  }
  getSlowestComponents(limit = 10) {
    if (!this.enabled) return []
    const byComponent = new Map()
    this.renderTimes.forEach(({ component, duration }) => {
      if (!byComponent.has(component)) {
        byComponent.set(component, { total: 0, count: 0, max: 0 })
      }
      const stats = byComponent.get(component)
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
  logStats() {
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
  clear() {
    this.renderTimes = []
    this.measures.clear()
  }
  enable() {
    this.enabled = true
  }
  disable() {
    this.enabled = false
  }
}
const profiler = new Profiler()
export function useProfiler(componentName) {
  const startTime = perfNow()
  return () => {
    const duration = perfNow() - startTime
    profiler.recordRender(componentName, duration)
  }
}
export function withProfiler(Component, name) {
  const Profiled = (props) => {
    profiler.startMeasure(name)
    const result = Component(props)
    const duration = profiler.endMeasure(name)
    if (duration) profiler.recordRender(name, duration)
    return result
  }
  return Profiled
}
export { profiler }
