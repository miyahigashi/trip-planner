ALTER TABLE "project_candidates" DROP CONSTRAINT "project_candidates_project_id_place_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "project_candidates_unique" ON "project_candidates" USING btree ("project_id","place_id");--> statement-breakpoint
CREATE INDEX "idx_project_candidates_project" ON "project_candidates" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_selections_unique_slot" ON "project_selections" USING btree ("project_id","day_index","order_in_day");--> statement-breakpoint
CREATE INDEX "idx_project_selections_project" ON "project_selections" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_selections_sort" ON "project_selections" USING btree ("project_id","day_index","order_in_day");--> statement-breakpoint
CREATE INDEX "idx_wishlists_user_created" ON "wishlists" USING btree ("user_id","created_at");