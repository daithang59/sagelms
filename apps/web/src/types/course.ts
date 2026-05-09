export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  instructorId: string;
  status: CourseStatus;
  category: string | null;
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

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  completedAt: string | null;
  status: EnrollmentStatus;
}

export interface EnrollmentCheckResponse {
  enrolled: boolean;
}
