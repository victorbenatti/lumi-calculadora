import type { CatalogFilters } from '../components/FilterPanel';

const CATALOG_NAVIGATION_KEY = 'lumi:catalog-navigation';
const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000;

export type CatalogNavigationSnapshot = {
  filters: CatalogFilters;
  page: number;
  scrollY: number;
  savedAt: number;
};

const getSessionStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export function saveCatalogNavigation(snapshot: Omit<CatalogNavigationSnapshot, 'savedAt'>) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      CATALOG_NAVIGATION_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() })
    );
  } catch {
    // A navegação continua normalmente quando o navegador bloqueia o storage.
  }
}

export function getPendingCatalogNavigation(): CatalogNavigationSnapshot | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const rawSnapshot = storage.getItem(CATALOG_NAVIGATION_KEY);
    if (!rawSnapshot) return null;

    const snapshot = JSON.parse(rawSnapshot) as Partial<CatalogNavigationSnapshot>;
    const isValid =
      snapshot.filters !== null &&
      typeof snapshot.filters === 'object' &&
      Number.isInteger(snapshot.page) &&
      (snapshot.page ?? 0) > 0 &&
      typeof snapshot.scrollY === 'number' &&
      snapshot.scrollY >= 0 &&
      typeof snapshot.savedAt === 'number' &&
      Date.now() - snapshot.savedAt < MAX_SNAPSHOT_AGE_MS;

    if (!isValid) {
      clearPendingCatalogNavigation();
      return null;
    }

    return snapshot as CatalogNavigationSnapshot;
  } catch {
    clearPendingCatalogNavigation();
    return null;
  }
}

export function clearPendingCatalogNavigation() {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.removeItem(CATALOG_NAVIGATION_KEY);
  } catch {
    // Sem impacto: o snapshot expira e só existe durante a sessão atual.
  }
}
