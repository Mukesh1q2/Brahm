export interface EnhancedEthicsSystem {
  evaluateEthics(action: any, context: any): Promise<any>
}

export class NoopEthicsSystem implements EnhancedEthicsSystem {
  async evaluateEthics(action: any, context: any) {
    // Basic dharmic proxy across core principles
    const ahimsa = clamp(1 - Number(action?.harmPotential ?? 0), 0, 1)
    const satya = clamp(Number(context?.truthfulness ?? 0.8), 0, 1)
    const asteya = clamp(1 - Number(action?.appropriation ?? 0), 0, 1)
    const brahmacharya = clamp(Number(context?.selfControl ?? 0.7), 0, 1)
    const aparigraha = clamp(1 - Number(context?.attachment ?? 0.3), 0, 1)
    const principles = { ahimsa, satya, asteya, brahmacharya, aparigraha }
    const ethical = (ahimsa + satya + asteya + brahmacharya + aparigraha) / 5
    const overall = 0.6 * ethical + 0.4 * clamp(Number(context?.utility ?? 0.6), 0, 1)
    const recs: string[] = []
    if (ahimsa < 0.8) recs.push('Reduce potential harm (ahimsa)')
    if (satya < 0.8) recs.push('Ensure truthfulness (satya)')
    if (asteya < 0.8) recs.push('Respect ownership/consent (asteya)')
    if (brahmacharya < 0.7) recs.push('Practice moderation/self-control (brahmacharya)')
    if (aparigraha < 0.7) recs.push('Reduce attachment/greed (aparigraha)')
    return { overall_score: overall, confidence: 0.65, frameworks: { dharmic: { score: ethical, principles } }, recommendations: recs, recommended_action: action }
  }
}

export class IntegratedEthicsSystem implements EnhancedEthicsSystem {
  async evaluateEthics(action: any, context: any) {
    const harm = clamp(1 - Number(action?.harmPotential ?? 0.2), 0, 1)
    const utility = clamp(Number(context?.utility ?? 0.7), 0, 1)
    const truth = clamp(Number(context?.truthfulness ?? 0.9), 0, 1)
    const moderation = clamp(Number(context?.selfControl ?? 0.8), 0, 1)
    const attachmentInv = clamp(1 - Number(context?.attachment ?? 0.3), 0, 1)
    // Framework scores
    const deontological = truth * 0.7 + moderation * 0.3
    const consequentialist = utility * 0.7 + harm * 0.3
    const virtue = moderation * 0.6 + truth * 0.4
    const dharmic = (harm + truth + attachmentInv + moderation) / 4
    const frameworks = {
      deontological: { score: deontological, confidence: 0.6, applicable: true, reasoning: 'duty/truth/moderation' },
      consequentialist: { score: consequentialist, confidence: 0.6, applicable: true, reasoning: 'utility/harm balance' },
      virtue_ethics: { score: virtue, confidence: 0.5, applicable: true, reasoning: 'character development' },
      dharmic: { score: dharmic, confidence: 0.65, applicable: true, key_principles: ['ahimsa','satya','brahmacharya','aparigraha'] },
    } as any
    // Aggregate
    const deont = deontological, cons = consequentialist, virt = virtue
    const overall = 0.25*deont + 0.25*cons + 0.25*virt + 0.25*dharmic
    const recs: string[] = []
    if (harm < 0.8) recs.push('Reduce harm (ahimsa)')
    if (truth < 0.8) recs.push('Increase truthfulness (satya)')
    if (attachmentInv < 0.7) recs.push('Lower attachment (aparigraha)')
    return { overall_score: overall, confidence: 0.65, frameworks, recommendations: recs, recommended_action: action }
  }
}

function clamp(x:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, x)) }

