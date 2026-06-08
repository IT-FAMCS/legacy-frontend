import { create } from "zustand";

type ErrorStore = {
  error: string | null;
  success: string | null;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
};

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  success: null,
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
}));
