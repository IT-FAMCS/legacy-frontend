export type Card = {
  id: number;
  title: string;
  content: string;
};

export type Category = {
  id: number;
  title: string;
  description: string;
  cards: Card[];
};
