const SESSION_COOKIE_NAME = 'shopping-session';
const SESSION_TIMEOUT_HOURS = 24;

interface SessionData {
  userId: string;
  email?: string;
  expires: number;
}

export function setSession(userId: string, email?: string): void {
  const expires = Date.now() + (SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
  const sessionData: SessionData = { userId, email, expires };
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(sessionData))};path=/;max-age=${SESSION_TIMEOUT_HOURS * 60 * 60}`;
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=;path=/;max-age=0`;
}

export function getSession(): SessionData | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === SESSION_COOKIE_NAME) {
      try {
        const sessionData: SessionData = JSON.parse(decodeURIComponent(value));
        if (sessionData.expires > Date.now()) {
          return sessionData;
        }
        clearSession();
        return null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function hasValidSession(): boolean {
  return getSession() !== null;
}

let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function resetSessionTimeout(onTimeout: () => void): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  const timeoutMs = SESSION_TIMEOUT_HOURS * 60 * 60 * 1000;
  timeoutId = setTimeout(onTimeout, timeoutMs);
}

export function clearSessionTimeout(): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

export function initActivityTracking(onActivity: () => void): () => void {
  const resetTimeout = () => {
    resetSessionTimeout(onActivity);
  };
  
  const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
  events.forEach(event => {
    document.addEventListener(event, resetTimeout, { passive: true });
  });
  
  resetTimeout();
  
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, resetTimeout);
    });
    clearSessionTimeout();
  };
}
