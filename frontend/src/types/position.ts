export interface Position {
  id: string;
  title: string;
  baseSalary: number;
  allowance?: number | null;
  gradeLevel?: number | null;
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
}

export interface UpdatePositionPayload {
  title?: string;
  baseSalary?: number;
  allowance?: number;
  gradeLevel?: number;
}
