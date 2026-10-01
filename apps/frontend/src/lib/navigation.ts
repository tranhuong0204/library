export const findActiveNavigationItem = <T extends { path: string }>(
  items: readonly T[],
  pathname: string,
): T | undefined => (
  [...items]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => (
      item.path === '/'
        ? pathname === '/'
        : pathname === item.path || pathname.startsWith(`${item.path}/`)
    ))
);

export const buildLibrarySearchPath = (value: string): string => {
  const query = value.trim();
  return query ? `/library?q=${encodeURIComponent(query)}` : '/library';
};
