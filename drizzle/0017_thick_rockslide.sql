CREATE TABLE "DigestLog" (
	"date" date PRIMARY KEY NOT NULL,
	"title" text,
	"body" text,
	"sent" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
