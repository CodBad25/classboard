export type EnrichedReminder = {
  id: string;
  studentId: string;
  categoryId: string | null;
  text: string;
  dueDate: string | null;
  isDone: boolean;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  studentFirstName: string;
  studentLastName: string;
  categoryLabel: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  studentGender: string | null;
};

export type ClassData = {
  id: string;
  schoolYearId: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
};

export type ClassNote = {
  id: string;
  classId: string;
  text: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SearchableStudent = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  classId: string;
  className: string;
  classColor: string;
};

export type Category = {
  id: string;
  label: string;
  color: string;
  icon: string;
  defaultText: string | null;
  sortOrder: number;
};

export type SchoolYear = {
  id: string;
  label: string;
  isCurrent: boolean;
  createdAt: string | null;
};

export type Class = ClassData;

export type Student = {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  sortOrder: number;
  createdAt: string | null;
};

export type ReminderCategory = Category & {
  createdAt?: string | null;
};
