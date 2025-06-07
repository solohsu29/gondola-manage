CREATE TABLE IF NOT EXISTS "RepairLog" (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  gondolaId text NOT NULL,
  date timestamp NOT NULL,
  type varchar(255) NOT NULL,
  description text NOT NULL,
  partName varchar(255),
  cost double precision NOT NULL,
  isChargeable boolean NOT NULL,
  technician varchar(255) NOT NULL,
  status varchar(255) NOT NULL,
  CONSTRAINT fk_gondola FOREIGN KEY (gondolaId) REFERENCES "Gondola"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_repairlog_gondolaId ON "RepairLog"(gondolaId);
