export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

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
  studentEmail: string | null;
  studentFullName: string | null;
  studentAvatarUrl: string | null;
  courseId: string;
  courseTitle: string | null;
  enrolledAt: string;
  completedAt: string | null;
  status: EnrollmentStatus;
}

export interface EnrollmentCheckResponse {
  enrolled: boolean;
}
