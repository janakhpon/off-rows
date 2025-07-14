CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"header" text NOT NULL,
	"paragraphs" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "datastories" CASCADE;