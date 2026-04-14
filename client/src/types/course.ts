export type PrerequisiteSummary = {
  id: number;
  code: string;
  title: string;
};

export type Course = {
  id: number;
  code: string;
  title: string;
  description: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  prerequisites: PrerequisiteSummary[];
};
