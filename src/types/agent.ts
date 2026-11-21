export interface Agent {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
}
