<<<<<<< HEAD
-- =====================
-- 工廠
-- =====================
INSERT IGNORE INTO factories (id, factory_code, name, daily_capacity, is_active, created_at) VALUES
  ('factory-001', 'FAB-N12', '台積電竹科十二廠', 10000, TRUE, NOW()),
  ('factory-002', 'FAB-S14', '台積電南科十四廠', 10000, TRUE, NOW()),
  ('factory-003', 'FAB-C15', '台積電中科十五廠', 10000, TRUE, NOW());

-- =====================
-- 晶圓類型
-- =====================
INSERT IGNORE INTO wafer_types (id, type_code, name, is_active, created_at) VALUES
  ('wafer-type-001', 'W-12S', '12吋標準晶圓', TRUE, NOW());

-- =====================
-- 使用者
-- =====================
INSERT IGNORE INTO users (id, username, password_hash, role, created_at) VALUES
  ('user-super-001', 'sys.admin', 'placeholder_hash_superadmin', 'SUPER_ADMIN', NOW()),
  ('user-admin-001', 'chen.jh',  'placeholder_hash_admin',      'ADMIN',       NOW()),
  ('user-viewer-001', 'wang.yh', 'placeholder_hash_viewer',     'VIEWER',      NOW());

-- =====================
-- 客戶
-- =====================
INSERT IGNORE INTO customers (id, customer_code, name, is_active, created_at) VALUES
  ('customer-001', 'CUST-NV',   'NVIDIA 台灣',    TRUE, NOW()),
  ('customer-002', 'CUST-AP',   'Apple Inc.',     TRUE, NOW()),
  ('customer-003', 'CUST-AMD',  'AMD 超微半導體', TRUE, NOW()),
  ('customer-004', 'CUST-MTK',  '聯發科技',       TRUE, NOW()),
  ('customer-005', 'CUST-QCOM', '高通半導體',     TRUE, NOW());

-- =====================
-- 訂單（20 筆）
-- 前 3 筆交期設在過去，保證觸發延誤警告（demo 用，繞過 API 交期驗證）
-- 其餘 17 筆交期寬裕，應全數準時排程完成
-- =====================
INSERT IGNORE INTO orders (
  id, factory_id, wafer_type_id, customer_id, created_by,
  quantity, remaining_quantity, status, customer_due_date,
  is_delayed, delay_days, version, created_at, updated_at
) VALUES
  -- ★ 保證延誤（交期已過）
  ('WO-20260401-SD000001', 'factory-001', 'wafer-type-001', 'customer-001', 'user-admin-001', 2500, 2500, 'PENDING', '2026-05-01', FALSE, 0, 0, '2026-04-01 09:00:00', '2026-04-01 09:00:00'),
  ('WO-20260403-SD000002', 'factory-001', 'wafer-type-001', 'customer-003', 'user-admin-001', 1800, 1800, 'PENDING', '2026-05-05', FALSE, 0, 0, '2026-04-03 10:30:00', '2026-04-03 10:30:00'),
  ('WO-20260407-SD000003', 'factory-001', 'wafer-type-001', 'customer-005', 'user-admin-001', 1200, 1200, 'PENDING', '2026-05-08', FALSE, 0, 0, '2026-04-07 14:00:00', '2026-04-07 14:00:00'),

  -- 準時排程（交期寬裕）
  ('WO-20260410-SD000004', 'factory-001', 'wafer-type-001', 'customer-002', 'user-admin-001',  800,  800, 'PENDING', '2026-06-30', FALSE, 0, 0, '2026-04-10 08:00:00', '2026-04-10 08:00:00'),
  ('WO-20260412-SD000005', 'factory-001', 'wafer-type-001', 'customer-004', 'user-admin-001', 2000, 2000, 'PENDING', '2026-07-15', FALSE, 0, 0, '2026-04-12 09:00:00', '2026-04-12 09:00:00'),
  ('WO-20260415-SD000006', 'factory-001', 'wafer-type-001', 'customer-001', 'user-admin-001',  500,  500, 'PENDING', '2026-08-01', FALSE, 0, 0, '2026-04-15 11:00:00', '2026-04-15 11:00:00'),
  ('WO-20260418-SD000007', 'factory-001', 'wafer-type-001', 'customer-002', 'user-admin-001', 1500, 1500, 'PENDING', '2026-06-15', FALSE, 0, 0, '2026-04-18 13:00:00', '2026-04-18 13:00:00'),
  ('WO-20260420-SD000008', 'factory-001', 'wafer-type-001', 'customer-003', 'user-admin-001', 2200, 2200, 'PENDING', '2026-09-30', FALSE, 0, 0, '2026-04-20 10:00:00', '2026-04-20 10:00:00'),
  ('WO-20260422-SD000009', 'factory-001', 'wafer-type-001', 'customer-004', 'user-admin-001',  300,  300, 'PENDING', '2026-07-01', FALSE, 0, 0, '2026-04-22 09:30:00', '2026-04-22 09:30:00'),
  ('WO-20260425-SD000010', 'factory-001', 'wafer-type-001', 'customer-005', 'user-admin-001', 1000, 1000, 'PENDING', '2026-08-20', FALSE, 0, 0, '2026-04-25 14:00:00', '2026-04-25 14:00:00'),
  ('WO-20260428-SD000011', 'factory-001', 'wafer-type-001', 'customer-001', 'user-admin-001', 1800, 1800, 'PENDING', '2026-10-01', FALSE, 0, 0, '2026-04-28 08:00:00', '2026-04-28 08:00:00'),
  ('WO-20260430-SD000012', 'factory-001', 'wafer-type-001', 'customer-002', 'user-admin-001', 2500, 2500, 'PENDING', '2026-11-30', FALSE, 0, 0, '2026-04-30 09:00:00', '2026-04-30 09:00:00'),
  ('WO-20260502-SD000013', 'factory-001', 'wafer-type-001', 'customer-003', 'user-admin-001',  600,  600, 'PENDING', '2026-06-20', FALSE, 0, 0, '2026-05-02 10:00:00', '2026-05-02 10:00:00'),
  ('WO-20260503-SD000014', 'factory-001', 'wafer-type-001', 'customer-004', 'user-admin-001', 1200, 1200, 'PENDING', '2026-09-15', FALSE, 0, 0, '2026-05-03 11:00:00', '2026-05-03 11:00:00'),
  ('WO-20260504-SD000015', 'factory-001', 'wafer-type-001', 'customer-005', 'user-admin-001', 2000, 2000, 'PENDING', '2026-12-31', FALSE, 0, 0, '2026-05-04 08:30:00', '2026-05-04 08:30:00'),
  ('WO-20260505-SD000016', 'factory-001', 'wafer-type-001', 'customer-001', 'user-admin-001',  400,  400, 'PENDING', '2026-07-10', FALSE, 0, 0, '2026-05-05 09:00:00', '2026-05-05 09:00:00'),
  ('WO-20260506-SD000017', 'factory-001', 'wafer-type-001', 'customer-002', 'user-admin-001', 1600, 1600, 'PENDING', '2026-10-15', FALSE, 0, 0, '2026-05-06 13:00:00', '2026-05-06 13:00:00'),
  ('WO-20260507-SD000018', 'factory-001', 'wafer-type-001', 'customer-003', 'user-admin-001',  800,  800, 'PENDING', '2026-06-30', FALSE, 0, 0, '2026-05-07 10:00:00', '2026-05-07 10:00:00'),
  ('WO-20260508-SD000019', 'factory-001', 'wafer-type-001', 'customer-004', 'user-admin-001', 2200, 2200, 'PENDING', '2026-11-01', FALSE, 0, 0, '2026-05-08 09:00:00', '2026-05-08 09:00:00'),
  ('WO-20260509-SD000020', 'factory-001', 'wafer-type-001', 'customer-005', 'user-admin-001', 1000, 1000, 'PENDING', '2026-08-01', FALSE, 0, 0, '2026-05-09 14:00:00', '2026-05-09 14:00:00');

