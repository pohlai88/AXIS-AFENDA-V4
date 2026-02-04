"use client";

import { z } from "zod";
import { createStore } from "./_zustand.create";
import { makePersistOptions } from "./_zustand.persist";
import { toggle, uniqueStrings, removeString, addString } from "./_zustand.actions";
import { shallow } from "./_zustand.selectors";

/**
 * TEMPLATE STORE
 * - UI state only (no server data)
 * - Zod validates defaults for safety
 * - Persist only stable preferences (not volatile selections)
 * - Type-safe actions with clear naming
 */

// ---------- Schema & Types ----------

export const templateStoreSchema = z.object({
  version: z.string(),

  // View preferences
  view: z.enum(["list", "grid", "kanban"]),
  sidebarOpen: z.boolean(),
  compactMode: z.boolean(),

  // Filters
  query: z.string(),
  tags: z.array(z.string()),
  status: z.enum(["all", "active", "archived"]).optional(),

  // Selections (ephemeral, not persisted)
  selectedIds: z.array(z.string()),
}).strict();

export type TemplateStoreState = z.infer<typeof templateStoreSchema>;

export type TemplateStoreActions = {
  // View actions
  setView: (v: TemplateStoreState["view"]) => void;
  toggleSidebar: () => void;
  toggleCompactMode: () => void;

  // Filter actions
  setQuery: (q: string) => void;
  clearQuery: () => void;

  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  clearTags: () => void;

  setStatus: (status: TemplateStoreState["status"]) => void;

  // Selection actions
  setSelectedIds: (ids: string[]) => void;
  selectId: (id: string) => void;
  unselectId: (id: string) => void;
  toggleSelectId: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // Utility
  reset: () => void;
};

export type TemplateStore = TemplateStoreState & TemplateStoreActions;

// ---------- Constants ----------

export const TEMPLATE_STORE_VERSION = "1.0.0";

const defaults: TemplateStoreState = {
  version: TEMPLATE_STORE_VERSION,
  view: "list",
  sidebarOpen: true,
  compactMode: false,
  query: "",
  tags: [],
  status: "all",
  selectedIds: [],
};

// ---------- Validation ----------

function buildInitial(): TemplateStoreState {
  const res = templateStoreSchema.safeParse(defaults);
  if (!res.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[TemplateStore] Defaults failed Zod validation", res.error.flatten());
    }
    return defaults;
  }
  return res.data;
}

const initial = buildInitial();

// ---------- Store ----------

export const useTemplateStore = createStore<TemplateStore>({
  name: "template.store",
  initial,
  persistOptions: makePersistOptions({
    name: "template.store",
    version: TEMPLATE_STORE_VERSION,
    // Persist only stable preferences (not selections or filters)
    partialize: (s) => ({
      version: s.version,
      view: s.view,
      sidebarOpen: s.sidebarOpen,
      compactMode: s.compactMode,
    }),
  }),
  build: (set, get) => ({
    // View actions
    setView: (v) => set({ view: v }),
    toggleSidebar: () => set({ sidebarOpen: toggle(get().sidebarOpen) }),
    toggleCompactMode: () => set({ compactMode: toggle(get().compactMode) }),

    // Filter actions
    setQuery: (q) => set({ query: String(q ?? "").trim() }),
    clearQuery: () => set({ query: "" }),

    setTags: (tags) => set({ tags: uniqueStrings(tags.map(String)) }),
    addTag: (tag) => {
      const t = String(tag ?? "").trim();
      if (!t) return;
      set({ tags: addString(get().tags, t) });
    },
    removeTag: (tag) => set({ tags: removeString(get().tags, String(tag)) }),
    clearTags: () => set({ tags: [] }),

    setStatus: (status) => set({ status }),

    // Selection actions
    setSelectedIds: (ids) => set({ selectedIds: uniqueStrings(ids.map(String)) }),
    selectId: (id) => {
      const v = String(id ?? "").trim();
      if (!v) return;
      set({ selectedIds: addString(get().selectedIds, v) });
    },
    unselectId: (id) => set({ selectedIds: removeString(get().selectedIds, String(id)) }),
    toggleSelectId: (id) => {
      const v = String(id ?? "").trim();
      if (!v) return;
      const current = get().selectedIds;
      set({
        selectedIds: current.includes(v)
          ? removeString(current, v)
          : addString(current, v),
      });
    },
    clearSelection: () => set({ selectedIds: [] }),
    isSelected: (id) => get().selectedIds.includes(String(id)),

    // Utility
    reset: () => set({ ...initial }),
  }),
});

// ---------- Selectors ----------

/**
 * Pre-built selectors for common use cases.
 * Use with shallow comparison to prevent unnecessary re-renders.
 * 
 * Example:
 *   const { view, sidebarOpen } = useTemplateStore(templateSelectors.viewState, shallow);
 */
export const templateSelectors = {
  // Atomic selectors
  view: (s: TemplateStore) => s.view,
  sidebarOpen: (s: TemplateStore) => s.sidebarOpen,
  compactMode: (s: TemplateStore) => s.compactMode,
  query: (s: TemplateStore) => s.query,
  tags: (s: TemplateStore) => s.tags,
  status: (s: TemplateStore) => s.status,
  selectedIds: (s: TemplateStore) => s.selectedIds,

  // Composite selectors
  viewState: (s: TemplateStore) => ({
    view: s.view,
    sidebarOpen: s.sidebarOpen,
    compactMode: s.compactMode,
  }),

  filterState: (s: TemplateStore) => ({
    query: s.query,
    tags: s.tags,
    status: s.status,
  }),

  selectionState: (s: TemplateStore) => ({
    selectedIds: s.selectedIds,
    count: s.selectedIds.length,
    hasSelection: s.selectedIds.length > 0,
  }),

  // Computed selectors
  hasFilters: (s: TemplateStore) =>
    s.query.length > 0 || s.tags.length > 0 || s.status !== "all",

  hasSelection: (s: TemplateStore) => s.selectedIds.length > 0,
  selectionCount: (s: TemplateStore) => s.selectedIds.length,
};

/**
 * Re-export shallow for convenience.
 */
export { shallow };
