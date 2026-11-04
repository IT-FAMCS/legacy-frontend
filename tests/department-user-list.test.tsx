import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { MarkdownRenderer } from "../src/components/MarkdownRenderer";

function renderRoster(users: { id: number; first_name: string; is_active: boolean; is_deactivated: boolean; departments: { id: number; name: string }[] }[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["departments"], [{ id: 1, name: "IT" }, { id: 2, name: "SMM" }]);
  client.setQueryData(["users", "all"], users.map(user => ({
    login: `user${user.id}`, last_name: "Test", middle_name: null, course: null,
    group: null, telegram: null, position_name: "участник", ...user,
  })));
  try {
    return renderToStaticMarkup(<MemoryRouter><QueryClientProvider client={client}>
      <MarkdownRenderer content=":::users IT" />
    </QueryClientProvider></MemoryRouter>);
  } finally {
    client.clear();
  }
}

const it = [{ id: 1, name: "IT" }];

test("Markdown roster hides deactivated and inactive accounts, preserving department filtering", () => {
  const html = renderRoster([
    { id: 1, first_name: "ActiveVisible", is_active: true, is_deactivated: false, departments: it },
    { id: 2, first_name: "DeactivatedHidden", is_active: false, is_deactivated: true, departments: it },
    { id: 3, first_name: "FlaggedHidden", is_active: true, is_deactivated: true, departments: it },
    { id: 4, first_name: "InactiveHidden", is_active: false, is_deactivated: false, departments: it },
    { id: 5, first_name: "OtherDepartmentHidden", is_active: true, is_deactivated: false, departments: [{ id: 2, name: "SMM" }] },
  ]);
  assert.match(html, /ActiveVisible/);
  for (const name of ["DeactivatedHidden", "FlaggedHidden", "InactiveHidden", "OtherDepartmentHidden"])
    assert.doesNotMatch(html, new RegExp(name));
});

test("Markdown roster shows its empty state when all department members are deactivated", () => {
  const html = renderRoster([
    { id: 1, first_name: "DeactivatedHidden", is_active: false, is_deactivated: true, departments: it },
  ]);
  assert.doesNotMatch(html, /<table/);
  assert.match(html, /В этом отделе пока нет пользователей/);
});
