export type ContentType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT' | 'PDF' | 'LINK';

export interface Lesson {
  id: string;
  courseId: string;
  instructorId: string;
  title: string;
  type: ContentType;
  contentUrl: string | null;
  textContent: string | null;
  sortOrder: number | null;
  durationMinutes: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonRequest {
  title: string;
  type: ContentType;
  contentUrl?: string;
  textContent?: string;
  durationMinutes?: number;
}
