import { describe, expect, it } from 'vitest';
import { buildLibrarySearchPath, findActiveNavigationItem } from './navigation';

const items = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Thư viện', path: '/library' },
  { label: 'AI', path: '/ai' },
] as const;

describe('workspace navigation', () => {
  it('keeps a section active on its detail routes', () => {
    expect(findActiveNavigationItem(items, '/library/42')?.label).toBe('Thư viện');
  });

  it('does not treat a similarly prefixed route as active', () => {
    expect(findActiveNavigationItem(items, '/library-old')).toBeUndefined();
  });

  it('only activates home on the exact root path', () => {
    expect(findActiveNavigationItem(items, '/')?.label).toBe('Trang chủ');
    expect(findActiveNavigationItem(items, '/profile')).toBeUndefined();
  });

  it('builds a safe library search URL', () => {
    expect(buildLibrarySearchPath('  trí tuệ nhân tạo  ')).toBe(
      '/library?q=tr%C3%AD%20tu%E1%BB%87%20nh%C3%A2n%20t%E1%BA%A1o',
    );
    expect(buildLibrarySearchPath('   ')).toBe('/library');
  });
});
