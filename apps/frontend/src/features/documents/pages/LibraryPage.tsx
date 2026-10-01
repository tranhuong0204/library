import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeDocument, normalizeCategory } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Eye, Download, BookOpen, LayoutGrid, List as ListIcon, Calendar, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const selectedCategoryId = searchParams.get('category') ? Number(searchParams.get('category')) : null;
  const searchQuery = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort');
  const sortBy: 'date' | 'title' | 'popularity' =
    sortParam === 'title' || sortParam === 'popularity' ? sortParam : 'date';

  // Query: Fetch categories list
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeCategory);
    },
  });

  // Query: Fetch documents list
  const { data: rawDocuments = [], isLoading: isDocsLoading, isFetching: isDocsFetching } = useQuery({
    queryKey: ['documents', 'list', selectedCategoryId, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/documents', {
        params: {
          categoryId: selectedCategoryId || undefined,
          q: searchQuery.trim() || undefined,
        },
      });
      return (Array.isArray(res.data) ? res.data : []).map(normalizeDocument);
    },
    placeholderData: (previousData) => previousData,
  });

  const filteredDocuments = useMemo(() => [...rawDocuments].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' });
      }
      if (sortBy === 'popularity') {
        const popA = a.viewCount + a.downloadCount;
        const popB = b.viewCount + b.downloadCount;
        return popB - popA;
      }
      // Default: Date order descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }), [rawDocuments, sortBy]);
  const activeCategory = categories.find((category) => category.id === selectedCategoryId);

  const handleCategorySelect = (categoryId: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', String(categoryId));
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams);
    const normalizedQuery = q.trim();

    if (normalizedQuery) {
      params.set('q', normalizedQuery);
      // A text search always covers the whole library. This avoids hiding a
      // valid result behind a category selected before the user started typing.
      params.delete('category');
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const handleSortChange = (value: 'date' | 'title' | 'popularity') => {
    const params = new URLSearchParams(searchParams);
    if (value === 'date') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    setSearchParams(params);
  };

  return (
    <AppShell>
      <PageHeader
        title="Thư viện tài liệu"
        description="Khám phá tài liệu số, giáo trình và tài liệu nghiên cứu liên quan đến chuyên ngành của bạn."
      />



      <div className="library-layout">
        {/* Top Control Bar */}
        <div className="library-toolbar">
          <div className="library-search-wrap">
            <SearchInput
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Tìm kiếm tài liệu theo tiêu đề, tác giả..."
              className="library-search-input"
            />
            {isDocsFetching && !isDocsLoading && (
              <span className="library-fetching">
                Đang tìm trong thư viện...
              </span>
            )}
          </div>

          <div className="library-toolbar-actions">
            {/* Sort Dropdown */}
            <label className="library-sort">
              <ArrowUpDown size={16} />
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'date' | 'title' | 'popularity')}
                aria-label="Sắp xếp tài liệu"
              >
                <option value="date">Mới nhất</option>
                <option value="title">Tên A-Z</option>
                <option value="popularity">Xem nhiều nhất</option>
              </select>
            </label>

            {/* View switcher buttons */}
            <div className="library-view-switch" aria-label="Kiểu hiển thị">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'is-active' : ''}
                aria-label="Hiển thị dạng lưới"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'is-active' : ''}
                aria-label="Hiển thị dạng danh sách"
                aria-pressed={viewMode === 'list'}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Tabs */}
        <div className="library-category-strip">
          <button
            type="button"
            onClick={() => handleCategorySelect(null)}
            className={`category-pill-btn ${selectedCategoryId === null ? 'is-active' : ''}`}
          >
            Tất cả tài liệu
          </button>
          {isCategoriesLoading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ width: '80px', height: '30px', borderRadius: 'var(--radius-full)' }}
              />
            ))
            : categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`category-pill-btn ${selectedCategoryId === cat.id ? 'is-active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
        </div>

        <div className="library-result-bar">
          <div>
            <SlidersHorizontal size={16} />
            <span>
              <strong>{filteredDocuments.length}</strong> tài liệu
              {activeCategory ? ` trong “${activeCategory.name}”` : ''}
              {searchQuery ? ` cho “${searchQuery}”` : ''}
            </span>
          </div>
          {(selectedCategoryId || searchQuery || sortBy !== 'date') && (
            <button type="button" onClick={() => setSearchParams({})}>Xóa bộ lọc</button>
          )}
        </div>

        {/* Documents Grid/List results */}
        {isDocsLoading ? (
          <div className="grid-responsive-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <div className="skeleton-shimmer" style={{ height: '160px' }} />
                <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton-shimmer" style={{ height: '20px', width: '70%' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '50%' }} />
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '30%' }} />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ padding: 'var(--spacing-8)' }}>
            <EmptyState
              title="Không tìm thấy tài liệu"
              message={
                searchQuery
                  ? `Không tìm thấy tài liệu nào khớp với từ khóa "${searchQuery}"`
                  : 'Danh mục này hiện tại chưa được đăng tải tài liệu nào.'
              }
              icon={<BookOpen size={48} />}
            />
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid-responsive-cards">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                hoverable
                className="library-document-card"
                onClick={() => navigate(`/library/${doc.id}`)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Document Cover or Fallback */}
                <div
                  style={{
                    height: '180px',
                    backgroundColor: 'var(--color-slate-100)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {doc.coverUrl ? (
                    <img
                      src={doc.coverUrl}
                      alt={doc.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen size={48} style={{ color: 'var(--color-slate-300)' }} />
                  )}
                  <Badge
                    variant="primary"
                    style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '10px' }}
                  >
                    {doc.fileType || 'PDF'}
                  </Badge>
                </div>
                <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--color-slate-900)',
                      lineHeight: '1.4',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={doc.title}
                  >
                    {doc.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                    Tác giả: {doc.author || 'Chưa cập nhật'}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', fontWeight: 600, margin: 0 }}>
                    {doc.categoryName}
                  </p>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 'var(--spacing-2)',
                      borderTop: '1px solid var(--color-slate-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-slate-400)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} />
                      <span>{doc.viewCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={12} />
                      <span>{doc.downloadCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          /* List View Layout */
          <div className="library-document-list">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                hoverable
                onClick={() => navigate(`/library/${doc.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <CardBody style={{ display: 'flex', gap: 'var(--spacing-4)', padding: 'var(--spacing-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '80px',
                      backgroundColor: 'var(--color-slate-100)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {doc.coverUrl ? (
                      <img
                        src={doc.coverUrl}
                        alt={doc.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <BookOpen size={24} style={{ color: 'var(--color-slate-300)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <Badge variant="primary" style={{ fontSize: '9px', padding: '2px 4px' }}>
                        {doc.fileType}
                      </Badge>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-600)', fontWeight: 600 }}>
                        {doc.categoryName}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: '2px', color: 'var(--color-slate-900)' }}>
                      {doc.title}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-500)', margin: 0 }}>
                      Tác giả: {doc.author || 'Chưa cập nhật'} | Đăng bởi: {doc.uploadedByName}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-4)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-slate-400)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={14} />
                      <span>{doc.viewCount} lượt xem</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={14} />
                      <span>{doc.downloadCount} lượt tải</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

    </AppShell>
  );
}
