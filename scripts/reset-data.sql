-- Reset operational data, KEEPING HR_ADMIN accounts (and their profiles).
-- Deletes every non-admin user plus all per-user data (attendance, leaves,
-- tours, advances, documents, salary slips, tasks, notifications, tokens, etc).
--
-- Usage (on the VPS / any machine that can reach the DB):
--   mysql -h sh201.bigrock.com -u lrtecbyp_apiuser -p lrtecbyp_trueskillhr < scripts/reset-data.sql
--
-- It is safe to run repeatedly. HR_ADMIN logins are never touched.

SET FOREIGN_KEY_CHECKS = 0;

-- Wipe all operational tables completely (these are all per-employee data).
DELETE FROM attendance;
DELETE FROM leaves;
DELETE FROM leave_balances;
DELETE FROM tours;
DELETE FROM advances;
DELETE FROM documents;
DELETE FROM salary_slips;
DELETE FROM tasks;
DELETE FROM notifications;
DELETE FROM notices;
DELETE FROM email_tokens;
DELETE FROM refresh_tokens;

-- Remove profiles + users for everyone who is NOT an HR_ADMIN.
DELETE FROM employee_profiles
  WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'HR_ADMIN');

DELETE FROM users WHERE role <> 'HR_ADMIN';

SET FOREIGN_KEY_CHECKS = 1;

SELECT CONCAT('Remaining users: ', COUNT(*)) AS result FROM users;
