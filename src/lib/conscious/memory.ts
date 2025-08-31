export interface EnhancedMemory {
  storeEpisode(ep: any): Promise<string>
  retrieveEpisodes(query: any): Promise<any[]>
}

export class InMemoryEnhancedMemory implements EnhancedMemory {
  private eps: any[] = []
  async storeEpisode(ep: any) { const id = ep?.id || `ep_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; this.eps.push({ ...ep, id, last_accessed: Date.now(), retrieval_count: 0 }); return id }
  async retrieveEpisodes(query: any) {
    let rows = this.eps.slice()
    const q = String(query?.q || '').toLowerCase()
    if (q) rows = rows.filter(e=> String(e?.experience?.main_content||'').toLowerCase().includes(q))
    const since = Number(query?.since || 0)
    if (since) rows = rows.filter(e=> Number(e?.experience?.timestamp||0) >= since)
    const phiMin = query?.phi_min!=null ? Number(query.phi_min) : null
    const phiMax = query?.phi_max!=null ? Number(query.phi_max) : null
    if (phiMin!=null) rows = rows.filter(e=> Number(e?.experience?.phi_level||0) >= phiMin)
    if (phiMax!=null) rows = rows.filter(e=> Number(e?.experience?.phi_level||0) <= phiMax)
    rows.sort((a,b)=> Number(b?.experience?.timestamp||0) - Number(a?.experience?.timestamp||0))
    const limit = Math.max(1, Math.min(200, Number(query?.limit || 50)))
    return rows.slice(0, limit)
  }
}

