import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, FileQuestion, Search } from 'lucide-react';
import { Card, CardBody, Badge, Button } from '@/components/ui';
import { useAssessments, useCourses, useEnrollment } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import type { Assessment } from '@/types/assessment';
import type { Course } from '@/types/course';

interface AssessmentEntry {
  assessment: Assessment;
  courseId: string;
  courseTitle: string;
}

function statusBadge(status: string) {
  if (status === 'PUBLISHED') return <Badge variant="success">Đã xuất bản</Badge>;
  if (status === 'DRAFT') return <Badge variant="warning">Bản nháp</Badge>;
  return <Badge variant="neutral">Lưu trữ</Badge>;
}

export default function QuizzesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { fetchMyCourses, fetchCourses } = useCourses();
  const { getMyEnrollments } = useEnrollment();
  const { fetchAssessments } = useAssessments();
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        let courses: Array<Pick<Course, 'id' | 'title'>> = [];
        if (user.role === 'ADMIN') {
          const page = await fetchCourses({ size: 50 });
          courses = page.content || [];
        } else if (user.role === 'INSTRUCTOR') {
          courses = await fetchMyCourses();
        } else {
          const enrollments = await getMyEnrollments();
          courses = enrollments
            .filter((item) => item.status === 'ACTIVE' || item.status === 'COMPLETED')
            .map((item) => ({ id: item.courseId, title: item.courseTitle || 'Khóa học' }));
        }

        const loaded = await Promise.all(
          courses.map(async (course) => {
            try {
              const page = await fetchAssessments(course.id, { size: 20 });
              return (page.content || []).map((assessment) => ({
                assessment,
                courseId: course.id,
                courseTitle: course.title,
              }));
            } catch {
              return [];
            }
          }),
        );

        if (!cancelled) {
          setEntries(loaded.flat());
        }
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : 'Không tải được bài kiểm tra', 'error');
          setEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchAssessments, fetchCourses, fetchMyCourses, getMyEnrollments, showToast, user]);

  const filteredEntries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return entries;
    return entries.filter(({ assessment, courseTitle }) => (
      assessment.title.toLowerCase().includes(keyword)
      || courseTitle.toLowerCase().includes(keyword)
      || (assessment.description || '').toLowerCase().includes(keyword)
      || (assessment.category || '').toLowerCase().includes(keyword)
    ));
  }, [entries, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bài kiểm tra</h1>
        <p className="mt-1 text-slate-500">Các bài kiểm tra thuộc khóa học trong SageLMS.</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm bài kiểm tra hoặc khóa học..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-56 skeleton rounded-2xl" />)}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.map(({ assessment, courseId, courseTitle }) => (
            <button
              key={assessment.id}
              type="button"
              onClick={() => navigate(`/courses/${courseId}?assessmentTab=questions`)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="h-32 bg-gradient-to-br from-violet-500 to-cyan-500">
                {assessment.thumbnailUrl && (
                  <img src={assessment.thumbnailUrl} alt={assessment.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="info">{assessment.category || 'Assessment'}</Badge>
                  {statusBadge(assessment.status)}
                </div>
                <div>
                  <h2 className="line-clamp-1 font-bold text-slate-900">{assessment.title}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{courseTitle}</p>
                </div>
                <p className="line-clamp-2 min-h-[40px] text-sm text-slate-600">{assessment.description || 'Chưa có mô tả.'}</p>
                <Button className="w-full" variant="secondary">
                  <FileQuestion className="h-4 w-4" />
                  Xem bài kiểm tra
                </Button>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="p-12 text-center">
            <BookOpenCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-semibold text-slate-700">Chưa có bài kiểm tra</p>
            <p className="mt-1 text-sm text-slate-500">Bài kiểm tra sẽ xuất hiện khi khóa học có assessment được xuất bản.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
