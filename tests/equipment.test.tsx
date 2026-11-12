import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { EquipmentTable } from "../src/pages/equipment/EquipmentTable";
import { EquipmentHistoryContent } from "../src/pages/equipment/EquipmentHistory";
import { filterHolders } from "../src/pages/equipment/holders";
import { getEquipment, takeEquipment } from "../src/api/equipment";
import type { EquipmentItem } from "../src/api/equipment";

const item: EquipmentItem = { id: 1, name: "Микрофон", description: "Радио",
  holder_user: { id: 7, name: "Иван Тестов", login: "ivan" }, location: null,
  taken_at: "2026-11-12T10:00:00", version: 2 };

function table(canManage: boolean, value = item) {
  return renderToStaticMarkup(<MemoryRouter><EquipmentTable items={[value]}
    canManage={canManage} pending={false} onTake={() => {}} onEdit={() => {}} onHistory={() => {}} />
  </MemoryRouter>);
}

test("ordinary members can take and inspect history but cannot manually edit", () => {
  const html = table(false);
  assert.match(html, /Взял предмет/);
  assert.match(html, /История/);
  assert.doesNotMatch(html, /Редактировать/);
  assert.match(html, /href="\/user\/ivan"/);
  assert.match(table(true), /Редактировать/);
});

test("storage holders display their label without a profile link or taken date", () => {
  const html = table(false, { ...item, holder_user: null, location: { id: 1, name: "в главке" }, taken_at: null });
  assert.match(html, /в главке/);
  assert.doesNotMatch(html, /\/user\//);
  assert.match(html, /Ещё не взят/);
});

test("history renders immutable recipients, actors and locations with profile links", () => {
  const html = renderToStaticMarkup(<MemoryRouter><EquipmentHistoryContent events={[
    { id: 2, action: "taken", holder_name: "Иван Тестов", holder_login: "ivan", actor_name: "Иван Тестов",
      actor_login: "ivan", taken_at: "2026-11-12T10:00:00", recorded_at: "2026-11-12T10:00:00" },
    { id: 1, action: "created", holder_name: "в главке", holder_login: null, actor_name: "Админ",
      actor_login: "admin", taken_at: null, recorded_at: "2026-11-11T10:00:00" },
  ]} /></MemoryRouter>);
  assert.match(html, /Иван Тестов/);
  assert.match(html, /в главке/);
  assert.match(html, /href="\/user\/ivan"/);
  assert.match(html, /href="\/user\/admin"/);
  assert.match(html, /Взятие предмета/);
});

test("holder search matches names, logins and locations without mixing their IDs", () => {
  const options = { users: [{ id: 1, name: "Иван Тестов", login: "ivan" }], locations: [{ id: 1, name: "в главке" }] };
  assert.deepEqual(filterHolders(options, "IVAN"), [{ value: "user:1", label: "Иван Тестов", detail: "@ivan" }]);
  assert.deepEqual(filterHolders(options, "главке"), [{ value: "location:1", label: "в главке", detail: "Место хранения" }]);
  assert.equal(filterHolders(options, "никого").length, 0);
});

test("equipment API sends member token and checkout version without a client owner or date", async () => {
  const original = globalThis.fetch;
  const token = localStorage.getItem("jwt_token");
  localStorage.setItem("jwt_token", "member-equipment");
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer member-equipment");
      if (init?.method === "POST") {
        assert.equal(url, "/api/equipment/1/take");
        assert.deepEqual(JSON.parse(String(init.body)), { version: 2 });
        return new Response(JSON.stringify(item));
      }
      assert.equal(url, "/api/equipment");
      return new Response(JSON.stringify([item]));
    };
    assert.deepEqual(await getEquipment(), [item]);
    assert.deepEqual(await takeEquipment(item), item);
    globalThis.fetch = async () => new Response(JSON.stringify({ detail: "Предмет уже изменён" }), { status: 409 });
    await assert.rejects(takeEquipment(item), /Предмет уже изменён/);
  } finally {
    globalThis.fetch = original;
    if (token) localStorage.setItem("jwt_token", token); else localStorage.removeItem("jwt_token");
  }
});
