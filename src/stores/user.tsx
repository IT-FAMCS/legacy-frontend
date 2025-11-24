import { create } from "zustand";

//заглушка пока не сделают сваггер
export type UserInfo = {
  login: string;
  firstName: string;
  lastName: string;
  course: number;
  group: number;
  position: string;
  hb: string;
} | null;

export type UserStoreState = {
  user: Partial<UserInfo>;
};

export type UserStoreAction = {
  setUserInfo: (userInfo: UserInfo) => void;
};

export const useUserStore = create<UserStoreState & UserStoreAction>((set) => ({
  user: {},
  setUserInfo: (userInfo: UserInfo) => {
    set((state) => {
      return { ...state, user: userInfo };
    });
  },
}));
