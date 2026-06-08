export type Card = {
  id: number;
  title: string;
  content: string | null;
  category_id: number;
  category_name?: string;
  access_positions: string | null;
  access_logins: string | null;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type CategoryCreate = {
  name: string;
  description?: string;
};

export type CardCreate = {
  title: string;
  content?: string;
  category_id: number;
  access_positions?: string;
  access_logins?: string;
};

export type VisitHistory = {
  id: number;
  item_id: number;
  item_name: string;
  visited_at: string;
};
