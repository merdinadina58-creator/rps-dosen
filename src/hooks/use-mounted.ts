import { useSyncExternalStore } from 'react'

/**
 * Returns `true` after the component has mounted on the client.
 * Uses `useSyncExternalStore` (React 19 recommended pattern) to avoid:
 *   - Hydration mismatches (server renders `false`, client renders `true` after mount)
 *   - The `react-hooks/set-state-in-effect` lint error that `useEffect(() => setMounted(true))` triggers
 *
 * Common use cases:
 *   - Deferring rendering of client-only UI (Radix Sheet/Dialog, theme toggles)
 *   - Reading browser-only values (localStorage, window.matchMedia)
 *
 * @example
 * const mounted = useMounted()
 * return mounted ? <ClientOnlyComponent /> : <Placeholder />
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    // subscribe: no-op because "mounted" never changes after first render
    () => () => {},
    // getSnapshot: always true once running on client
    () => true,
    // getServerSnapshot: false during SSR and first client render
    () => false
  )
}
