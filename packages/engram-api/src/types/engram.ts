export interface EngramMemory {
    id?: number
    title: string
    content: string
    type?: string
    project?: string
    scope?: 'project' | 'personal'
    topic_key?: string
    session_id?: string
    created_at?: string
    updated_at?: string
}

export interface EngramSession {
    id?: string
    project: string
    directory?: string
    started_at?: string
    ended_at?: string
    summary?: string
}

export interface EngramSearchResult {
    observations: EngramMemory[]
    total: number
}

export interface EngramContextResult {
    observations: EngramMemory[]
    sessions: EngramSession[]
}

export interface EngramStats {
    totalObservations: number
    totalSessions: number
    projects: string[]
}

export interface EngramConflict {
    id: number
    observation_a_id: number
    observation_b_id: number
    relation: string
    status: string
    judged_at?: string
    confidence?: number
}
