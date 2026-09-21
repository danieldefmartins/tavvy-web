/** The durable deletion backend is not active in this release. No network or auth side effects. */
export type AccountDeletionAvailability = { status: 'unavailable'; code: 'ACCOUNT_DELETION_UNAVAILABLE' };
export const ACCOUNT_DELETION_NOTICE = 'Account deletion cannot be started in this version.';
export async function getAccountDeletionAvailability(): Promise<AccountDeletionAvailability> {
  return { status: 'unavailable', code: 'ACCOUNT_DELETION_UNAVAILABLE' };
}
export class AccountDeletionUnavailableError extends Error {
  readonly code = 'ACCOUNT_DELETION_UNAVAILABLE';
  constructor() { super(ACCOUNT_DELETION_NOTICE); this.name = 'AccountDeletionUnavailableError'; }
}
/** Kept for existing callers. Never invoke the old destructive Edge Function or sign out. */
export async function deleteCurrentAccount(): Promise<never> { throw new AccountDeletionUnavailableError(); }

/** A late result from another account, session, press or unmounted screen is ignored. */
export function createDeletionViewGuard() {
  let generation = 0, subject: string | null = null, session: string | null = null, mounted = true;
  return {
    setSession(nextSubject: string | null, nextSession: string | null) {
      if (nextSubject !== subject || nextSession !== session) { subject = nextSubject; session = nextSession; generation++; }
    },
    begin() { return ++generation; },
    current(ticket: number) { return mounted && generation === ticket; },
    mount() { mounted = true; },
    dispose() { mounted = false; generation++; },
  };
}
