-- ============================================================
-- BriefForge — Seed Data
-- Run AFTER 001_init.sql
-- Passwords are bcrypt of "demo1234" (cost=10)
-- ============================================================

-- Demo users
INSERT INTO users (id, email, password_hash, name, role) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'alice@briefforge.dev',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHiy',
   'Alice Morgan',
   'admin'),
  ('22222222-2222-2222-2222-222222222222',
   'bob@briefforge.dev',
   '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHiy',
   'Bob Chen',
   'user');

-- Demo clients
INSERT INTO clients (id, user_id, name, industry, notes) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111',
   'Nike',
   'Sportswear',
   'Global brand, focus on empowerment and performance. Brand voice: bold, energetic.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '11111111-1111-1111-1111-111111111111',
   'Starbucks',
   'Food & Beverage',
   'Premium coffee brand. Warm, inviting, community-focused voice.');

-- Sample brief (belongs to Alice / Nike)
INSERT INTO briefs (
  id, user_id, client_id, title, raw_brief,
  product, audience, goal, key_message, tone,
  platforms, deadline, brand_guidelines, status
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Air Max Spring Launch 2025',
  'We are launching the new Nike Air Max 360 for Spring 2025. The campaign should capture the feeling of limitless movement and urban energy.',
  'Nike Air Max 360',
  'Urban millennials 18–34 who are active and fashion-conscious',
  'Drive pre-order sign-ups and brand awareness for the Spring launch',
  'Move without limits — the Air Max 360 is built for those who never stop.',
  'Bold',
  '["instagram","twitter","linkedin","facebook","tiktok"]',
  '2025-04-01',
  'Use brand colors: black, white, neon orange. No competitor mentions. Energetic visuals preferred.',
  'complete'
);

-- Sample generation (captions for Instagram)
INSERT INTO generations (
  id, brief_id, type, platform, content, model_used, tokens_used
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'caption',
  'instagram',
  '["🔥 The streets are yours. Air Max 360 — move without limits. #NikeAirMax #SpringLaunch",
    "Built for the ones who never stop. The Air Max 360 just landed. Pre-order link in bio 👟",
    "Urban energy. Limitless movement. The Air Max 360 redefines what it means to run the city. 🏙️ #NeverStopMoving",
    "Spring has a new soundtrack and it sounds like Air Max. Drop your city below 🌆 #AirMax360",
    "When comfort meets culture — the Air Max 360 is here. Pre-order now before they sell out 🔥"]',
  'mistral:7b-instruct',
  480
);
