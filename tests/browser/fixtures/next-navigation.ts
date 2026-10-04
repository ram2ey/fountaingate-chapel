// Browser-only router adapter for the isolated component fixture. Never used by the app.
export function usePathname() { return window.location.pathname; }
export function useRouter() {
  // A document navigation already reloads this fixture; another reload would cancel it.
  return { push: (href: string) => window.location.assign(href), refresh: () => undefined };
}
