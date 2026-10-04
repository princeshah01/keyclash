CREATE TYPE "public"."difficulty" AS ENUM('easy', 'hard');--> statement-breakpoint
CREATE TYPE "public"."test_mode" AS ENUM('time', 'words', 'quote', 'zen');--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_edited" boolean DEFAULT false NOT NULL,
	"auth_user_id" text,
	"email" text,
	"image" text,
	"avatar_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_authUserId_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"mode" "test_mode" NOT NULL,
	"mode_detail" text NOT NULL,
	"punctuation" boolean DEFAULT false NOT NULL,
	"numbers" boolean DEFAULT false NOT NULL,
	"difficulty" "difficulty",
	"wpm" integer NOT NULL,
	"raw" integer NOT NULL,
	"accuracy" integer NOT NULL,
	"consistency" integer NOT NULL,
	"correct_chars" integer NOT NULL,
	"incorrect_chars" integer NOT NULL,
	"extra_chars" integer NOT NULL,
	"missed_chars" integer NOT NULL,
	"corrected_errors" integer NOT NULL,
	"elapsed_seconds" integer NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_name_lower_idx" ON "players" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "results_board_idx" ON "results" USING btree ("mode","mode_detail","wpm" DESC NULLS LAST,"accuracy" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "results_player_idx" ON "results" USING btree ("player_id","created_at" DESC NULLS LAST);