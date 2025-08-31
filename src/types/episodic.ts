export type Episode = {
  id: string
  ts: number
  main_content: string
  phi_level: number | null
  attention_strength?: number | null
  labels?: string[]
  phenomenology?: unknown
  significance?: number | null
}

export type EpisodeEvent = {
  type: 'experience'
  experience: {
    id: string
    timestamp: number
    main_content: string
    phi_level: number | null
    qualia_count?: number
    duration_ms?: number
  }
}

