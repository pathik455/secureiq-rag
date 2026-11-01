import { create } from 'zustand'

interface AppState {
  isAgentModalOpen: boolean
  setIsAgentModalOpen: (open: boolean) => void
  selectedVulnerabilityId: string | null
  setSelectedVulnerabilityId: (id: string | null) => void
  selectedRemediationId: string | null
  setSelectedRemediationId: (id: string | null) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  isAgentModalOpen: false,
  setIsAgentModalOpen: (open) => set({ isAgentModalOpen: open }),
  selectedVulnerabilityId: null,
  setSelectedVulnerabilityId: (id) => set({ selectedVulnerabilityId: id }),
  selectedRemediationId: null,
  setSelectedRemediationId: (id) => set({ selectedRemediationId: id }),
  activeTab: 'vulnerabilities',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
