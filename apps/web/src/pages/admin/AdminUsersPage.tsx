import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  RefreshCw,
  Search,
  SearchX,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import type { InstructorApprovalStatus, UpdateUserRequest, User, UserListResponse, UserRole } from '@/types/auth';

const pageSize = 20;

const roleOptions: Array<{ value: '' | UserRole; label: string }> = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'STUDENT', label: 'Học viên' },
  { value: 'INSTRUCTOR', label: 'Giảng viên' },
  { value: 'ADMIN', label: 'Admin' },
];

const activeOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Đã khóa' },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  INSTRUCTOR: 'Giảng viên',
  STUDENT: 'Học viên',
};

const approvalLabels: Record<InstructorApprovalStatus, string> = {
  APPROVED: 'Đã duyệt',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

type ReasonAction = 'lock' | 'unlock' | 'deactivate';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'' | UserRole>('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [reasonModal, setReasonModal] = useState<{ action: ReasonAction; user: User } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
      if (search.trim()) params.set('search', search.trim());
      if (role) params.set('role', role);
      if (active) params.set('isActive', active);
      const res = await api.get<UserListResponse>(`/users?${params.toString()}`);
      setUsers(res.data);
      setTotalElements(res.meta.totalElements);
      setTotalPages(Math.max(1, res.meta.totalPages));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tải được danh sách người dùng.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [active, page, role, search]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  const summary = useMemo(() => {
    const activeCount = users.filter((item) => item.isActive).length;
    const instructorCount = users.filter((item) => item.role === 'INSTRUCTOR').length;
    return { activeCount, instructorCount };
  }, [users]);

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const openReasonModal = (action: ReasonAction, target: User) => {
    if (target.id === currentUser?.id) {
      showToast('Bạn không thể thao tác khóa hoặc vô hiệu hóa tài khoản đang đăng nhập.', 'warning');
      return;
    }
    if (target.role === 'ADMIN') {
      showToast('Tài khoản admin cần quy trình phân quyền cao hơn để khóa hoặc đổi trạng thái.', 'warning');
      return;
    }
    setReasonModal({ action, user: target });
  };

  const submitReasonAction = async (reason: string) => {
    if (!reasonModal) return;

    const { action, user } = reasonModal;
    setActingUserId(user.id);
    try {
      if (action === 'deactivate') {
        await api.delete<void>(`/users/${user.id}`, { reason });
        showToast('Đã vô hiệu hóa tài khoản.', 'success');
      } else {
        const nextActive = action === 'unlock';
        await api.put<User>(`/users/${user.id}`, {
          isActive: nextActive,
          adminActionReason: reason || undefined,
        } satisfies UpdateUserRequest);
        showToast(nextActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.', 'success');
      }
      setReasonModal(null);
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Thao tác thất bại.', 'error');
    } finally {
      setActingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tìm kiếm, xem hồ sơ, chỉnh sửa thông tin và khóa/mở khóa tài khoản.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void loadUsers()} disabled={loading} className="w-fit">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Tổng user trong bộ lọc" value={totalElements} />
        <SummaryCard label="Đang hiển thị hoạt động" value={summary.activeCount} />
        <SummaryCard label="Giảng viên đang hiển thị" value={summary.instructorCount} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-[1fr_180px_190px_auto]">
            <div className="relative">
              <label htmlFor="admin-user-search" className="sr-only">
                Tìm theo tên hoặc email
              </label>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="admin-user-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <SelectField
              id="admin-user-role-filter"
              label="Lọc theo vai trò"
              value={role}
              onChange={(value) => {
                setPage(1);
                setRole(value as '' | UserRole);
              }}
              options={roleOptions}
            />
            <SelectField
              id="admin-user-active-filter"
              label="Lọc theo trạng thái"
              value={active}
              onChange={(value) => {
                setPage(1);
                setActive(value);
              }}
              options={activeOptions}
            />
            <Button type="submit" className="h-11">
              Tìm kiếm
            </Button>
          </form>
        </CardBody>
      </Card>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-3">Người dùng</th>
                  <th className="px-5 py-3">Vai trò</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Giảng viên</th>
                  <th className="px-5 py-3">Ngày tạo</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                      Đang tải người dùng...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <SearchX className="h-7 w-7" />
                        </div>
                        <p className="font-semibold text-slate-800">Không có người dùng phù hợp</p>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                          Thử đổi từ khóa tìm kiếm, vai trò hoặc trạng thái tài khoản.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((item, index) => (
                    <tr
                      key={item.id}
                      className="align-top opacity-0 animate-fade-up hover:bg-slate-50/80 transition-colors"
                      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 font-bold text-violet-700">
                            {(item.fullName || item.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{item.fullName || 'Chưa có tên'}</div>
                            <div className="text-sm text-slate-500">{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.role === 'ADMIN' ? 'brand' : item.role === 'INSTRUCTOR' ? 'info' : 'neutral'}>
                          {roleLabels[item.role]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={item.isActive ? 'success' : 'error'}>
                          {item.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {item.role === 'INSTRUCTOR' ? (
                          <Badge variant={item.instructorApprovalStatus === 'APPROVED' ? 'success' : item.instructorApprovalStatus === 'PENDING' ? 'warning' : 'error'}>
                            {approvalLabels[item.instructorApprovalStatus || 'PENDING']}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-400">Không áp dụng</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <IconButton title="Xem hồ sơ" onClick={() => setViewingUser(item)}>
                            <Eye className="h-4 w-4" />
                          </IconButton>
                          <IconButton title="Chỉnh sửa" onClick={() => setEditingUser(item)}>
                            <Edit3 className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            title={item.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            disabled={actingUserId === item.id || item.id === currentUser?.id || item.role === 'ADMIN'}
                            onClick={() => openReasonModal(item.isActive ? 'lock' : 'unlock', item)}
                          >
                            {item.isActive ? <Ban className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </IconButton>
                          <IconButton
                            title="Vô hiệu hóa"
                            danger
                            disabled={actingUserId === item.id || item.id === currentUser?.id || item.role === 'ADMIN' || !item.isActive}
                            onClick={() => openReasonModal('deactivate', item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} isLoading={loading} onPageChange={setPage} />
        </CardBody>
      </Card>

      <AnimatePresence>
        {viewingUser && <UserProfileModal user={viewingUser} onClose={() => setViewingUser(null)} />}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSaved={async () => {
              setEditingUser(null);
              await loadUsers();
            }}
          />
        )}
        {reasonModal && (
          <ReasonModal
            action={reasonModal.action}
            user={reasonModal.user}
            onClose={() => setReasonModal(null)}
            onSubmit={submitReasonAction}
            isLoading={actingUserId === reasonModal.user.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <div className="text-sm text-slate-500">{label}</div>
        <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      </CardBody>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  totalElements,
  isLoading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  const start = totalElements === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalElements);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {totalElements === 0 ? 'Không có dữ liệu' : `Hiển thị ${start}-${end} trong ${totalElements} người dùng`}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={isLoading || page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>
        <span className="px-2 font-medium text-slate-700">
          Trang {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={isLoading || page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function IconButton({
  title,
  children,
  onClick,
  disabled,
  danger,
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function UserProfileModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  if (!user) return null;

  return (
    <ModalShell title="Hồ sơ người dùng" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
            {(user.fullName || user.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{user.fullName || 'Chưa có tên'}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Info label="Vai trò" value={roleLabels[user.role]} />
          <Info label="Trạng thái" value={user.isActive ? 'Hoạt động' : 'Đã khóa'} />
          <Info label="Ngày tạo" value={formatDate(user.createdAt)} />
          <Info label="Đăng nhập gần nhất" value={formatDate(user.lastLoginAt)} />
          <Info label="Trạng thái giảng viên" value={user.role === 'INSTRUCTOR' ? approvalLabels[user.instructorApprovalStatus || 'PENDING'] : 'Không áp dụng'} />
        </div>

        {user.role === 'INSTRUCTOR' && (
          <div className="space-y-3">
            <Info label="Headline" value={user.instructorHeadline || 'Chưa cung cấp'} />
            <Info label="Chuyên môn" value={user.instructorExpertise || 'Chưa cung cấp'} />
            <Info label="Kinh nghiệm" value={user.instructorYearsExperience != null ? `${user.instructorYearsExperience} năm` : 'Chưa cung cấp'} />
            <Info label="Website" value={user.instructorWebsite || 'Chưa cung cấp'} />
            <Info label="Bio" value={user.instructorBio || 'Chưa cung cấp'} />
            <Info label="Ghi chú / lý do từ chối" value={user.instructorApplicationNote || 'Chưa cung cấp'} />
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateUserRequest>({});

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => {
      setForm({
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: Boolean(user.isActive),
        instructorApprovalStatus: user.instructorApprovalStatus,
        instructorHeadline: user.instructorHeadline || '',
        instructorBio: user.instructorBio || '',
        instructorExpertise: user.instructorExpertise || '',
        instructorWebsite: user.instructorWebsite || '',
        instructorYearsExperience: user.instructorYearsExperience || 0,
        instructorApplicationNote: user.instructorApplicationNote || '',
        adminActionReason: '',
      });
    });
  }, [user]);

  if (!user) return null;

  const update = <K extends keyof UpdateUserRequest>(key: K, value: UpdateUserRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if ((form.role || user.role) === 'INSTRUCTOR' && form.instructorApprovalStatus === 'REJECTED' && !form.instructorApplicationNote?.trim()) {
      showToast('Vui lòng nhập lý do từ chối trong ghi chú hồ sơ.', 'warning');
      return;
    }

    if (form.isActive === false && !form.adminActionReason?.trim()) {
      showToast('Vui lòng nhập lý do khóa hoặc vô hiệu hóa tài khoản.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateUserRequest = { ...form };
      if (payload.role !== 'INSTRUCTOR') {
        delete payload.instructorApprovalStatus;
        delete payload.instructorHeadline;
        delete payload.instructorBio;
        delete payload.instructorExpertise;
        delete payload.instructorWebsite;
        delete payload.instructorYearsExperience;
        delete payload.instructorApplicationNote;
      }
      await api.put<User>(`/users/${user.id}`, payload);
      showToast('Đã cập nhật người dùng.', 'success');
      await onSaved();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Chỉnh sửa người dùng" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="edit-user-full-name" label="Họ tên">
            <input id="edit-user-full-name" value={form.fullName || ''} onChange={(event) => update('fullName', event.target.value)} className={inputClass} />
          </Field>
          <Field id="edit-user-email" label="Email">
            <input id="edit-user-email" type="email" value={form.email || ''} onChange={(event) => update('email', event.target.value)} className={inputClass} />
          </Field>
          <Field id="edit-user-role" label="Vai trò">
            <select id="edit-user-role" value={form.role || user.role} onChange={(event) => update('role', event.target.value as UserRole)} className={inputClass}>
              <option value="STUDENT">Học viên</option>
              <option value="INSTRUCTOR">Giảng viên</option>
              <option value="ADMIN" disabled={user.role !== 'ADMIN'}>
                Admin
              </option>
            </select>
          </Field>
          <Field id="edit-user-active" label="Trạng thái">
            <select id="edit-user-active" value={String(form.isActive ?? user.isActive)} onChange={(event) => update('isActive', event.target.value === 'true')} className={inputClass}>
              <option value="true">Hoạt động</option>
              <option value="false">Đã khóa</option>
            </select>
          </Field>
        </div>

        <Field id="edit-admin-action-reason" label="Lý do thao tác admin">
          <textarea
            id="edit-admin-action-reason"
            value={form.adminActionReason || ''}
            onChange={(event) => update('adminActionReason', event.target.value)}
            rows={3}
            placeholder="Bắt buộc nếu khóa tài khoản; nên nhập khi đổi vai trò hoặc trạng thái duyệt."
            className={inputClass}
          />
        </Field>

        {(form.role || user.role) === 'INSTRUCTOR' && (
          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              Hồ sơ giảng viên
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="edit-instructor-approval" label="Trạng thái duyệt">
                <select
                  id="edit-instructor-approval"
                  value={form.instructorApprovalStatus || 'PENDING'}
                  onChange={(event) => update('instructorApprovalStatus', event.target.value as InstructorApprovalStatus)}
                  className={inputClass}
                >
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </Field>
              <Field id="edit-instructor-years" label="Số năm kinh nghiệm">
                <input
                  id="edit-instructor-years"
                  type="number"
                  min={0}
                  value={form.instructorYearsExperience ?? 0}
                  onChange={(event) => update('instructorYearsExperience', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field id="edit-instructor-headline" label="Headline">
              <input id="edit-instructor-headline" value={form.instructorHeadline || ''} onChange={(event) => update('instructorHeadline', event.target.value)} className={inputClass} />
            </Field>
            <Field id="edit-instructor-expertise" label="Chuyên môn">
              <input id="edit-instructor-expertise" value={form.instructorExpertise || ''} onChange={(event) => update('instructorExpertise', event.target.value)} className={inputClass} />
            </Field>
            <Field id="edit-instructor-website" label="Website">
              <input id="edit-instructor-website" value={form.instructorWebsite || ''} onChange={(event) => update('instructorWebsite', event.target.value)} className={inputClass} />
            </Field>
            <Field id="edit-instructor-bio" label="Bio">
              <textarea id="edit-instructor-bio" value={form.instructorBio || ''} onChange={(event) => update('instructorBio', event.target.value)} rows={4} className={inputClass} />
            </Field>
            <Field id="edit-instructor-note" label={form.instructorApprovalStatus === 'REJECTED' ? 'Lý do từ chối' : 'Ghi chú onboarding'}>
              <textarea
                id="edit-instructor-note"
                value={form.instructorApplicationNote || ''}
                onChange={(event) => update('instructorApplicationNote', event.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={saving}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function ReasonModal({
  action,
  user,
  onClose,
  onSubmit,
  isLoading,
}: {
  action: ReasonAction;
  user: User;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  const isRequired = action !== 'unlock';
  const title = action === 'unlock' ? 'Mở khóa tài khoản' : action === 'lock' ? 'Khóa tài khoản' : 'Vô hiệu hóa tài khoản';
  const description =
    action === 'unlock'
      ? 'User sẽ có thể đăng nhập lại nếu tài khoản hợp lệ.'
      : 'User sẽ không thể đăng nhập. Lý do sẽ được lưu vào audit log và gửi thông báo cho user.';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isRequired && !reason.trim()) return;
    await onSubmit(reason.trim());
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="font-semibold text-slate-900">{user.fullName || user.email}</div>
          <div className="text-sm text-slate-500">{user.email}</div>
        </div>
        <Field id="admin-reason" label={isRequired ? 'Lý do bắt buộc' : 'Lý do mở khóa'}>
          <textarea
            id="admin-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="Ví dụ: Vi phạm quy định lớp học, tài khoản cần xác minh lại, mở khóa sau khi xác minh..."
            className={inputClass}
          />
        </Field>
        <p className="text-sm text-slate-500">{description}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant={action === 'unlock' ? 'primary' : 'danger'} isLoading={isLoading} disabled={isRequired && !reason.trim()}>
            Xác nhận
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100';

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((item) => (
          <option key={item.value || 'all'} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
      <div className="mt-1 whitespace-pre-line text-sm font-medium leading-6 text-slate-800">{value}</div>
    </div>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
