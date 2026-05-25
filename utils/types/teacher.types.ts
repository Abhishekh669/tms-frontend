// teachers.types.ts

import {  PaymentStatus, TeacherVacancyData, VacancyStatus, VacancyTypeById } from "./vacancy.types";

export type TeacherStatus = 'vacant' | 'on_duty';
export type GenderType =  "male" | "female" | "other"

export interface SafeTokenTeacherData {
  id: string;
  name: string;
  gender: GenderType;
  email: string;
  phone: string;
  cv_link: string;
  transcript_link: string;
  addition_link?: string | null;
  location: string;
  location_hint: string;
  lat?: number | null;
  long?: number | null;
  status: TeacherStatus;
  created_at: string;
  updated_at: string;
}

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
  lat: number | null;
  lon: number | null;
  location : string;
  gender: "male" | "female" | "all";
  status : "vacant" | "on_duty" | "all";
}


export interface TeacherVacancyQuery  {
  limit : number;
  page : number;
  phone : string;
  payment_status : | "pending"
  | "partial"
  | "completed"
  | "failed" | "all";
  vacancy_status : VacancyStatus | "all";
}
export interface TeacherVacancyRecordsQuery{
  vacancy_id : string;
  page : number;
  limit : number;
}


export function pickTeacherVacancyRecordsQuery(query: TeacherVacancyRecordsQuery): TeacherVacancyRecordsQuery {
  return {
    vacancy_id: String(query.vacancy_id),
    page: Number(query.page),
    limit: Number(query.limit),
  };
}


export function pickTeacherVacancyQuery(query: TeacherVacancyQuery): TeacherVacancyQuery {
  return {
    limit: Number(query.limit),
    page: Number(query.page),
    phone: String(query.phone ?? ""),
    payment_status: String(query.payment_status ?? "all") as TeacherVacancyQuery["payment_status"],
    vacancy_status: String(query.vacancy_status ?? "all") as TeacherVacancyQuery["vacancy_status"],
  };
}
 

/** Plain object with only serializable fields for server actions and query keys. */
export function pickTeacherQuery(query: TeacherQuery): TeacherQuery {
  return {
    limit: Number(query.limit),
    page: Number(query.page),
    phone: String(query.phone ?? ""),
    search: String(query.search ?? ""),
    location: String(query.location ?? ""),
    lat: query.lat != null ? Number(query.lat) : null,
    lon: query.lon != null ? Number(query.lon) : null,
    status : (query.status ?? "all") as TeacherQuery["status"],
    gender: (query.gender ?? "all") as TeacherQuery["gender"],
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


export interface TeacherStats {
  total_vacancies : number;
  paid_vacancies : number;
  unpaid_vacancies : number;
  partial_vacancies : number;
  total_earned : number;
  total_pending : number;
}

export interface TeacherVacancyResponse {
  vacancies : TeacherVacancyData[];
  stats : TeacherStats;
  total : number;
  has_more : boolean;
  next_offset : number
}



export interface TeacherVacancyRecordStats {
  total_records : number;
  average_mark : number;
  pass_rate : number;
}

export interface VacancyRecordType {
  id : string;
  vac_id : string;
  subject : string;
  submitted_date : string;
  full_marks : number;
  pass_marks : number;
  student_mark: number;
  image_link : string;
  verified : boolean;
  teacher_id : string;
  created_at : string;
  percentage : number;
  is_passed : boolean;
  }


export interface VacancyDataForVacancyRecords {
  id: string; // UUID
  title: string;
  subject: string;
  gender: GenderType;
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  no_of_students: number;
  grade: string;
  salary: number;
  status: VacancyStatus;
  time: string;
  contact_number: string;
  commission_charge: number;
  approved_at?: string | null; // ISO date string or null
  vacancy_id: string; // UUID
  assigned_to?: string | null; // UUID or null
  payment_status: PaymentStatus;
  amount_to_be_paid: number;
  payment_done: number;
  remaining_amount: number;
}


export interface VacancyRecordDataResponse {
  vacancy_details : VacancyDataForVacancyRecords
  records : VacancyRecordType[]
  stats : TeacherVacancyRecordStats
  total : number;
  has_more : boolean;
  next_offset : number;
}

