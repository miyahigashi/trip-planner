CREATE TABLE "project_candidate_votes" (
	"project_id" uuid NOT NULL,
	"place_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_candidate_votes_project_id_place_id_user_id_pk" PRIMARY KEY("project_id","place_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "project_candidate_votes" ADD CONSTRAINT "project_candidate_votes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_candidate_votes" ADD CONSTRAINT "project_candidate_votes_place_id_places_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("place_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_candidate_votes" ADD CONSTRAINT "project_candidate_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_votes_project_place" ON "project_candidate_votes" USING btree ("project_id","place_id");--> statement-breakpoint
CREATE INDEX "idx_votes_project_cuser" ON "project_candidate_votes" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_vote_per_user" ON "project_candidate_votes" USING btree ("project_id","place_id","user_id");