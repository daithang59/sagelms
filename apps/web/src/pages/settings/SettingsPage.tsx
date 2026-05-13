import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader } from '@/components/ui';
import { useToast } from '@/components/Toast';
import api from '@/lib/api';
import type { NotificationPreference, NotificationPreferenceRequest } from '@/types/auth';
import { BellRing, Mail, Save, ShieldCheck } from 'lucide-react';

const defaultPreferences: NotificationPreference = {
  inAppEnabled: true,
  emailEnabled: false,
  enrollmentRequests: true,
  enrollmentResults: true,
  courseUpdates: true,
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void api.get<NotificationPreference>('/notifications/preferences')
      .then((data) => {
        if (mounted) setPreferences(data);
      })
      .catch(() => {
        if (mounted) setPreferences(defaultPreferences);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const update = (key: keyof NotificationPreference, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: NotificationPreferenceRequest = preferences;
      const saved = await api.put<NotificationPreference>('/notifications/preferences', payload);
      setPreferences(saved);
      showToast('Đã lưu cài đặt thông báo.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lưu cài đặt thất bại.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý cách SageLMS gửi thông báo cho tài khoản của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông báo</h2>
              <p className="text-sm text-slate-500">Bật/tắt các nhóm thông báo quan trọng.</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Đang tải cài đặt...</div>
          ) : (
            <>
              <ToggleRow
                icon={<BellRing className="h-5 w-5" />}
                title="Thông báo trong ứng dụng"
                description="Hiển thị cập nhật ở nút chuông trên header."
                checked={preferences.inAppEnabled}
                onChange={(value) => update('inAppEnabled', value)}
              />
              <ToggleRow
                icon={<Mail className="h-5 w-5" />}
                title="Email"
                description="Chuẩn bị cho luồng email sau này. Hiện tại hệ thống mới lưu lựa chọn."
                checked={preferences.emailEnabled}
                onChange={(value) => update('emailEnabled', value)}
              />
              <ToggleRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Yêu cầu ghi danh cần duyệt"
                description="Giảng viên nhận thông báo khi có học viên hoặc giảng viên khác xin ghi danh."
                checked={preferences.enrollmentRequests}
                onChange={(value) => update('enrollmentRequests', value)}
              />
              <ToggleRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Kết quả ghi danh"
                description="Người học nhận thông báo khi được duyệt, bị từ chối hoặc ghi danh thành công."
                checked={preferences.enrollmentResults}
                onChange={(value) => update('enrollmentResults', value)}
              />
              <ToggleRow
                icon={<BellRing className="h-5 w-5" />}
                title="Cập nhật khóa học"
                description="Dành cho các cập nhật bài học, nội dung hoặc thay đổi khóa học ở sprint sau."
                checked={preferences.courseUpdates}
                onChange={(value) => update('courseUpdates', value)}
              />

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => void handleSave()} isLoading={saving}>
                  <Save className="h-4 w-4" />
                  Lưu cài đặt
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="interactive-surface flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
      <div className="flex min-w-0 gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm leading-5 text-slate-500">{description}</div>
        </div>
      </div>
      <label className="pressable relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-violet-600 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-300" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </label>
    </div>
  );
}
