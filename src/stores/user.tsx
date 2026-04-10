import { create } from "zustand";

export type UserRole = "admin" | "chairman" | "member" | "guest";

export type UserInfo = {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  patronymic?: string;
  course?: number;
  group?: number;
  department?: string;
  position: string;
  hb?: string;
  role: UserRole;
  isActive: boolean;
} | null;

export type UserStoreState = {
  user: Partial<UserInfo>;
  isAuthenticated: boolean;
};

export type UserStoreAction = {
  setUserInfo: (userInfo: UserInfo) => void;
  logout: () => void;
};

export const useUserStore = create<UserStoreState & UserStoreAction>((set) => ({
  user: {},
  isAuthenticated: false,
  setUserInfo: (userInfo: UserInfo) => {
    set((state) => {
      return { 
        ...state, 
        user: userInfo,
        isAuthenticated: !!userInfo 
      };
    });
  },
  logout: () => {
    set({ user: {}, isAuthenticated: false });
  },
}));
