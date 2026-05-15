CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
<<<<<<< HEAD
  role          ENUM('SUPER_ADMIN','ADMIN','VIEWER') NOT NULL DEFAULT 'VIEWER',
=======
  role          ENUM('ADMIN','VIEWER') NOT NULL DEFAULT 'VIEWER',
>>>>>>> main
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username)
);

CREATE TABLE IF NOT EXISTS customers (
<<<<<<< HEAD
  id            VARCHAR(36)  NOT NULL,
  customer_code VARCHAR(20)  NOT NULL,
  name          VARCHAR(100) NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
=======
  id             VARCHAR(36)  NOT NULL,
  customer_code  VARCHAR(20)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100),
  contact_email  VARCHAR(150),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
>>>>>>> main
  PRIMARY KEY (id),
  UNIQUE KEY uq_customer_code (customer_code)
);

CREATE TABLE IF NOT EXISTS factories (
  id             VARCHAR(36)  NOT NULL,
  factory_code   VARCHAR(20)  NOT NULL,
  name           VARCHAR(100) NOT NULL,
  daily_capacity INT          NOT NULL DEFAULT 10000,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_factory_code (factory_code)
);

CREATE TABLE IF NOT EXISTS wafer_types (
  id         VARCHAR(36)  NOT NULL,
  type_code  VARCHAR(20)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_type_code (type_code)
);

CREATE TABLE IF NOT EXISTS orders (
  id                    VARCHAR(36) NOT NULL,
  factory_id            VARCHAR(36) NOT NULL,
  wafer_type_id         VARCHAR(36) NOT NULL,
  customer_id           VARCHAR(36) NOT NULL,
  created_by            VARCHAR(36) NOT NULL,
  quantity              INT         NOT NULL,
  remaining_quantity    INT         NOT NULL,
  status                ENUM('PENDING','SCHEDULED','IN_PRODUCTION','COMPLETED','CANCELLED')
                        NOT NULL DEFAULT 'PENDING',
  customer_due_date     DATE        NOT NULL,
  last_slot_date        DATE,
  expected_due_date     DATE,
  is_delayed            BOOLEAN     NOT NULL DEFAULT FALSE,
  delay_days            INT         NOT NULL DEFAULT 0,
  schedule_warning      VARCHAR(255),
  cancelled_from_status ENUM('PENDING','SCHEDULED','IN_PRODUCTION'),
  version               INT         NOT NULL DEFAULT 0,
  created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_quantity CHECK (quantity BETWEEN 25 AND 2500),
<<<<<<< HEAD
  KEY idx_orders_status (status),
  KEY idx_orders_customer (customer_id),
  KEY idx_orders_factory_due (factory_id, customer_due_date),
  KEY idx_orders_created_at (created_at),
=======
>>>>>>> main
  FOREIGN KEY (factory_id)    REFERENCES factories(id),
  FOREIGN KEY (wafer_type_id) REFERENCES wafer_types(id),
  FOREIGN KEY (customer_id)   REFERENCES customers(id),
  FOREIGN KEY (created_by)    REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_history (
  id                         VARCHAR(36) NOT NULL,
  order_id                   VARCHAR(36) NOT NULL,
  changed_by                 VARCHAR(36) NOT NULL,
  change_type                ENUM('CREATED','MODIFIED','CANCELLED') NOT NULL,
  changed_at                 TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  snapshot_quantity          INT,
  snapshot_customer_due_date DATE,
  snapshot_status            VARCHAR(20),
  snapshot_last_slot_date    DATE,
  snapshot_is_delayed        BOOLEAN,
  snapshot_delay_days        INT,
  snapshot_schedule_warning  VARCHAR(255),
  PRIMARY KEY (id),
<<<<<<< HEAD
  KEY idx_history_order_id (order_id),
  KEY idx_history_changed_at (changed_at),
=======
>>>>>>> main
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS production_slots (
  id         VARCHAR(36) NOT NULL,
  order_id   VARCHAR(36) NOT NULL,
  factory_id VARCHAR(36) NOT NULL,
  slot_date  DATE        NOT NULL,
  quantity   INT         NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
<<<<<<< HEAD
  KEY idx_slots_factory_date (factory_id, slot_date),
=======
>>>>>>> main
  FOREIGN KEY (order_id)   REFERENCES orders(id),
  FOREIGN KEY (factory_id) REFERENCES factories(id)
);

CREATE TABLE IF NOT EXISTS daily_capacity_usage (
  id            VARCHAR(36) NOT NULL,
  factory_id    VARCHAR(36) NOT NULL,
  slot_date     DATE        NOT NULL,
  used_quantity INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_factory_date (factory_id, slot_date),
  FOREIGN KEY (factory_id) REFERENCES factories(id)
);

CREATE TABLE IF NOT EXISTS scheduling_queue (
  id           VARCHAR(36) NOT NULL,
  order_id     VARCHAR(36),
  action       ENUM('SCHEDULE_ORDER','CANCEL_ORDER','RESCHEDULE_ALL') NOT NULL,
  status       ENUM('PENDING','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  priority     INT       NOT NULL DEFAULT 100,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  PRIMARY KEY (id),
<<<<<<< HEAD
  KEY idx_queue_status_pri (status, priority, created_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

=======
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_status         ON orders(status);
CREATE INDEX idx_orders_customer       ON orders(customer_id);
CREATE INDEX idx_orders_factory_due    ON orders(factory_id, customer_due_date);
CREATE INDEX idx_orders_created_at     ON orders(created_at);
CREATE INDEX idx_history_order_id      ON order_history(order_id);
CREATE INDEX idx_history_changed_at    ON order_history(changed_at);
CREATE INDEX idx_slots_factory_date    ON production_slots(factory_id, slot_date);
CREATE INDEX idx_queue_status_pri      ON scheduling_queue(status, priority, created_at);

>>>>>>> main
