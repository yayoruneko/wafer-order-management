-- =====================
-- 工廠
-- =====================
INSERT INTO factories (id, factory_code, name, daily_capacity, is_active, created_at) VALUES
  ('factory-001', 'FAB-N12', '台積電竹科十二廠', 10000, TRUE, NOW()),
  ('factory-002', 'FAB-S14', '台積電南科十四廠', 10000, TRUE, NOW()),
  ('factory-003', 'FAB-C15', '台積電中科十五廠', 10000, TRUE, NOW())
ON DUPLICATE KEY UPDATE
  factory_code   = VALUES(factory_code),
  name           = VALUES(name),
  daily_capacity = VALUES(daily_capacity),
  is_active      = VALUES(is_active);
  -- created_at intentionally omitted: preserve original creation timestamp

-- =====================
-- 晶圓類型
-- =====================
INSERT INTO wafer_types (id, type_code, name, is_active, created_at) VALUES
  ('wafer-type-001', 'W-12S', '12吋標準晶圓', TRUE, NOW())
ON DUPLICATE KEY UPDATE
  type_code = VALUES(type_code),
  name      = VALUES(name),
  is_active = VALUES(is_active);

-- =====================
-- 使用者
-- =====================
-- 使用者由 DemoDataInitializer.java 在啟動時以 BCrypt 建立

-- =====================
-- 客戶
-- =====================
INSERT INTO customers (id, customer_code, name, is_active, created_at) VALUES
  ('customer-001', 'CUST-NV',   'NVIDIA 台灣',    TRUE, NOW()),
  ('customer-002', 'CUST-AP',   'Apple Inc.',     TRUE, NOW()),
  ('customer-003', 'CUST-AMD',  'AMD 超微半導體', TRUE, NOW()),
  ('customer-004', 'CUST-MTK',  '聯發科技',       TRUE, NOW()),
  ('customer-005', 'CUST-QCOM', '高通半導體',     TRUE, NOW())
ON DUPLICATE KEY UPDATE
  customer_code = VALUES(customer_code),
  name          = VALUES(name),
  is_active     = VALUES(is_active);

-- =====================
-- 訂單與排程佇列由 DemoDataInitializer.java 在啟動時建立
-- （須在 users 建立後執行，避免 created_by FK 衝突）
-- =====================
