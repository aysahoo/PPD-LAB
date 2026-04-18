export type User = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  role: "student" | "admin";
  isActive: boolean;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
};
