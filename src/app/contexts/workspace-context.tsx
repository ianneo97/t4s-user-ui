import React, { createContext, useContext, useState } from 'react'

export type Workspace = {
  id: string
  name: string
  type: 'BRAND' | 'MANUFACTURER'
  role: 'OWNER' | 'DELEGATE'
}

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-mfg-1',
    name: 'Qingdao KingKing',
    type: 'MANUFACTURER',
    role: 'OWNER',
  },
  {
    id: 'ws-brand-1',
    name: 'Action Distributie',
    type: 'BRAND',
    role: 'DELEGATE',
  },
]

type WorkspaceContextType = {
  activeWorkspace: Workspace
  setActiveWorkspace: (wsId: string) => void
  workspaces: Workspace[]
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
)

const WORKSPACE_STORAGE_KEY = 't4s-demo-active-workspace'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace>(() => {
    try {
      const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY)
      const found = WORKSPACES.find((w) => w.id === storedId)
      return found || WORKSPACES[0]
    } catch {
      return WORKSPACES[0]
    }
  })

  const setActiveWorkspace = (wsId: string) => {
    const ws = WORKSPACES.find((w) => w.id === wsId)
    if (ws) {
      setActiveWorkspaceState(ws)
      localStorage.setItem(WORKSPACE_STORAGE_KEY, ws.id)
    }
  }

  return (
    <WorkspaceContext.Provider
      value={{ activeWorkspace, setActiveWorkspace, workspaces: WORKSPACES }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
