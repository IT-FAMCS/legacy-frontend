import { apiFetch } from "../utils/api-fetch";
import { readErrorResponse } from "../utils/api-error";

export type BudgetEntryInput = { direction: "income" | "expense"; account: "cash" | "card"; amount: string; description: string; operation_at: string };
export type BudgetEntry = BudgetEntryInput & { id: number; request_id: number | null; created_by: number; updated_by: number; updated_at: string };
export type Budget = { balances: { cash: string; card: string }; years: { year: number; months: { month: number; entries: BudgetEntry[] }[] }[] };
export type BudgetRequest = { id: number; request_type: "reimbursement" | "add_funds"; applicant_name: string; departments: string[]; description: string; submitted_amount: string; amount: string; payout_details: string | null; status: string; created_at: string; amount_changes: { old_amount: string; new_amount: string; editor_id: number; created_at: string }[] };
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
