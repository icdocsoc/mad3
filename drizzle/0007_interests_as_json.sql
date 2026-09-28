-- Rows written through Bun's driver (since September 2025) hold interests as a JSON string that
-- itself contains JSON. The app decodes either form, so turning them back into objects changes
-- nothing it sees, and lets the database (and anyone querying it) read them as JSON again.
UPDATE "student" SET "interests" = ("interests" #>> '{}')::json WHERE json_typeof("interests") = 'string';
