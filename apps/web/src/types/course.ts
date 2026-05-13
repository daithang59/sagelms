export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EnrollmentPolicy = 'OPEN' | 'APPROVAL_REQUIRED';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  instructorId: string;
  instructorEmail: string | null;
  instructorFullName: string | null;
  instructorAvatarUrl: string | null;
  instructorHeadline: string | null;
  instructorBio: string | null;
  instructorExpertise: string | null;
  instructorWebsite: string | null;
  instructorYearsExperience: number | null;
  status: CourseStatus;
  category: string | null;
  enrollmentPolicy: EnrollmentPolicy;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRequest {
  title: string;
  description: string;
  thumbnailUrl?: string;
  category?: string;
  status?: CourseStatus;
  enrollmentPolicy?: EnrollmentPolicy;
}

export interface CourseListResponse {
  content: Course[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'REJECTED';

export interface Enrollment {
  id: string;
  studentId: string;
  studentEmail: string | null;
  studentFullName: string | null;
  studentAvatarUrl: string | null;
  studentRole?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | null;
  courseId: string;
  courseTitle: string | null;
  enrolledAt: string;
  completedAt: string | null;
  status: EnrollmentStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface EnrollmentCheckResponse {
  enrolled: boolean;
  status: EnrollmentStatus | null;
}
