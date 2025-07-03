CREATE TABLE "PaymentSchedule" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"dueDate" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"season" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Payment" ADD COLUMN "scheduleId" text;--> statement-breakpoint
ALTER TABLE "Payment" ADD COLUMN "isLate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "UnmatchedPayment" ADD COLUMN "scheduleId" text;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."PaymentSchedule"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UnmatchedPayment" ADD CONSTRAINT "UnmatchedPayment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."PaymentSchedule"("id") ON DELETE set null ON UPDATE cascade;