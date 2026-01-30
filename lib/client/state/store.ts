"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

type UiState = {
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }, false, "ui/setSidebarOpen"),
    }),
    { name: "ui" }
  )
)

