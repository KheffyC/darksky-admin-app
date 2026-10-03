CREATE TABLE "Reimbursement" (
	"id" text PRIMARY KEY NOT NULL,
	"season" text NOT NULL,
	"paidBy" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"purchasedOn" date NOT NULL,
	"receiptPath" text,
	"status" text DEFAULT 'owed' NOT NULL,
	"reimbursedOn" date,
	"reimbursedMethod" text,
	"createdBy" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;