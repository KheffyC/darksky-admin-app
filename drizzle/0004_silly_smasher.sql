CREATE TABLE "Settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationName" text NOT NULL,
	"season" text NOT NULL,
	"defaultTuition" double precision DEFAULT 1000 NOT NULL,
	"paymentDueDate" text,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"autoReconcile" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
