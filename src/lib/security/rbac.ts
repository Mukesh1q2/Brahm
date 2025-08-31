export type RBACContext = {
  userId?: string;
};

export function withRowOwner(init: RequestInit = {}, ownerId?: string): RequestInit {
  const headers = new Headers(init.headers || {});
  if (ownerId) headers.set('x-row-owner', ownerId);
  return { ...init, headers };
}

