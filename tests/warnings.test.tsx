import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { WarningHistoryContent } from "../src/components/AccountWarnings";
import { EquipmentTable } from "../src/pages/equipment/EquipmentTable";
import { issueWarning, removeWarning } from "../src/api/warnings";
import type { MemberWarning } from "../src/api/warnings";

const entry: MemberWarning = {id:1,user_id:7,reason:"Не вернул микрофон",issued_at:"2026-11-12T10:00:00",
  issued_by:{login:"chair",name:"Председатель"},removed_at:null,removed_by:null,removal_reason:null};

test("warning history preserves issue/removal reasons and links, viewers cannot remove", () => {
  const removed = {...entry,id:2,removed_at:"2026-11-13T10:00:00",removed_by:{login:"deputy",name:"Заместитель"},removal_reason:"Предмет возвращён"};
  const render = (canManage: boolean) => renderToStaticMarkup(<MemoryRouter><WarningHistoryContent
    entries={[entry,removed]} canManage={canManage} onRemove={() => {}} /></MemoryRouter>);
  const viewer = render(false);
  assert.match(viewer,/Не вернул микрофон/);
  assert.match(viewer,/Предмет возвращён/);
  assert.match(viewer,/href="\/user\/chair"/);
  assert.match(viewer,/href="\/user\/deputy"/);
  assert.doesNotMatch(viewer,/>Снять предупреждение</);
  assert.equal((render(true).match(/>Снять предупреждение</g)||[]).length,1);
});

test("equipment deletion is a separate executive-only control", () => {
  const item={id:1,name:"Микрофон",description:"",holder_user:null,location:{id:1,name:"в главке"},taken_at:null,version:1};
  const render = (canDelete: boolean) => renderToStaticMarkup(<MemoryRouter><EquipmentTable items={[item]}
    canManage={true} canDelete={canDelete} pending={false} onTake={() => {}} onEdit={() => {}} onHistory={() => {}} onDelete={() => {}} /></MemoryRouter>);
  assert.doesNotMatch(render(false),/>Удалить</);
  assert.match(render(true),/>Удалить</);
});

test("warning issue and removal send required reason under member authentication", async () => {
  const original=globalThis.fetch;
  const previous=localStorage.getItem("jwt_token");
  localStorage.setItem("jwt_token","warning-manager");
  const requests: string[]=[];
  try {
    globalThis.fetch=async (url,init) => {
      requests.push(String(url));
      assert.equal(new Headers(init?.headers).get("Authorization"),"Bearer warning-manager");
      assert.equal(init?.method,"POST");
      assert.deepEqual(JSON.parse(String(init?.body)),{reason:"Причина"});
      return new Response(JSON.stringify(entry));
    };
    await issueWarning(7,"Причина");
    await removeWarning(1,"Причина");
    assert.deepEqual(requests,["/api/users/7/warnings","/api/warnings/1/remove"]);
  } finally {
    globalThis.fetch=original;
    if(previous) localStorage.setItem("jwt_token",previous); else localStorage.removeItem("jwt_token");
  }
});
