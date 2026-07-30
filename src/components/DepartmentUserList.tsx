import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { getUsers, getDepartments } from "../api/user";

type DeptListDepartment = { id: number; name: string };

type DeptListUser = {
  id: number;
  login: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  course: string | null;
  group: string | null;
  telegram: string | null;
  position_name: string | null;
  departments?: DeptListDepartment[];
};

type SortKey = "name" | "position" | "course" | "group";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function sortValueOf(user: DeptListUser, key: SortKey): string {
  switch (key) {
    case "name":
      return `${user.last_name} ${user.first_name} ${user.middle_name || ""}`.trim();
    case "position":
      return user.position_name || "";
    case "course":
      return user.course || "";
    case "group":
      return user.group || "";
  }
}

// Numeric-aware: course/group are often bare numbers ("2", "10") where plain
// localeCompare would sort "10" before "2" — same helper as account-list.
function compareSortValues(a: string, b: string): number {
  const aNum = Number(a);
  const bNum = Number(b);
  if (a !== "" && b !== "" && !Number.isNaN(aNum) && !Number.isNaN(bNum)) {
    return aNum - bNum;
  }
  return a.localeCompare(b, "ru");
}

// Embedded in card content via the `:::users Название отдела` markdown block
// (see MarkdownRenderer.tsx) — shows a live snapshot of who's currently in
// the named department(s), so cards can reference "who's on this" without
// manually retyping a name list that goes stale the moment someone joins or
// leaves. Comma-separated names match multiple departments at once.
export function DepartmentUserList({ departmentNames }: { departmentNames: string[] }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: departments, isLoading: loadingDepartments } = useQuery<DeptListDepartment[]>({
    queryKey: ["departments"],
    queryFn: ({ signal }) => getDepartments({ signal }),
  });

  const { data: users, isLoading: loadingUsers } = useQuery<DeptListUser[]>({
    queryKey: ["users", "all"],
    queryFn: ({ signal }) => getUsers({ signal }),
  });

  const matchedDepartments = (departments || []).filter((d) =>
    departmentNames.some((name) => normalizeName(name) === normalizeName(d.name)),
  );
  const notFoundNames = departmentNames.filter(
    (name) => !(departments || []).some((d) => normalizeName(d.name) === normalizeName(name)),
  );
  const matchedIds = new Set(matchedDepartments.map((d) => d.id));
  const filteredUsers = (users || []).filter((u) => (u.departments || []).some((d) => matchedIds.has(d.id)));

  const sortedUsers = useMemo(() => {
    if (!sortKey) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const cmp = compareSortValues(sortValueOf(a, sortKey), sortValueOf(b, sortKey));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredUsers, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIcon = (key: SortKey) => {
    const isActive = sortKey === key;
    const icon = isActive ? (sortDir === "asc" ? "▲" : "▼") : "⇅";
    return (
      <span style={{ marginLeft: "6px", opacity: isActive ? 1 : 0.5, fontSize: "12px" }}>{icon}</span>
    );
  };

  if (loadingDepartments || loadingUsers) {
    return <p className="markdown-department-list-empty">Загрузка списка пользователей…</p>;
  }

  if (matchedDepartments.length === 0) {
    return (
      <p className="markdown-department-list-empty">
        Отдел{departmentNames.length > 1 ? "ы" : ""} «{departmentNames.join(", ")}» не найден
        {departmentNames.length > 1 ? "ы" : ""}.
      </p>
    );
  }

  return (
    <div className="markdown-department-list">
      <div className="markdown-department-list-title">
        Списочный состав
        {notFoundNames.length > 0 && (
          <span className="markdown-department-list-warning"> (не найдено: {notFoundNames.join(", ")})</span>
        )}
      </div>

      {sortedUsers.length === 0 ? (
        <p className="markdown-department-list-empty">В этом отделе пока нет пользователей.</p>
      ) : (
        <div className="markdown-table-wrapper">
          <table>
            <thead>
              <tr>
                <th className="markdown-department-list-sortable" onClick={() => handleSort("name")}>
                  ФИО{sortIcon("name")}
                </th>
                <th className="markdown-department-list-sortable" onClick={() => handleSort("position")}>
                  Должность{sortIcon("position")}
                </th>
                <th className="markdown-department-list-sortable" onClick={() => handleSort("course")}>
                  Курс{sortIcon("course")}
                </th>
                <th className="markdown-department-list-sortable" onClick={() => handleSort("group")}>
                  Группа{sortIcon("group")}
                </th>
                <th>Telegram</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span
                      className="markdown-department-list-link"
                      onClick={() => navigate(`/user/${u.login}`)}
                    >
                      {u.last_name} {u.first_name} {u.middle_name || ""}
                    </span>
                  </td>
                  <td>{u.position_name || "-"}</td>
                  <td>{u.course || "-"}</td>
                  <td>{u.group || "-"}</td>
                  <td>
                    {u.telegram ? (
                      <a
                        href={`https://t.me/${u.telegram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {u.telegram}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
