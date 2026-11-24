import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";

export type BudgetEntryInput = { treasurer_id?: number | null; direction: "income" | "expense"; account: "cash" | "card"; amount: string; description: string; operation_at: string };
export type BudgetEntry = BudgetEntryInput & { treasurer_name?: string | null; treasurer_login?: string | null; id: number; request_id: number | null; created_by: number; updated_by: number; updated_at: string; created_by_name?: string | null; created_by_login?: string | null; updated_by_name?: string | null; updated_by_login?: string | null; applicant_name?: string | null; applicant_login?: string | null };
export type Budget = { total?: string; can_import?: boolean; balances: { cash: string; card: string }; years: { year: number; months: { month: number; income_total?: string; expense_total?: string; net_total?: string; entries: BudgetEntry[] }[] }[] };
export type BudgetRequest = { id: number; request_type: "reimbursement" | "add_funds"; applicant_name: string; applicant_id?: number; applicant_login?: string | null; departments: string[]; description: string; submitted_amount: string; amount: string; payout_details: string | null; status: string; created_at: string; amount_changes: { old_amount: string; new_amount: string; editor_id: number; created_at: string }[] };
export class BudgetApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status=status; }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token=localStorage.getItem("jwt_token");
  const response=await apiFetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/budget${path}`, {
    ...init, credentials:"include", cache:"no-store", headers:{Accept:"application/json", "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {})},
  });
  if (!response.ok) throw new BudgetApiError((await readErrorResponse(response)) || `HTTP ${response.status}`,response.status);
  return response.json() as Promise<T>;
}
export const getBudget = ({signal}: {signal?: AbortSignal} = {}) => request<Budget>("", {signal});
export const getPendingBudgetRequests = ({signal}: {signal?: AbortSignal} = {}) => request<BudgetRequest[]>("/requests?status=pending", {signal});
export const updateBudgetRequestAmount = ({id,amount}: {id:number;amount:string}) => request<BudgetRequest>(`/requests/${id}`, {method:"PATCH",body:JSON.stringify({amount})});
export const createBudgetEntry = (payload:BudgetEntryInput) => request<BudgetEntry>("/entries", {method:"POST",body:JSON.stringify(payload)});
export const updateBudgetEntry = ({id,payload}: {id:number;payload:Partial<BudgetEntryInput>}) => request<BudgetEntry>(`/entries/${id}`, {method:"PATCH",body:JSON.stringify(payload)});

export const deleteBudgetEntry = (entry:BudgetEntry) => request<{ok:boolean}>(`/entries/${entry.id}`, {method:"DELETE",body:JSON.stringify({expected_updated_at:entry.updated_at})});

export type Treasurer = { user_id:number; name:string; login:string; is_treasurer:boolean; can_select?:boolean; can_edit:boolean; balances:{cash:string;card:string} };
export type ImportRow = BudgetEntryInput & {sheet:string;source_row:number;approximate_date:boolean;status:"new"|"skipped"|"conflict"};
export type ImportPreview = {id:string;rows:ImportRow[];skipped_sheets:string[];new_count:number;skipped_count:number;conflict_count:number;income_total:string;expense_total:string};
export const getTreasurers = () => request<Treasurer[]>("/treasurers");
export const setTreasurerBalance = ({id,...payload}:{id:number;account:"cash"|"card";amount:string;expected_balance:string}) => request<{ok:boolean}>(`/treasurers/${id}/balance`,{method:"PUT",body:JSON.stringify(payload)});
export const previewBudgetImport = (payload:{url:string;account:"cash"|"card";treasurer_id:number|null;fallback_month?:string}) => request<ImportPreview>("/imports/preview",{method:"POST",body:JSON.stringify(payload)});
export const commitBudgetImport = (id:string) => request<{created_count:number}>(`/imports/${id}/commit`,{method:"POST"});
