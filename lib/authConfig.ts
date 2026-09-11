// Gates the AuthGate's sign-in requirement and the Profile page's account UI.
export const AUTH_REQUIRED = true;

// The single local profile the app auto-loads while AUTH_REQUIRED is false — progress is
// still stored per-user under this id (see lib/storage.ts), so nothing about the storage
// shape changes when auth is toggled.
export const LOCAL_USER_ID = "local";
