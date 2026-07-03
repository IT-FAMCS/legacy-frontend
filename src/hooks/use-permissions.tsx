import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "../stores/user";
import { getPositions } from "../api/user";
import { getPositionFlags, clearPositionsCache } from "../utils/permissions";
import type { Position } from "../types/Position";

/**
 * Hook to manage user permissions based on position flags from backend
 */
export function usePermissions() {
  const user = useUserStore((s) => s.user);
  const [positions, setPositions] = useState<Position[]>([]);

  // Fetch positions
  const { data: positionsData } = useQuery({
    queryKey: ["positions"],
    queryFn: ({ signal }) => getPositions({ signal }),
    enabled: !!user?.position_name,
  });

  useEffect(() => {
    if (positionsData) {
      setPositions(positionsData);
    }
  }, [positionsData]);

  // Get position flags for current user
  const flags = getPositionFlags(user?.position_name, positions);

  return {
    ...flags,
    isLoading: !positionsData && !!user?.position_name,
  };
}

/**
 * Hook to check if current user can manage positions
 */
export function useCanManagePositions(): boolean {
  const { can_manage_positions } = usePermissions();
  return can_manage_positions;
}

/**
 * Hook to check if current user can register users
 */
export function useCanRegisterUsers(): boolean {
  const { can_register_users } = usePermissions();
  return can_register_users;
}

/**
 * Hook to check if current user can edit categories
 */
export function useCanEditCategories(): boolean {
  const { can_edit_categories } = usePermissions();
  return can_edit_categories;
}

/**
 * Hook to check if current user can delete categories
 */
export function useCanDeleteCategories(): boolean {
  const { can_delete_categories } = usePermissions();
  return can_delete_categories;
}

/**
 * Hook to check if current user can edit cards
 */
export function useCanEditCards(): boolean {
  const { can_edit_cards } = usePermissions();
  const user = useUserStore((s) => s.user);
  const positionName = user?.position_name?.toLowerCase() || "";
  return (
    can_edit_cards ||
    positionName === "руководитель отдела" ||
    positionName === "руководитель отдела/направления" ||
    positionName === "заместитель руководителя отдела" ||
    positionName.startsWith("заместитель руководителя")
  );
}

/**
 * Hook to check if current user can delete cards
 */
export function useCanDeleteCards(): boolean {
  const { can_delete_cards } = usePermissions();
  const user = useUserStore((s) => s.user);
  const positionName = user?.position_name?.toLowerCase() || "";
  return (
    can_delete_cards ||
    positionName === "admin" ||
    positionName === "админ" ||
    positionName === "председатель" ||
    positionName === "председатель студсовета" ||
    positionName.startsWith("заместитель председателя") ||
    positionName.startsWith("зам. председателя")
  );
}

/**
 * Hook to check if current user can edit any user
 */
export function useCanEditAnyUser(): boolean {
  const { can_edit_any_user } = usePermissions();
  return can_edit_any_user;
}

/**
 * Hook to check if current user can manage departments
 * Backend: admin, председатель, заместитель председателя, председатель студсовета, секретарь
 */
export function useCanManageDepartments(): boolean {
  const user = useUserStore((s) => s.user);
  if (!user?.position_name) return false;
  
  const allowedPositions = ["admin", "председатель", "заместитель председателя", "председатель студсовета", "секретарь"];
  return allowedPositions.includes(user.position_name);
}

// Export clear function for logout
export { clearPositionsCache };
