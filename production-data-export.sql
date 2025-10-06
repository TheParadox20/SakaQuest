-- SAKA Production Database Export
-- Generated for deployment synchronization
-- August 17, 2025

-- Clear existing data and recreate with development data
BEGIN;

-- Export Users (including admin user)
INSERT INTO users (id, name, email, password_hash, is_admin, created_at) VALUES 
('5a7bc731-467e-4215-bb21-5528385186a3', 'Janet Kasyoki', 'Janet0mwende@gmail.com', '$2b$10$Fhyy0a.4snAKv0vnDA/NIOHzIbCYLCvUGTKtrHOIjnQZ1kvShu7rC', true, '2025-08-15 19:54:06.828670'),
('mobile-test-user', 'Mobile Test User', 'mobile@test.com', '$2b$10$test-hash', false, '2025-08-15 19:54:06.828670')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  is_admin = EXCLUDED.is_admin;

-- Export Hunts (all 5 hunts with correct ordering)
INSERT INTO hunts (id, title, description, difficulty, category, start_coordinates, duration_minutes, cover_image_url, price, created_at) VALUES
('499cae2c-544d-4fd4-991b-1ec8594b5dbc', 'Nairobi Heritage Trail', 'Discover Kenya''s rich history through iconic landmarks in downtown Nairobi. From the National Archives to Tom Mboya Monument.', 'easy', 'History', '-1.2921,36.8219', 45, 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400', '0.00', '2025-08-15 19:54:06.828670'),
('55509730-e6cf-41e8-889c-d9c8cacf5a31', 'Ancient Kingdoms Quest', 'Journey through the remnants of great African civilizations and uncover stories of ancient rulers and trading empires.', 'hard', 'History', '-20.1619,28.5894', 90, 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400', '300.00', '2025-08-15 19:54:06.864853'),
('a14f297a-4880-4d5f-b182-fae4d93c7342', 'Historical Roots and Cultural Hubs', 'This hunt focuses on Nairobi''s freedom fighters, historical institutions, and vibrant cultural centers.', 'Medium', 'History', null, 120, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', '300.00', '2025-08-16 21:58:26.804828'),
('12ea9c42-99d1-40a9-a70d-b28478e14080', 'Nairobi''s Urban Canvas', 'This hunt takes users on a journey through Nairobi''s art scene, from historic galleries to vibrant street murals and contemporary art spaces.', 'Medium', 'Art & Culture', null, 180, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', '300.00', '2025-08-16 22:04:35.088316'),
('307cfb76-1ef0-425c-9809-e7331bc36802', 'Landmarks and Memory', 'This hunt explores the symbols of Kenyan governance, iconic architectural landmarks, and a place of national remembrance.', 'Medium', 'History', null, 150, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600', '300.00', '2025-08-16 22:05:26.009372')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  category = EXCLUDED.category,
  start_coordinates = EXCLUDED.start_coordinates,
  duration_minutes = EXCLUDED.duration_minutes,
  cover_image_url = EXCLUDED.cover_image_url,
  price = EXCLUDED.price,
  created_at = EXCLUDED.created_at;

-- Export sample purchases for testing
INSERT INTO purchases (id, user_id, hunt_id, amount, payment_status, payment_method, created_at) VALUES
('0635122b-a7d4-49f1-9800-e0f57ffd20ad', '5a7bc731-467e-4215-bb21-5528385186a3', '55509730-e6cf-41e8-889c-d9c8cacf5a31', '5.00', 'completed', 'admin_price', '2025-08-15 20:00:00'),
('sample-purchase-2', '5a7bc731-467e-4215-bb21-5528385186a3', 'a14f297a-4880-4d5f-b182-fae4d93c7342', '5.00', 'completed', 'admin_price', '2025-08-16 20:00:00'),
('sample-purchase-3', '5a7bc731-467e-4215-bb21-5528385186a3', '12ea9c42-99d1-40a9-a70d-b28478e14080', '5.00', 'completed', 'admin_price', '2025-08-16 21:00:00')
ON CONFLICT (id) DO UPDATE SET
  payment_status = EXCLUDED.payment_status,
  amount = EXCLUDED.amount;

-- Export user progress for testing
INSERT INTO user_progress (id, user_id, hunt_id, current_clue_order, completed, score, created_at) VALUES
('178a348d-7285-4245-a15b-be2f39bce8c6', '5a7bc731-467e-4215-bb21-5528385186a3', '499cae2c-544d-4fd4-991b-1ec8594b5dbc', 5, true, 100, '2025-08-15 21:00:00'),
('sample-progress-2', '5a7bc731-467e-4215-bb21-5528385186a3', '55509730-e6cf-41e8-889c-d9c8cacf5a31', 3, false, 60, '2025-08-16 20:30:00'),
('sample-progress-3', '5a7bc731-467e-4215-bb21-5528385186a3', 'a14f297a-4880-4d5f-b182-fae4d93c7342', 2, false, 40, '2025-08-16 21:30:00')
ON CONFLICT (id) DO UPDATE SET
  current_clue_order = EXCLUDED.current_clue_order,
  completed = EXCLUDED.completed,
  score = EXCLUDED.score;

COMMIT;