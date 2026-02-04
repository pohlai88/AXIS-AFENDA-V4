import type { SliceCreator, AnyState, SetState, GetState } from "./_zustand.types";
import type { StoreApi } from "zustand";

/**
 * Slice utilities for composing large stores.
 * Use slices to organize related state and actions together.
 */

/**
 * Create a slice with consistent pattern.
 */
export function createSlice<TState extends AnyState, TSlice extends AnyState>(
  creator: SliceCreator<TState, TSlice>
): SliceCreator<TState, TSlice> {
  return creator;
}

/**
 * Merge multiple slices into a single state object.
 */
export function mergeSlices<
  TState extends AnyState,
  TSlices extends readonly SliceCreator<TState, AnyState>[]
>(
  ...slices: TSlices
): (
  set: SetState<TState>,
  get: GetState<TState>,
  api: StoreApi<TState>
) => UnionToIntersection<ReturnType<TSlices[number]>> {
  return (set, get, api) => {
    return slices.reduce<UnionToIntersection<ReturnType<TSlices[number]>>>((acc, slice) => {
      return { ...acc, ...slice(set, get, api) };
    }, {} as UnionToIntersection<ReturnType<TSlices[number]>>);
  };
}

/**
 * Type helper to convert union to intersection.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

/**
 * Example slice pattern for pagination.
 */
export type PaginationSlice = {
  page: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
};

export function createPaginationSlice<TState extends AnyState>(
  defaults: { page?: number; pageSize?: number; total?: number } = {}
): SliceCreator<TState, PaginationSlice> {
  return (set, get) => ({
    page: defaults.page ?? 1,
    pageSize: defaults.pageSize ?? 20,
    total: defaults.total ?? 0,

    setPage: (page) => set({ page } as Partial<TState>),
    setPageSize: (pageSize) => set({ pageSize, page: 1 } as Partial<TState>),
    setTotal: (total) => set({ total } as Partial<TState>),

    nextPage: () => {
      const state = get() as unknown as TState & PaginationSlice;
      const maxPage = Math.ceil(state.total / state.pageSize);
      if (state.page < maxPage) {
        set({ page: state.page + 1 } as Partial<TState>);
      }
    },

    prevPage: () => {
      const state = get() as unknown as TState & PaginationSlice;
      if (state.page > 1) {
        set({ page: state.page - 1 } as Partial<TState>);
      }
    },

    resetPagination: () =>
      set({
        page: defaults.page ?? 1,
        pageSize: defaults.pageSize ?? 20,
        total: defaults.total ?? 0,
      } as Partial<TState>),
  });
}

/**
 * Example slice pattern for loading state.
 */
export type LoadingSlice = {
  isLoading: boolean;
  error: Error | null;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
};

export function createLoadingSlice<TState extends AnyState>(): SliceCreator<TState, LoadingSlice> {
  return (set) => ({
    isLoading: false,
    error: null,

    setLoading: (isLoading) => set({ isLoading } as Partial<TState>),
    setError: (error) => set({ error, isLoading: false } as Partial<TState>),
    clearError: () => set({ error: null } as Partial<TState>),
  });
}

/**
 * Example slice pattern for modal state.
 */
export type ModalSlice<TData = unknown> = {
  isOpen: boolean;
  modalData: TData | null;
  openModal: (data?: TData) => void;
  closeModal: () => void;
  toggleModal: () => void;
};

export function createModalSlice<TState extends AnyState, TData = unknown>(): SliceCreator<
  TState,
  ModalSlice<TData>
> {
  return (set, get) => ({
    isOpen: false,
    modalData: null,

    openModal: (data) => set({ isOpen: true, modalData: data ?? null } as Partial<TState>),
    closeModal: () => set({ isOpen: false, modalData: null } as Partial<TState>),
    toggleModal: () => {
      const state = get() as unknown as TState & ModalSlice<TData>;
      set({ isOpen: !state.isOpen } as Partial<TState>);
    },
  });
}
