import { create } from "zustand";

type ErrorStore = {
  error: string | null;
  setError: (error: string | null) => void;
};

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  setError: (error) => set({ error }),
}));
