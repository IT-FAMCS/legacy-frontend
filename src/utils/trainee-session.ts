const TRAINEE_TOKEN_KEY = "trainee_token";

export function getTraineeToken(): string | null {
  return localStorage.getItem(TRAINEE_TOKEN_KEY);
}

export function setTraineeToken(token: string): void {
  localStorage.setItem(TRAINEE_TOKEN_KEY, token);
}

export function clearTraineeToken(): void {
  localStorage.removeItem(TRAINEE_TOKEN_KEY);
}
