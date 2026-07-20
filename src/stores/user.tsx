import { create } from "zustand";

export type UserInfo = {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  birth_date?: string | null;
  course?: string | null;
  group?: string | null;
  position_id: number;
  position_name?: string | null;
  department?: string | null;
  departments?: { id: number; name: string }[];
  telegram?: string | null;
  is_active: boolean;
  is_deactivated: boolean;
  last_login?: string | null;
  last_seen_at?: string | null;
  password_changed_at?: string | null;
  // Position flags from backend for permission checks
  can_manage_positions?: boolean;
  can_register_users?: boolean;
  can_edit_categories?: boolean;
  can_delete_categories?: boolean;
  can_edit_cards?: boolean;
  can_delete_cards?: boolean;
  can_edit_any_user?: boolean;
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
    localStorage.removeItem("jwt_token");
    set({ user: {}, isAuthenticated: false });
  },
  checkAuth: () => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      set({ isAuthenticated: true });
    }
  },
}));
