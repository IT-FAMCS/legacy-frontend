import type { Position } from "../types/Position";

// Cache for positions to avoid repeated API calls
let positionsCache: Position[] | null = null;
let positionsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get position flags by position name from the positions list
 */
export function getPositionFlags(positionName: string | null | undefined, positions: Position[]): {
  can_manage_positions: boolean;
  can_register_users: boolean;
  can_edit_categories: boolean;
  can_delete_categories: boolean;
  can_edit_cards: boolean;
  can_delete_cards: boolean;
  can_edit_any_user: boolean;
} {
  if (!positionName) {
    return {
      can_manage_positions: false,
      can_register_users: false,
      can_edit_categories: false,
      can_delete_categories: false,
      can_edit_cards: false,
      can_delete_cards: false,
      can_edit_any_user: false,
    };
  }

  const position = positions.find(p => p.name === positionName);
  
  if (!position) {
    // Default flags for unknown positions
    return {
      can_manage_positions: false,
      can_register_users: false,
      can_edit_categories: false,
      can_delete_categories: false,
      can_edit_cards: false,
      can_delete_cards: false,
      can_edit_any_user: false,
    };
  }

  return {
    can_manage_positions: position.can_manage_positions,
    can_register_users: position.can_register_users,
    can_edit_categories: position.can_edit_categories,
    can_delete_categories: position.can_delete_categories,
    can_edit_cards: position.can_edit_cards,
    can_delete_cards: position.can_delete_cards,
    can_edit_any_user: position.can_edit_any_user,
  };
}

/**
 * Check if positions cache is valid
 */
function isCacheValid(): boolean {
  return positionsCache !== null && Date.now() - positionsCacheTime < CACHE_DURATION;
}

/**
 * Get positions from cache or fetch from API
 */
export async function getPositionsCached(fetchFn: () => Promise<Position[]>): Promise<Position[]> {
  if (isCacheValid() && positionsCache !== null) {
    return positionsCache;
  }
  
  try {
    positionsCache = await fetchFn();
    positionsCacheTime = Date.now();
    return positionsCache;
  } catch (error) {
    console.error('Failed to fetch positions:', error);
    return positionsCache || [];
  }
}

/**
 * Clear positions cache (e.g., on logout)
 */
export function clearPositionsCache(): void {
  positionsCache = null;
  positionsCacheTime = 0;
}
