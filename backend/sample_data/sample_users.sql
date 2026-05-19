-- Sample users for testing
-- Password: TestPassword123 (hashed with bcrypt)
-- Replace with actual bcrypt hashes in production

-- Operator user
INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'operator1',
    '$2b$12$waSvHVMJYQHe.ciSflTApedgiKY22KsgQgbEDFyW3ALiVTjHQZUwu',
    'John Operator',
    'operator',
    true,
    NOW()
);

-- Reviewer user
INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'reviewer1',
    '$2b$12$waSvHVMJYQHe.ciSflTApedgiKY22KsgQgbEDFyW3ALiVTjHQZUwu',
    'Jane Reviewer',
    'reviewer',
    true,
    NOW()
);

-- Admin user
INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'admin',
    '$2b$12$waSvHVMJYQHe.ciSflTApedgiKY22KsgQgbEDFyW3ALiVTjHQZUwu',
    'Admin User',
    'admin',
    true,
    NOW()
);
