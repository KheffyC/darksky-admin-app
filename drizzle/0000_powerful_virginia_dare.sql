CREATE TABLE "Member" (
	"id" text PRIMARY KEY NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"section" text,
	"season" text NOT NULL,
	"tuitionAmount" double precision DEFAULT 1000 NOT NULL,
	"contractSigned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payment" (
	"id" text PRIMARY KEY NOT NULL,
	"memberId" text NOT NULL,
	"amountPaid" double precision NOT NULL,
	"paymentMethod" text NOT NULL,
	"stripePaymentId" text,
	"paymentDate" timestamp(3) NOT NULL,
	"note" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"cardLast4" text,
	"customerName" text
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TuitionEditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"memberId" text NOT NULL,
	"oldAmount" integer NOT NULL,
	"newAmount" integer NOT NULL,
	"editedBy" text NOT NULL,
	"editedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UnmatchedPayment" (
	"id" text PRIMARY KEY NOT NULL,
	"stripePaymentId" text,
	"amountPaid" double precision NOT NULL,
	"paymentDate" timestamp(3) NOT NULL,
	"cardLast4" text,
	"customerName" text,
	"notes" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"paymentMethod" text DEFAULT 'card' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "TuitionEditLog" ADD CONSTRAINT "TuitionEditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Member_email_key" ON "Member" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "UnmatchedPayment_stripePaymentId_key" ON "UnmatchedPayment" USING btree ("stripePaymentId" text_ops);