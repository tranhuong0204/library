import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { normalizeForumCategory } from '@/lib/normalizers';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { useState } from 'react';

const postSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề cuộc thảo luận tối thiểu phải có 5 ký tự')
    .max(150, 'Tiêu đề không được vượt quá 150 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn chủ đề liên quan'),
  content: z.string().min(10, 'Nội dung chi tiết tối thiểu phải có 10 ký tự'),
});

type PostForm = z.infer<typeof postSchema>;

export default function CreatePostPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [attachment, setAttachment] = useState<File | null>(null);

  // Query: Get forum categories for select dropdown
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['forum', 'categories'],
    queryFn: async () => {
      const res = await apiClient.get('/forum/categories');
      return (Array.isArray(res.data) ? res.data : []).map(normalizeForumCategory);
    },
  });

  // Mutation: Create Forum Post
  const createPostMutation = useMutation({
    mutationFn: async (data: PostForm) => {
      const payload = new FormData();
      payload.append('title', data.title.trim());
      payload.append('content', data.content.trim());
      payload.append('categoryId', String(Number(data.categoryId)));
      if (attachment) payload.append('attachment', attachment);
      const res = await apiClient.post('/forum/posts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum', 'posts'] });
      toast.success('Đăng bài thảo luận thành công!');
      navigate('/forum');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể đăng bài thảo luận.');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: '', categoryId: '', content: '' },
  });

  const onSubmit = (data: PostForm) => {
    createPostMutation.mutate(data);
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <div>
          <button
            onClick={() => navigate('/forum')}
            className="btn btn-sm btn-text"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: 0 }}
          >
            <ArrowLeft size={14} />
            <span>Quay lại Diễn đàn</span>
          </button>
        </div>

        <PageHeader
          title="Tạo cuộc thảo luận mới"
          description="Đặt câu hỏi hoặc chia sẻ tài nguyên nghiên cứu của bạn với các thành viên khác."
        />

        <div style={{ maxWidth: '720px', width: '100%', marginTop: 'var(--spacing-2)' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Input
              label="Tiêu đề cuộc thảo luận *"
              placeholder="Ví dụ: Lỗi trích xuất embeddings trong HuggingFace với tệp PDF..."
              error={errors.title?.message}
              disabled={createPostMutation.isPending}
              {...register('title')}
            />

            <Select
              label="Chủ đề diễn đàn *"
              placeholder="Chọn chủ đề thảo luận phù hợp..."
              options={categoryOptions}
              error={errors.categoryId?.message}
              disabled={createPostMutation.isPending || isCategoriesLoading}
              {...register('categoryId')}
            />

            <Textarea
              label="Nội dung thảo luận chi tiết *"
              placeholder="Nhập nội dung câu hỏi, mô tả lỗi chi tiết hoặc các nội dung chia sẻ..."
              error={errors.content?.message}
              disabled={createPostMutation.isPending}
              rows={10}
              {...register('content')}
            />

            <FileDropzone
              label="Tệp đính kèm (không bắt buộc)"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
              maxSizeMB={10}
              onFileSelect={setAttachment}
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate('/forum')}
                disabled={createPostMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" isLoading={createPostMutation.isPending}>
                <Send size={16} />
                <span>Đăng bài thảo luận</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
