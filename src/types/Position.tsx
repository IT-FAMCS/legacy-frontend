export type Position = {
  id: number;
  name: string;
  hierarchy_level: number;
  can_register_users: boolean;
  can_edit_categories: boolean;
  can_delete_categories: boolean;
  can_edit_cards: boolean;
  can_delete_cards: boolean;
  can_edit_any_user: boolean;
  can_manage_positions: boolean;
  created_at: string;
};

export type UserWithPosition = {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  department: string | null;
  course: string | null;
  group: string | null;
  birth_date: string | null;
  telegram: string | null;
  position_id: number;
  position_name: string | null;
  is_active: boolean;
  is_deactivated: boolean;
  position?: Position;
};

export type PositionCreate = {
  name: string;
  hierarchy_level?: number;
  can_register_users?: boolean;
  can_edit_categories?: boolean;
  can_delete_categories?: boolean;
  can_edit_cards?: boolean;
  can_delete_cards?: boolean;
  can_edit_any_user?: boolean;
  can_manage_positions?: boolean;
};

export type PositionUpdate = Partial<PositionCreate>;
