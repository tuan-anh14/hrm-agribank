export interface Position {
  id: string;
  title: string;
  baseSalary: number;
  allowance?: number | null;
  gradeLevel?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
  };
}

export interface CreatePositionPayload {
  title: string;
  baseSalary: number;
  allowance?: number;
  gradeLevel?: number;
  description?: string;
}

export interface UpdatePositionPayload {
  title?: string;
  baseSalary?: number;
  allowance?: number;
  gradeLevel?: number;
  description?: string;
}
