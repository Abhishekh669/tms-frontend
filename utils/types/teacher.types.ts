// teachers.types.ts

export type TeacherStatus = 'vacant' | 'on_duty';
export type GenderType =  "male" | "female" | "other"

export interface Teacher {
    id: string;                    // UUID
    name: string;
    email: string;
    gender : GenderType
    phone: string;
    cv_link: string;
    transcript_link: string;
    addition_link?: string | null; // Optional field
    location: string;
    location_hint: string;
    lat?: number | null;           // Optional
    long?: number | null;          // Optional
    status: TeacherStatus;
    created_at: string;            // ISO timestamp
    updated_at: string;            // ISO timestamp
}

export interface TeachersListResponse {
  teachers: Teacher[]; // assuming you already have this type
  total: number;
  has_more: boolean;
  next_offset: number;
  teacher_data: TeacherStats;
}

export interface TeacherStats {
  total_teachers: number;
  vacent_teacher: number; // (typo kept same as backend)
  duty_teachers: number;
  male_count: number;
  female_count: number;
}

export interface TeacherQuery {
  limit: number;
  page: number;
  phone: string;
  search: string;
}

/** Plain object with only serializable fields for server actions and query keys. */
export function pickTeacherQuery(query: TeacherQuery): TeacherQuery {
  return {
    limit: Number(query.limit),
    page: Number(query.page),
    phone: String(query.phone ?? ""),
    search: String(query.search ?? ""),
  };
}




// For API requests (create/update)
export interface CreateTeacherRequest {
    name: string;
    email: string;
    phone: string;
    cv_link: string;
    transcript_link: string;
    addition_link?: string;
    location: string;
    location_hint: string;
    lat?: number;
    long?: number;
    status?: TeacherStatus;        // Defaults to 'vacant'
}


// Main Type
export interface UpdateTeacher {
  id: string;
  name: string;
  gender: GenderType;
  email: string;
  phone: string;
  cv_link: string;
  transcript_link: string;
  addition_link?: string; // optional (pointer in Go)
  location: string;
  location_hint: string;
  lat?: number;   // optional (*float64)
  long?: number;  // optional (*float64)
}

// Status Update Type
export interface UpdateStatusTeacher {
  id: string;
  status: TeacherStatus;
}