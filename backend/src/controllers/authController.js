import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import supabase from '../db/supabase.js';

// ── Validation Schemas ─────────────────────────────────────────────────────────
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Helper ────────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role ?? 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  // 1. Validate input
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { name, email, password } = parsed.data;

  try {
    // 2. Check for duplicate email
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ name, email, password_hash, role: 'user' })
      .select('id, email, name, role')
      .single();

    if (insertError) throw insertError;

    // 5. Return JWT
    const token = signToken(newUser);
    return res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
  } catch (err) {
    console.error('[signup]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  // 1. Validate input
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { email, password } = parsed.data;

  try {
    // 2. Look up user by email
    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Return JWT
    const token = signToken(user);
    return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
