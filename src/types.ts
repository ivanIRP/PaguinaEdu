import { Timestamp } from "firebase/firestore";

export type Role = "admin" | "student";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: Role;
  photoURL?: string;
  theme?: "light" | "dark";
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  bannerUrl: string;
  lessons: Lesson[];
  createdAt: Timestamp;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  isFinished: boolean;
  rating?: number;
  comment?: string;
  finishedAt?: Timestamp;
}
