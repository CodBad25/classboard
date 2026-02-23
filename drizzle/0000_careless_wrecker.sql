CREATE TABLE "class_notes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"class_id" varchar(64) NOT NULL,
	"text" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"school_year_id" varchar(64) NOT NULL,
	"name" varchar(30) NOT NULL,
	"color" varchar(20) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminder_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(50) NOT NULL,
	"color" varchar(30) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"student_id" varchar(64) NOT NULL,
	"category_id" varchar(64),
	"text" text NOT NULL,
	"due_date" date,
	"is_done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_years" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(20) NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"class_id" varchar(64) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "class_notes" ADD CONSTRAINT "class_notes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_year_id_school_years_id_fk" FOREIGN KEY ("school_year_id") REFERENCES "public"."school_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_category_id_reminder_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."reminder_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_class_notes_class_id" ON "class_notes" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_classes_year_id" ON "classes" USING btree ("school_year_id");--> statement-breakpoint
CREATE INDEX "idx_reminders_student_id" ON "reminders" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_reminders_is_done" ON "reminders" USING btree ("is_done");--> statement-breakpoint
CREATE INDEX "idx_students_class_id" ON "students" USING btree ("class_id");