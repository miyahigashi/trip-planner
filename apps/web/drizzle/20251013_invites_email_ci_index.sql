-- up
CREATE UNIQUE INDEX IF NOT EXISTS project_invites_project_email_ci_uniq
ON project_invites (project_id, lower(email));

-- down
DROP INDEX IF EXISTS project_invites_project_email_ci_uniq;