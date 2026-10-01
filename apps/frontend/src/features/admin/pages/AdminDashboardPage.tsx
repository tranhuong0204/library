import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  FileText,
  MessageSquare,
  Eye,
  Download,
} from 'lucide-react';

interface GrowthPoint {
  month: string;
  label: string;
  users: number;
  documents: number;
  posts: number;
}

interface AiActivityPoint {
  month: string;
  label: string;
  conversations: number;
  questions: number;
}

interface DocumentEngagement {
  id: number;
  title: string;
  viewCount: number;
  downloadCount: number;
  categoryName: string;
}

export default function AdminDashboardPage() {
  // Query: Get dashboard analytics stats
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'analytics', 'dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data;
    },
  });

  const counts = data?.counts || {};
  const systemGrowth: GrowthPoint[] = data?.systemGrowth || [];
  const aiActivity: AiActivityPoint[] = data?.aiActivity || [];
  const trendingDocs: DocumentEngagement[] = data?.trendingDocuments || [];

  return (
    <AdminShell>
      <PageHeader
        title="Bảng quản trị hệ thống"
        description="Theo dõi hoạt động tổng quan, tương tác học viên, thống kê tài liệu học tập và tần suất truy vấn AI RAG."
      />

      {isError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-4)',
            padding: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-5)',
            color: 'var(--color-danger-700)',
            backgroundColor: 'var(--color-danger-50)',
            border: '1px solid var(--color-danger-200)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
          }}
        >
          <span>{(error as any)?.message || 'Không thể tải dữ liệu Dashboard từ backend.'}</span>
          <button
            type="button"
            onClick={() => refetch()}
            style={{ fontWeight: 750, color: 'var(--color-danger-700)', whiteSpace: 'nowrap' }}
          >
            Thử lại
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Row 1: Key Metrics Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-4)',
          }}
        >
          <StatCard
            value={counts.users ?? 0}
            label="Tổng số học viên"
            icon={<Users size={24} />}
            iconBgColor="var(--color-primary-50)"
            iconColor="var(--color-primary-600)"
          />
          <StatCard
            value={counts.documents ?? 0}
            label="Tài liệu học tập"
            icon={<FileText size={24} />}
            iconBgColor="var(--color-success-50)"
            iconColor="var(--color-success-600)"
          />
          <StatCard
            value={counts.posts ?? 0}
            label="Bài đăng diễn đàn"
            icon={<MessageSquare size={24} />}
            iconBgColor="var(--color-warning-50)"
            iconColor="var(--color-warning-600)"
          />
          <StatCard
            value={counts.downloads ?? 0}
            label="Lượt tải tài liệu"
            icon={<Download size={24} />}
            iconBgColor="var(--color-success-50)"
            iconColor="var(--color-success-600)"
          />
        </div>

        {/* Row 3: Recharts Analytics Charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)' }} className="dashboard-charts-layout">
          {/* Chart 1: System Growth (Line Chart) */}
          <Card>
            <CardBody style={{ padding: 'var(--spacing-5)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-primary-950)', margin: '0 0 16px 0' }}>
                Tốc độ phát triển hệ thống
              </h3>
              
              {isLoading ? (
                <div className="skeleton-shimmer" style={{ height: '300px', borderRadius: '4px' }} />
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={systemGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-100)" />
                      <XAxis dataKey="label" stroke="var(--color-slate-400)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-slate-400)" fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line name="Người dùng mới" type="monotone" dataKey="users" stroke="var(--color-primary-600)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line name="Tài liệu tải lên" type="monotone" dataKey="documents" stroke="var(--color-success-600)" strokeWidth={2} />
                      <Line name="Bài đăng diễn đàn" type="monotone" dataKey="posts" stroke="var(--color-warning-600)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Chart 2: AI service workload (single-series bar chart) */}
          <Card>
            <CardBody style={{ padding: 'var(--spacing-5)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-primary-950)', margin: '0 0 16px 0' }}>
                Hoạt động AI Service theo tháng
              </h3>
              
              {isLoading ? (
                <div className="skeleton-shimmer" style={{ height: '300px', borderRadius: '4px' }} />
              ) : (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aiActivity}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-100)" />
                      <XAxis dataKey="label" stroke="var(--color-slate-400)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--color-slate-400)" fontSize={11} tickLine={false} axisLine={false} />
                      <ChartTooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar
                        name="Yêu cầu xử lý AI"
                        dataKey="questions"
                        fill="var(--color-primary-500)"
                        radius={[4, 4, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Row 4: Trending Documents list */}
        <Card style={{ marginBottom: 'var(--spacing-6)' }}>
          <CardBody style={{ padding: 'var(--spacing-5)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-primary-950)', margin: '0 0 16px 0' }}>
              Tài liệu tương tác nhiều nhất
            </h3>

            {isLoading ? (
              <div className="skeleton-shimmer" style={{ height: '160px', borderRadius: '4px' }} />
            ) : trendingDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-6)', color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)' }}>
                Chưa có dữ liệu thống kê tài liệu tương tác.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {trendingDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderBottom: idx < trendingDocs.length - 1 ? '1px solid var(--color-slate-100)' : 'none',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-slate-400)', width: '20px' }}>#{idx + 1}</span>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--color-slate-800)', display: 'block' }}>{doc.title}</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>Chuyên mục: {doc.categoryName}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--spacing-6)', color: 'var(--color-slate-500)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} />
                        <span>{doc.viewCount} xem</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={12} />
                        <span>{doc.downloadCount} tải</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-charts-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminShell>
  );
}
