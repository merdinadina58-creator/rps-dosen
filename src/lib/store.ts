import { create } from 'zustand'

export type View =
  | 'dashboard'
  | 'rps-list'
  | 'rps-detail'
  | 'dosen'
  | 'mata-kuliah'
  | 'ai-assistant'
  | 'prodi'

interface AppState {
  view: View
  rpsId: string | null
  /** Optional context RPS id used by AI assistant */
  assistantContextRpsId: string | null
  setView: (v: View) => void
  openRps: (id: string) => void
  setAssistantContextRpsId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  rpsId: null,
  assistantContextRpsId: null,
  setView: (v) => set({ view: v }),
  openRps: (id) => set({ view: 'rps-detail', rpsId: id }),
  setAssistantContextRpsId: (id) => set({ assistantContextRpsId: id }),
}))
