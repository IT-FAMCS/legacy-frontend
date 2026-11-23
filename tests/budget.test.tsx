import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BudgetLedger, BudgetRequests } from "../src/pages/budget/page";

test("budget ledger separates months and displays negative account balances", () => {
  const html=renderToStaticMarkup(<BudgetLedger data={{balances:{cash:"0.00",card:"-12.34"},years:[{year:2026,months:[{month:1,entries:[]},{month:2,entries:[]}]}]}} onEdit={()=>{}} />);
  assert.match(html, /2026/); assert.match(html, /январь/); assert.match(html, /февраль/);
  assert.match(html, /budget-negative/); assert.match(html, /12,34/);
});
test("pending requests show amounts and corrections without decision buttons or receipt IDs", () => {
  const html=renderToStaticMarkup(<BudgetRequests requests={[{id:1,request_type:"reimbursement",applicant_name:"Иван",departments:["ИТ"],description:"Кабель",amount:"15.00",submitted_amount:"12.34",payout_details:"card 123",status:"pending",created_at:"2026-11-22T10:00:00",amount_changes:[{old_amount:"12.34",new_amount:"15.00",editor_id:2,created_at:"2026-11-22T11:00:00"}]}]} onEdit={()=>{}} />);
  assert.match(html, /Иван/); assert.match(html, /ИТ/); assert.match(html, /12,34/); assert.match(html, /15,00/);
  assert.doesNotMatch(html,/Одобрить|Не одобрить|telegram_file_id|<img/);
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BudgetPage } from "../src/pages/budget/page";
import { BudgetApiError } from "../src/api/budget";
import { useUserStore } from "../src/stores/user";
test("permission revocation hides cached finance data", () => {
  const client=new QueryClient();
  client.setQueryData(["budget","ledger"],{balances:{cash:"12345.67",card:"0.00"},years:[]});
  client.getQueryCache().find({queryKey:["budget","ledger"]})!.setState({status:"error",error:new BudgetApiError("Forbidden",403)});
  const initial=useUserStore.getInitialState();
  const oldUser=initial.user;initial.user={can_view_budget:true};
  useUserStore.setState({user:{can_view_budget:true}});
  const html=renderToStaticMarkup(<QueryClientProvider client={client}><BudgetPage/></QueryClientProvider>);
  assert.doesNotMatch(html,/12.345,67|budget-balances|Добавить операцию/);
  initial.user=oldUser;useUserStore.setState({user:{}});client.clear();
});

test("ledger shows creator and applicant profiles, delete action and collapsible months", () => {
  const html=renderToStaticMarkup(<BudgetLedger data={{balances:{cash:"0.00",card:"0.00"},years:[{year:2026,months:[{month:11,entries:[{id:4,direction:"expense",account:"cash",amount:"12.34",description:"Cable",operation_at:"2026-11-23T10:00:00",request_id:1,created_by:2,updated_by:2,updated_at:"2026-11-23T10:00:00",created_by_name:"Казначей",created_by_login:"cashier",applicant_name:"Михаил",applicant_login:"mikhail"}]}]}]}} onEdit={()=>{}} onDelete={()=>{}}/>);
  assert.match(html, /<details[^>]*class="budget-month"/);assert.match(html,/<summary/);
  assert.match(html,/href="\/user\/cashier"/);assert.match(html,/href="\/user\/mikhail"/);
  assert.match(html,/Удалить/);assert.match(html,/Казначей/);assert.match(html,/Михаил/);
});

test("month heading shows income, expenses and net even when collapsed",()=>{
  const html=renderToStaticMarkup(<BudgetLedger data={{balances:{cash:"87.96",card:"0.00"},years:[{year:2026,months:[{month:11,entries:[],income_total:"100.30",expense_total:"12.34",net_total:"87.96"}]}]}} onEdit={()=>{}}/>);
  const heading=html.match(/<summary[^>]*>(.*?)<\/summary>/s)![1];
  assert.match(heading,/100,30/);assert.match(heading,/12,34/);assert.match(heading,/87,96/);
});

import { BudgetImportButton } from "../src/pages/budget/import-dialog";
import { Treasurers, TreasurerSelect } from "../src/pages/budget/treasurers";
test("Google Sheets button follows server admin capability",()=>{
  assert.equal(renderToStaticMarkup(<BudgetImportButton allowed={false} onClick={()=>{}}/>),"");
  assert.match(renderToStaticMarkup(<BudgetImportButton allowed onClick={()=>{}}/>),/Google Sheets/);
});
test("custody displays separate accounts and owner may be empty",()=>{
  const person={user_id:2,name:"Иван",login:"ivan",is_treasurer:true,can_edit:true,balances:{cash:"123.45",card:"-8.90"}};
  const html=renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}><Treasurers people={[person]} onRefresh={async()=>{}}/></QueryClientProvider>);
  assert.match(html,/123,45/);assert.match(html,/8,90/);assert.match(html,/Наличные/);assert.match(html,/Карта/);assert.match(html,/Установить наличные/);
  const select=renderToStaticMarkup(<TreasurerSelect people={[person]} value={null}/>);
  assert.match(select,/<option value="" selected="">Не указан/);
});

test("treasurer selection retains current actor while options load",()=>{
  const html=renderToStaticMarkup(<TreasurerSelect people={[]} value={42}/>);
  assert.match(html,/<option value="42" selected="">/);
});
