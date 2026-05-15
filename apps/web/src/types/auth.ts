export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
export type InstructorApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive?: boolean;
  instructorApprovalStatus?: InstructorApprovalStatus;
  instructorHeadline?: string | null;
  instructorBio?: string | null;
  instructorExpertise?: string | null;
  instructorWebsite?: string | null;
  instructorYearsExperience?: number | null;
  instructorApplicationNote?: string | null;
  instructorReviewedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  email: string;
  fullName: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface InstructorApplicationRequest extends RegisterRequest {
  headline: string;
  bio: string;
  expertise: string;
  website?: string;
  yearsExperience?: number;
  applicationNote?: string;
}

export interface InstructorApplicationResponse {
  userId: string;
  status: InstructorApprovalStatus;
  message: string;
}

export interface UserListResponse {
  data: User[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
  instructorApprovalStatus?: InstructorApprovalStatus;
  instructorHeadline?: string;
  instructorBio?: string;
  instructorExpertise?: string;
  instructorWebsite?: string;
  instructorYearsExperience?: number;
  instructorApplicationNote?: string;
  adminActionReason?: string;
}

export interface SelfProfileUpdateRequest {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  instructorHeadline?: string;
  instructorBio?: string;
  instructorExpertise?: string;
  instructorWebsite?: string;
  instructorYearsExperience?: number;
}

export type NotificationType =
  | 'ENROLLMENT_REQUESTED'
  | 'ENROLLMENT_APPROVED'
  | 'ENROLLMENT_REJECTED'
  | 'COURSE_ENROLLED'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  targetUrl?: string | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  enrollmentRequests: boolean;
  enrollmentResults: boolean;
  courseUpdates: boolean;
}

export type NotificationPreferenceRequest = Partial<NotificationPreference>;

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
