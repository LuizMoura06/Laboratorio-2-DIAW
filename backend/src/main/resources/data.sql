INSERT INTO vehicles (id, registration, manufacturing_year, brand, model, plate, owner_type, owner_name, daily_rate, category) VALUES
('f0000000-0000-0000-0000-000000000001','MAT-2024-001',2024,'Toyota','Corolla XEi','RNT2A41','COMPANY','AlugaMais Frota',189.90,'Sedã'),
('f0000000-0000-0000-0000-000000000002','MAT-2025-002',2025,'Jeep','Compass Longitude','RNT2B62','BANK','Banco Parceiro',279.90,'SUV'),
('f0000000-0000-0000-0000-000000000003','MAT-2023-003',2023,'Honda','Civic EXL','RNT3C15','COMPANY','AlugaMais Frota',219.90,'Sedã'),
('f0000000-0000-0000-0000-000000000004','MAT-2025-004',2025,'Volkswagen','T-Cross Highline','RNT4D89','CLIENT','Cliente proprietário',249.90,'SUV'),
('f0000000-0000-0000-0000-000000000005','MAT-2024-005',2024,'Fiat','Pulse Drive','RNT5E11','COMPANY','AlugaMais Frota',149.90,'Hatch'),
('f0000000-0000-0000-0000-000000000006','MAT-2025-006',2025,'Hyundai','HB20 Platinum','RNT6F22','BANK','Banco Parceiro',169.90,'Hatch')
ON CONFLICT (plate) DO NOTHING;