-- =====================
-- 排程佇列（對應上面 20 筆訂單，QueuePoller 啟動後自動處理）
-- =====================
INSERT IGNORE INTO scheduling_queue (id, order_id, action, status, priority, created_at) VALUES
  (UUID(), 'WO-20260401-SD000001', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-01 09:00:00'),
  (UUID(), 'WO-20260403-SD000002', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-03 10:30:00'),
  (UUID(), 'WO-20260407-SD000003', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-07 14:00:00'),
  (UUID(), 'WO-20260410-SD000004', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-10 08:00:00'),
  (UUID(), 'WO-20260412-SD000005', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-12 09:00:00'),
  (UUID(), 'WO-20260415-SD000006', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-15 11:00:00'),
  (UUID(), 'WO-20260418-SD000007', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-18 13:00:00'),
  (UUID(), 'WO-20260420-SD000008', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-20 10:00:00'),
  (UUID(), 'WO-20260422-SD000009', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-22 09:30:00'),
  (UUID(), 'WO-20260425-SD000010', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-25 14:00:00'),
  (UUID(), 'WO-20260428-SD000011', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-28 08:00:00'),
  (UUID(), 'WO-20260430-SD000012', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-04-30 09:00:00'),
  (UUID(), 'WO-20260502-SD000013', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-02 10:00:00'),
  (UUID(), 'WO-20260503-SD000014', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-03 11:00:00'),
  (UUID(), 'WO-20260504-SD000015', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-04 08:30:00'),
  (UUID(), 'WO-20260505-SD000016', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-05 09:00:00'),
  (UUID(), 'WO-20260506-SD000017', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-06 13:00:00'),
  (UUID(), 'WO-20260507-SD000018', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-07 10:00:00'),
  (UUID(), 'WO-20260508-SD000019', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-08 09:00:00'),
  (UUID(), 'WO-20260509-SD000020', 'SCHEDULE_ORDER', 'PENDING', 100, '2026-05-09 14:00:00');
=======
INSERT IGNORE INTO factories (id, factory_code, name, daily_capacity, is_active, created_at) VALUES ('factory-001', 'FAB-001', '台積電竹科廠', 10000, TRUE, NOW());

INSERT IGNORE INTO wafer_types (id, type_code, name, is_active, created_at) VALUES ('wafer-type-001', 'W-001', '12吋標準晶圓', TRUE, NOW());

INSERT IGNORE INTO users (id, username, password_hash, role, created_at) VALUES ('user-admin-001', 'admin', 'placeholder_hash_admin', 'ADMIN', NOW()), ('user-viewer-001', 'viewer', 'placeholder_hash_viewer', 'VIEWER', NOW());

INSERT IGNORE INTO customers (id, customer_code, name, contact_person, contact_email, is_active, created_at) VALUES ('customer-001', 'CUST-001', 'NVIDIA', '王小明', 'wang@nvidia.com', TRUE, NOW()), ('customer-002', 'CUST-002', 'AMD', '李小華', 'li@amd.com', TRUE, NOW()), ('customer-003', 'CUST-003', 'Apple', '張小美', 'zhang@apple.com', TRUE, NOW());
>>>>>>> main
