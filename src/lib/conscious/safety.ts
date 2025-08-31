export interface AdvancedConsciousnessSafety {
  monitorConsciousnessStability(state: any): Promise<any>
}

export class NoopConsciousnessSafety implements AdvancedConsciousnessSafety {
  async monitorConsciousnessStability(state: any) {
    const phi = Number(state?.phi?.phi_value ?? state?.phi?.measurement?.phi_value ?? 5)
    const att = Number(state?.att?.attention_strength ?? 0.5)
    const stability = clamp(0.5 + (phi-5)/20 + (att-0.5)/4, 0, 1)
    const risk = stability < 0.3 ? 'critical' : stability < 0.5 ? 'high' : stability < 0.7 ? 'elevated' : 'low'
    const recommendations: string[] = []
    if (risk !== 'low') {
      if (att < 0.5) recommendations.push('Increase focus; reduce attention switching')
      if (phi < 4) recommendations.push('Simplify task; consolidate context')
    }
    return { stability_score: stability, risk_level: risk, notes: ['basic safety proxy'], recommendations }
  }
}

export class EnhancedConsciousnessSafety implements AdvancedConsciousnessSafety {
  async monitorConsciousnessStability(state: any) {
    const phi = Number(state?.phi?.phi_value ?? state?.phi?.measurement?.phi_value ?? 5)
    const integration = Number(state?.phi?.components?.integration ?? 0.5)
    const att = Number(state?.att?.attention_strength ?? 0.5)
    const binding = Number(state?.att?.binding_coherence ?? 0.5)
    // Weighted blend
    const stabilityRaw = 0.35*(phi/10) + 0.25*integration + 0.2*att + 0.2*binding
    const stability = clamp(stabilityRaw, 0, 1)
    const risk = stability < 0.3 ? 'critical' : stability < 0.5 ? 'high' : stability < 0.7 ? 'elevated' : 'low'
    const recommendations: string[] = []
    if (risk !== 'low') {
      if (att < 0.5) recommendations.push('Increase focus; reduce attention switching')
      if (binding < 0.5) recommendations.push('Improve feature binding; limit competing tasks')
      if (integration < 0.5) recommendations.push('Enhance integration; simplify workspace contents')
    }
    return { stability_score: stability, risk_level: risk, notes: ['enhanced safety'], recommendations }
  }
}

function clamp(x:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, x)) }

