import { GenderType, Teacher } from "./teacher.types";

// status types (union instead of enum)
export type VacancyStatus =
  | "open"
  | "assigned"
  | "completed"
  | "ongoing"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "completed"
  | "failed";

export type VacancyStats = {
  total_vacancies: number;
  open_vacancies: number;
  assigned_vacancies: number;
  ongoing_vacancies: number;
  completed_vacancies: number;
  cancelled_vacancies: number;
  pending_payments: number;
  partial_payments: number;
  completed_payments: number;
  failed_payments: number;
};

export type VacancyQuery = {
  limit?: number;
  page?: number;
  search?: string;
  location?: string;
  contact_number?: string;
  status?: string;
  payment_status?: string;
  gender?: string;
  lat?: number;
  lon?: number;
};

export const pickVacancyQuery = (query: VacancyQuery): VacancyQuery => ({
  limit: Number(query.limit ?? 20),
  page: Number(query.page ?? 0),
  search: String(query.search ?? ""),
  location: String(query.location ?? ""),
  contact_number: String(query.contact_number ?? ""),
  status: String(query.status ?? ""),
  payment_status: String(query.payment_status ?? ""),
  gender: String(query.gender ?? ""),
  lat: query.lat,
  lon: query.lon,
});

// base vacancy
export type Vacancy = {
  id: string;
  title: string;
  subject: string;
  gender : GenderType
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  no_of_students: number;
  grade: string;
  salary: number;
  status: VacancyStatus;
  time: string;
  code: string;
  contact_number: string;
  salary_note: string;
  commission_charge: number;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
};

// list response
export type VacancyListResponseType = {
  id: string;
  title: string;
  subject: string;
  gender : GenderType
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  no_of_students: number;
  grade: string;
  salary: number;
  status: VacancyStatus;
  time: string;
  code: string;
  contact_number: string;
  salary_note: string;
  commission_charge: number;
  approved_at?: string | null;
  assigned_to?: string | null;

  payment_status: PaymentStatus;
  amount_to_be_paid: number;

  created_at: string;
  updated_at: string;
};

// by id
export type VacancyTypeById = {
  id: string;
  title: string;
  subject: string;
  gender : GenderType
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  no_of_students: number;
  grade: string;
  salary: number;
  status: VacancyStatus;
  time: string;
  code: string;
  contact_number: string;
  salary_note: string;
  commission_charge: number;
  approved_at?: string | null;

  vacancy_id: string;
  assigned_to?: string | null;
  assigned_teacher ?: Teacher | null;

  payment_status: PaymentStatus;
  amount_to_be_paid: number;
  payment_done: number;
  remaining_amount: number;

  payment_created_date: string;
  payment_updated_date: string;

  created_at: string;
  updated_at: string;
};

// create
export type CreateVacancy = {
  title: string;
  subject: string;
  gender : GenderType
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
  salary_note: string;
  commission_charge: number;
};

// update
/** Allowed vacancy lifecycle values (aligned with backend `vacancy_status_type`). */
export const VACANCY_STATUSES: VacancyStatus[] = [
  "open",
  "assigned",
  "ongoing",
  "completed",
  "cancelled",
];

export type UpdateVacancy = {
  id: string;
  title: string;
  subject: string;
  gender : GenderType
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
  salary_note: string;
  commission_charge: number;
};

// payment
export type VacancyPayment = {
  id: string;
  vacancy_id: string;
  assigned_to?: string | null;

  payment_status: PaymentStatus;

  amount_to_be_paid: number;
  payment_done: number;
  remaining_amount: number;

  created_at: string;
  updated_at: string;
};

export type VacancyListResponse = {
  vacancies: VacancyListResponseType[];
  total: number;
  has_more: boolean;
  next_offset: number;
  vacancy_data: VacancyStats;
};


export interface AssignVacancy {
  vacancy_id : string;
  teacher_id : string;
}


export interface UnassignVacancy{
  vacancy_id : string
}


export interface AddPaymentInVacancy{
    payment_id : string;
    payment_done : number;
}

export interface UpdatePaymentInVacancy{
  payment_id : string;
  payment_done : number;
  amount_to_be_paid : number;
  remaining_amount : number;
}


export interface GetTeacherForVacancy {
  search?: string;
  phone?: string;
  limit: number;
  page: number;
}

export const pickGetTeacherForVacancy = (q: GetTeacherForVacancy): GetTeacherForVacancy => ({
  search: String(q.search ?? ""),
  phone: String(q.phone ?? ""),
  limit: Number(q.limit ?? 20),
  page: Number(q.page ?? 0),
});

/** Query for GET /search-teachers-for-vacancy/:vacancy_id (geo + optional text filters, paginated). */
export type TeachersNearVacancyQuery = {
  vacancyId: string;
  page: number;
  limit: number;
  lat?: number;
  lon?: number;
  location?: string;
  search?: string;
  phone?: string;
};

export const pickTeachersNearVacancyQuery = (q: TeachersNearVacancyQuery): TeachersNearVacancyQuery => ({
  vacancyId: String(q.vacancyId ?? ""),
  page: Number(q.page ?? 0),
  limit: Number(q.limit ?? 20),
  lat: q.lat,
  lon: q.lon,
  location: q.location != null && q.location !== "" ? String(q.location) : undefined,
  search: String(q.search ?? ""),
  phone: String(q.phone ?? ""),
});


export interface TeachersNearVacancyListResponse {
  teachers : Teacher[];
  total : number;
  has_more : boolean;
  next_offset : number;
}



export type TeacherVacancyData = {
  id: string;
  title: string;
  subject: string;
  gender : GenderType
  location: string;
  location_hint: string;
  lat: number;
  lon: number;
  no_of_students: number;
  grade: string;
  salary: number;
  status: VacancyStatus;
  time: string;
  code: string;
  contact_number: string;
  salary_note: string;
  commission_charge: number;
  approved_at?: string | null;

  vacancy_id: string;
  assigned_to?: string | null;
  assigned_teacher ?: Teacher | null;

  payment_status: PaymentStatus;
  amount_to_be_paid: number;
  payment_done: number;
  remaining_amount: number;

  payment_created_date: string;
  payment_updated_date: string;

  created_at: string;
  updated_at: string;
};



export interface  CreateVacancyRecord {
  vac_id : string;
  submitted_date :string;
  subject : string;
  full_marks : number;
  pass_marks : number;
  student_mark : number;
  image_link : string;
  teacher_id : string;
}


export interface  UpdateVacancyRecord {
  id : string;
  subject : string;
  full_marks : number;
  pass_marks : number;
  student_mark : number;
  image_link : string;
}


