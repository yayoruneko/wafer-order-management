INSERT IGNORE INTO factories (id, factory_code, name, daily_capacity, is_active, created_at) VALUES ('factory-001', 'FAB-001', '台積電竹科廠', 10000, TRUE, NOW());

INSERT IGNORE INTO wafer_types (id, type_code, name, is_active, created_at) VALUES ('wafer-type-001', 'W-001', '12吋標準晶圓', TRUE, NOW());

INSERT IGNORE INTO users (id, username, password_hash, role, created_at) VALUES ('user-admin-001', 'admin', 'placeholder_hash_admin', 'ADMIN', NOW()), ('user-viewer-001', 'viewer', 'placeholder_hash_viewer', 'VIEWER', NOW());

INSERT IGNORE INTO customers (id, customer_code, name, contact_person, contact_email, is_active, created_at) VALUES ('customer-001', 'CUST-001', 'NVIDIA', '王小明', 'wang@nvidia.com', TRUE, NOW()), ('customer-002', 'CUST-002', 'AMD', '李小華', 'li@amd.com', TRUE, NOW()), ('customer-003', 'CUST-003', 'Apple', '張小美', 'zhang@apple.com', TRUE, NOW());