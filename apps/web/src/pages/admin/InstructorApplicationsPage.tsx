import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { InstructorApprovalStatus, User, UserListResponse } from '@/types/auth';
import { CheckCircle2, Clock3, ExternalLink, RefreshCw, SearchX, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const statuses: InstructorApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const statusLabels: Record<InstructorApprovalStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const statusVariants: Record<InstructorApprovalStatus, 'success' | 'warning' | 'error'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const statusIcons = {
  PENDING: Clock3,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

export default function InstructorApplicationsPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<InstructorApprovalStatus>('PENDING');
  const [applications, setApplications] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<UserListResponse>(
        `/users/instructor-applications?status=${status}&page=1&size=50`,
      );
      setApplications(res.data);
      setTotalElements(res.meta.totalElements);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách giáo viên.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void Promise.resolve().then(loadApplications);
  }, [loadApplications]);

  const handleApprove = async (userId: string) => {
    setActionUserId(userId);
    try {
      await api.post<User>(`/users/${userId}/approve-instructor`);
      showToast('Đã duyệt giáo viên.', 'success');
      await loadApplications();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Thao tác thất bại.';
      showToast(message, 'error');
    } finally {
      setActionUserId(null);
    }
  };

  const handleReject = async (user: User, reason: string) => {
    setActionUserId(user.id);
    try {
      await api.post<User>(`/users/${user.id}/reject-instructor`, { reason });
      showToast('Đã từ chối hồ sơ và lưu lý do.', 'success');
      setRejectingUser(null);
      await loadApplications();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Từ chối hồ sơ thất bại.';
      showToast(message, 'error');
    } finally {
      setActionUserId(null);
    }
  };

  const pageTitle = useMemo(() => {
    if (status === 'PENDING') return 'Hồ sơ giáo viên chờ duyệt';
    if (status === 'APPROVED') return 'Giáo viên đã duyệt';
    return 'Hồ sơ giáo viên bị từ chối';
  }, [status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm tra kinh nghiệm, chuyên môn và ghi chú onboarding trước khi cho phép đăng nhập.
          </p>
        </div>
        <Button variant="secondary" onClick={loadApplications} disabled={loading} className="w-fit">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        {statuses.map((item) => {
          const Icon = statusIcons[item];
          const active = status === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {statusLabels[item]}
            </button>
          );
        })}
      </div>

      <div className="text-sm text-slate-500">{totalElements} hồ sơ</div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-16 text-center">
            <SearchX className="mb-4 h-10 w-10 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-800">Không có hồ sơ</h2>
            <p className="mt-1 text-sm text-slate-500">Trạng thái này hiện chưa có giáo viên nào.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <InstructorApplicationCard
              key={application.id}
              application={application}
              status={status}
              isActing={actionUserId === application.id}
              onApprove={() => handleApprove(application.id)}
              onReject={() => setRejectingUser(application)}
            />
          ))}
        </div>
      )}

      <RejectInstructorModal
        user={rejectingUser}
        isSaving={actionUserId === rejectingUser?.id}
        onClose={() => setRejectingUser(null)}
        onSubmit={handleReject}
      />
    </div>
  );
}

function InstructorApplicationCard({
  application,
  status,
  isActing,
  onApprove,
  onReject,
}: {
  application: User;
  status: InstructorApprovalStatus;
  isActing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const currentStatus = application.instructorApprovalStatus ?? status;

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{application.fullName}</h2>
              <Badge variant={statusVariants[currentStatus]}>
                {statusLabels[currentStatus]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{application.email}</p>
            {application.instructorHeadline && (
              <p className="mt-3 text-sm font-medium text-slate-700">{application.instructorHeadline}</p>
            )}
          </div>

          {status === 'PENDING' && (
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={onReject} isLoading={isActing}>
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>
              <Button size="sm" onClick={onApprove} isLoading={isActing}>
                <CheckCircle2 className="h-4 w-4" />
                Duyệt
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoBlock label="Chuyên môn" value={application.instructorExpertise} />
          <InfoBlock
            label="Kinh nghiệm"
            value={
              application.instructorYearsExperience != null
                ? `${application.instructorYearsExperience} năm`
                : undefined
            }
          />
          <InfoBlock label="Ngày gửi" value={formatDate(application.createdAt)} />
        </div>

        {application.instructorWebsite && (
          <a
            href={application.instructorWebsite}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <ExternalLink className="h-4 w-4" />
            Website/LinkedIn
          </a>
        )}

        {application.instructorBio && (
          <TextSection label="Bio giảng dạy" value={application.instructorBio} />
        )}
        {application.instructorApplicationNote && (
          <TextSection
            label={currentStatus === 'REJECTED' ? 'Lý do từ chối / ghi chú' : 'Ghi chú onboarding'}
            value={application.instructorApplicationNote}
          />
        )}
      </CardBody>
    </Card>
  );
}

function RejectInstructorModal({
  user,
  isSaving,
  onClose,
  onSubmit,
}: {
  user: User | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (user: User, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => setReason(''));
  }, [user]);

  if (!user) return null;

  const trimmedReason = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Từ chối hồ sơ giáo viên</h2>
            <p className="mt-1 text-sm text-slate-500">{user.fullName} · {user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedReason.length >= 10) {
              void onSubmit(user, trimmedReason);
            }
          }}
        >
          <div>
            <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
              Lý do từ chối
            </label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              required
              minLength={10}
              maxLength={2000}
              placeholder="Ví dụ: Bio chưa đủ chi tiết, cần bổ sung kinh nghiệm giảng dạy hoặc link portfolio/chứng chỉ."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-1 text-xs text-slate-500">
              Lý do này sẽ được lưu vào ghi chú hồ sơ để admin/giáo viên biết cần bổ sung gì.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="danger" isLoading={isSaving} disabled={trimmedReason.length < 10}>
              Xác nhận từ chối
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value || 'Chưa cung cấp'}</div>
    </div>
  );
}

function TextSection({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-800">{label}</div>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
