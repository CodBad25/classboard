import {
  pgTable,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";

// ========== School Years ==========
export const schoolYears = pgTable("school_years", {
  id: varchar("id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 20 }).notNull(),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SchoolYear = typeof schoolYears.$inferSelect;
export type InsertSchoolYear = typeof schoolYears.$inferInsert;

// ========== Classes ==========
export const classes = pgTable(
  "classes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    schoolYearId: varchar("school_year_id", { length: 64 })
      .notNull()
      .references(() => schoolYears.id),
    name: varchar("name", { length: 30 }).notNull(),
    color: varchar("color", { length: 20 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_classes_year_id").on(table.schoolYearId)]
);

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// ========== Students ==========
export const students = pgTable(
  "students",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    classId: varchar("class_id", { length: 64 })
      .notNull()
      .references(() => classes.id),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    gender: varchar("gender", { length: 1 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_students_class_id").on(table.classId)]
);

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ========== Reminder Categories ==========
export const reminderCategories = pgTable("reminder_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 50 }).notNull(),
  color: varchar("color", { length: 30 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ReminderCategory = typeof reminderCategories.$inferSelect;
export type InsertReminderCategory = typeof reminderCategories.$inferInsert;

// ========== Reminders ==========
export const reminders = pgTable(
  "reminders",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    studentId: varchar("student_id", { length: 64 })
      .notNull()
      .references(() => students.id),
    categoryId: varchar("category_id", { length: 64 }).references(
      () => reminderCategories.id
    ),
    text: text("text").notNull(),
    dueDate: date("due_date"),
    isDone: boolean("is_done").default(false).notNull(),
    doneAt: timestamp("done_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_reminders_student_id").on(table.studentId),
    index("idx_reminders_is_done").on(table.isDone),
  ]
);

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// ========== Class Notes ==========
export const classNotes = pgTable(
  "class_notes",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    classId: varchar("class_id", { length: 64 })
      .notNull()
      .references(() => classes.id),
    text: text("text").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_class_notes_class_id").on(table.classId)]
);

export type ClassNote = typeof classNotes.$inferSelect;
export type InsertClassNote = typeof classNotes.$inferInsert;
