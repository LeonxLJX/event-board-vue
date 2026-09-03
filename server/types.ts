
/**
 * Event types.
 */

export interface EventItem {
  id: string;
  name: string;
  venue: string;
  city: string;
  date: string; // ISO date YYYY-MM-DD
  genre: string;
  priceCents: number;
  createdAt: number;
}

export interface EventQuery {
  q?: string;
  city?: string;
  genre?: string;
  page?: number;
  pageSize?: number;
}
