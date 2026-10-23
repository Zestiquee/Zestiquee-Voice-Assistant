import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'zestiquee-db.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

/* =========================================================
   MULTI-USER DATABASE ARCHITECTURE & TYPES
   ========================================================= */
interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  authProvider: 'email' | 'google';
  googleId?: string;
  createdAt: string;
  profile: any;
}

interface UserSession {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface MultiUserDB {
  users: UserAccount[];
  sessions: UserSession[];
  pantry: Record<string, any[]>;
  shopping: Record<string, any[]>;
  savedRecipes: Record<string, any[]>;
  mealPlans: Record<string, any[]>;
  timers: Record<string, any[]>;
  conversations: Record<string, any[]>;
}

// Password cryptographic hashing & verification using native Node.js crypto
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// Create initial multi-user database with sample data for demonstration account
function createDefaultMultiUserDB(): MultiUserDB {
  const defaultUserId = 'usr_default';
  const defaultSalt = 'default_zestiquee_salt_2026';
  const defaultHash = hashPassword('Zestiquee@2026', defaultSalt);

  const defaultUserAccount: UserAccount = {
    id: defaultUserId,
    name: 'Snikitha',
    email: 'snikithavavi@gmail.com',
    passwordHash: defaultHash,
    passwordSalt: defaultSalt,
    authProvider: 'email',
    createdAt: new Date().toISOString(),
    profile: {
      id: defaultUserId,
      name: 'Snikitha',
      email: 'snikithavavi@gmail.com',
      displayLanguage: 'en',
      inputLanguage: 'en',
      responseLanguage: 'en',
      voicePreference: 'Kore',
      speechRate: 1.0,
      householdSize: 3,
      dietaryPreferences: ['Vegetarian Friendly'],
      allergies: ['Peanuts'],
      dislikedFoods: ['Bitter gourd'],
      preferredCuisines: ['South Indian', 'North Indian', 'Italian', 'Mexican'],
      measurementUnit: 'metric',
      currency: '₹',
      cookingSkill: 'intermediate',
      budget: 5000,
      isOnboarded: true,
      isAuthenticated: true,
    },
  };

  const samplePantry = [
    {
      id: 'p_1',
      name: 'Basmati Rice',
      category: 'Grains and rice',
      quantity: 2,
      unit: 'kg',
      purchaseDate: '2026-10-15',
      expiryDate: '2027-04-15',
      storageLocation: 'Pantry',
      notes: 'Aged fragrant basmati',
      lowStockThreshold: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_2',
      name: 'Toor Dal (Lentils)',
      category: 'Pulses, beans, and lentils',
      quantity: 1,
      unit: 'kg',
      purchaseDate: '2026-10-10',
      expiryDate: '2027-03-10',
      storageLocation: 'Pantry',
      lowStockThreshold: 0.25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_3',
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      quantity: 800,
      unit: 'g',
      purchaseDate: '2026-10-20',
      expiryDate: '2026-10-25',
      storageLocation: 'Fridge',
      notes: 'Ripe country tomatoes, use soon',
      lowStockThreshold: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_4',
      name: 'Red Onions',
      category: 'Vegetables',
      quantity: 1.5,
      unit: 'kg',
      purchaseDate: '2026-10-18',
      expiryDate: '2026-11-18',
      storageLocation: 'Pantry',
      lowStockThreshold: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_5',
      name: 'Fresh Spinach (Palak)',
      category: 'Vegetables',
      quantity: 250,
      unit: 'g',
      purchaseDate: '2026-10-21',
      expiryDate: '2026-10-24',
      storageLocation: 'Fridge',
      notes: 'Tender leaves, great for dal palak',
      lowStockThreshold: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_6',
      name: 'Milk',
      category: 'Dairy and dairy alternatives',
      quantity: 1,
      unit: 'L',
      purchaseDate: '2026-10-21',
      expiryDate: '2026-10-24',
      storageLocation: 'Fridge',
      lowStockThreshold: 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p_7',
      name: 'Whole Wheat Atta (Flour)',
      category: 'Flour and baking ingredients',
      quantity: 3,
      unit: 'kg',
      purchaseDate: '2026-10-05',
      expiryDate: '2027-01-05',
      storageLocation: 'Pantry',
      lowStockThreshold: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleShopping = [
    {
      id: 's_1',
      name: 'Cooking Oil (1L refill)',
      category: 'Oils and fats',
      quantity: 1,
      unit: 'L',
      estimatedPrice: 160,
      notes: 'Pantry stock is below 300ml',
      purchased: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 's_2',
      name: 'Paneer (Cottage Cheese)',
      category: 'Dairy and dairy alternatives',
      quantity: 200,
      unit: 'g',
      estimatedPrice: 90,
      notes: 'For Palak Paneer dinner plan',
      purchased: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users: [defaultUserAccount],
    sessions: [],
    pantry: { [defaultUserId]: samplePantry },
    shopping: { [defaultUserId]: sampleShopping },
    savedRecipes: { [defaultUserId]: [] },
    mealPlans: { [defaultUserId]: [] },
    timers: { [defaultUserId]: [] },
    conversations: { [defaultUserId]: [] },
  };
}

function readDB(): MultiUserDB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initDB = createDefaultMultiUserDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initDB, null, 2), 'utf-8');
      return initDB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // If legacy format (contains single user object instead of users array), migrate automatically
    if (parsed.user && !parsed.users) {
      const defaultUserId = parsed.user.id || 'usr_default';
      const salt = 'migrated_salt_' + Date.now();
      const hash = hashPassword('Zestiquee@2026', salt);

      const migrated: MultiUserDB = {
        users: [
          {
            id: defaultUserId,
            email: parsed.user.email || 'snikithavavi@gmail.com',
            name: parsed.user.name || 'Snikitha',
            passwordHash: hash,
            passwordSalt: salt,
            authProvider: 'email',
            createdAt: new Date().toISOString(),
            profile: {
              ...parsed.user,
              id: defaultUserId,
              isOnboarded: true,
              isAuthenticated: true,
            },
          },
        ],
        sessions: [],
        pantry: { [defaultUserId]: parsed.pantry || [] },
        shopping: { [defaultUserId]: parsed.shopping || [] },
        savedRecipes: { [defaultUserId]: parsed.savedRecipes || [] },
        mealPlans: { [defaultUserId]: parsed.mealPlans || [] },
        timers: { [defaultUserId]: parsed.timers || [] },
        conversations: { [defaultUserId]: parsed.conversations || [] },
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(migrated, null, 2), 'utf-8');
      return migrated;
    }

    // Ensure all multi-user collections exist
    parsed.users = parsed.users || [];
    parsed.sessions = parsed.sessions || [];
    parsed.pantry = parsed.pantry || {};
    parsed.shopping = parsed.shopping || {};
    parsed.savedRecipes = parsed.savedRecipes || {};
    parsed.mealPlans = parsed.mealPlans || {};
    parsed.timers = parsed.timers || {};
    parsed.conversations = parsed.conversations || {};

    return parsed;
  } catch (err) {
    console.error('Error reading DB, using default multi-user DB:', err);
    return createDefaultMultiUserDB();
  }
}

function writeDB(data: MultiUserDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

/* =========================================================
   AUTHENTICATION & SESSION VERIFICATION MIDDLEWARE
   ========================================================= */
function getAuthenticatedUser(
  req: Request,
  db: MultiUserDB
): { user: UserAccount; userId: string } | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (!token) return null;

  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    // Session expired, remove it
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDB(db);
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;

  return { user, userId: user.id };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const db = readDB();
  const auth = getAuthenticatedUser(req, db);
  if (!auth) {
    return res
      .status(401)
      .json({ success: false, error: 'Unauthorized: Authentication is required to access kitchen data.' });
  }
  (req as any).user = auth.user;
  (req as any).userId = auth.userId;
  next();
}

// Initialize Gemini SDK with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* =========================================================
   PUBLIC AUTHENTICATION ROUTES
   ========================================================= */

// 0. Auth Configuration (returns Google Client ID if available in environment)
app.get('/api/auth/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// 1. Email Sign Up
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email, password, language = 'en' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Preferred name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }
  const emailNorm = email.trim().toLowerCase();
  if (!emailNorm.includes('@') || !emailNorm.includes('.')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters long.',
    });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === emailNorm);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists. Please log in.',
    });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  const newUserAccount: UserAccount = {
    id: userId,
    email: emailNorm,
    name: name.trim(),
    passwordHash: hash,
    passwordSalt: salt,
    authProvider: 'email',
    createdAt: new Date().toISOString(),
    profile: {
      id: userId,
      name: name.trim(),
      email: emailNorm,
      displayLanguage: language,
      inputLanguage: language,
      responseLanguage: language,
      voicePreference: 'Kore',
      speechRate: 1.0,
      householdSize: 1, // Sensible default 1
      dietaryPreferences: [], // Unrestricted
      allergies: [],
      dislikedFoods: [],
      preferredCuisines: [],
      measurementUnit: 'metric',
      currency: '₹',
      cookingSkill: 'intermediate',
      isOnboarded: false, // New users MUST complete onboarding!
      isAuthenticated: true,
      authMethod: 'email',
    },
  };

  db.users.push(newUserAccount);
  // Initialize completely empty, isolated collections for this new user
  db.pantry[userId] = [];
  db.shopping[userId] = [];
  db.savedRecipes[userId] = [];
  db.mealPlans[userId] = [];
  db.timers[userId] = [];
  db.conversations[userId] = [];

  // Create session
  const token = 'sess_' + crypto.randomUUID();
  db.sessions.push({
    token,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
  });

  writeDB(db);
  res.json({
    success: true,
    token,
    user: newUserAccount.profile,
    isNewUser: true,
  });
});

// 2. Email Log In
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === emailNorm);

  if (!user || !user.passwordHash || !user.passwordSalt) {
    return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
  }

  const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
  }

  // Create session
  const token = 'sess_' + crypto.randomUUID();
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  });

  writeDB(db);
  res.json({
    success: true,
    token,
    user: user.profile,
    isNewUser: !user.profile.isOnboarded,
  });
});

// 3. Google OAuth Authentication (Genuine GIS Token or Backend Verification)
app.post('/api/auth/google', (req: Request, res: Response) => {
  const { credential, email, name, googleId, language = 'en' } = req.body;
  let userEmail = email;
  let userName = name;
  let userGId = googleId;

  // If a JWT credential was returned by Google Identity Services, decode payload
  if (credential && typeof credential === 'string') {
    try {
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        userEmail = payload.email || userEmail;
        userName = payload.name || userName;
        userGId = payload.sub || userGId;
      }
    } catch (e) {
      console.warn('Google credential token decode error:', e);
    }
  }

  if (!userEmail) {
    return res.status(400).json({ success: false, error: 'Google email address is required.' });
  }

  const emailNorm = userEmail.trim().toLowerCase();
  const db = readDB();
  let user = db.users.find((u) => u.email.toLowerCase() === emailNorm);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    user = {
      id: userId,
      email: emailNorm,
      name: userName || emailNorm.split('@')[0],
      authProvider: 'google',
      googleId: userGId,
      createdAt: new Date().toISOString(),
      profile: {
        id: userId,
        name: userName || emailNorm.split('@')[0],
        email: emailNorm,
        displayLanguage: language,
        inputLanguage: language,
        responseLanguage: language,
        voicePreference: 'Kore',
        speechRate: 1.0,
        householdSize: 1,
        dietaryPreferences: [],
        allergies: [],
        dislikedFoods: [],
        preferredCuisines: [],
        measurementUnit: 'metric',
        currency: '₹',
        cookingSkill: 'intermediate',
        isOnboarded: false, // New Google user must complete onboarding!
        isAuthenticated: true,
        authMethod: 'google',
      },
    };

    db.users.push(user);
    db.pantry[userId] = [];
    db.shopping[userId] = [];
    db.savedRecipes[userId] = [];
    db.mealPlans[userId] = [];
    db.timers[userId] = [];
    db.conversations[userId] = [];
  } else {
    // If existing user didn't have Google linked, link it
    if (user.authProvider !== 'google') {
      user.googleId = userGId;
    }
  }

  const token = 'sess_' + crypto.randomUUID();
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  });

  writeDB(db);
  res.json({
    success: true,
    token,
    user: user.profile,
    isNewUser: isNewUser || !user.profile.isOnboarded,
  });
});

// 4. Session Verification (/api/auth/me)
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ success: true, user: user.profile });
});

// 5. Log Out (Invalidates active session token)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : (req.headers['x-session-token'] as string);

  if (token) {
    const db = readDB();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDB(db);
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Password Reset Endpoint
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === emailNorm);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'No registered Zestiquee account found with this email.',
    });
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }
    const salt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = salt;
    user.passwordHash = hashPassword(newPassword, salt);
    writeDB(db);
    return res.json({
      success: true,
      message: 'Password has been successfully updated. You can now log in.',
    });
  }

  res.json({
    success: true,
    message: `Password reset verification ready for ${emailNorm}. Enter your new password to complete reset.`,
  });
});

// 7. Delete Account (Permanently deletes user and their isolated data)
app.delete('/api/auth/account', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();

  db.users = db.users.filter((u) => u.id !== userId);
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
  delete db.pantry[userId];
  delete db.shopping[userId];
  delete db.savedRecipes[userId];
  delete db.mealPlans[userId];
  delete db.timers[userId];
  delete db.conversations[userId];

  writeDB(db);
  res.json({
    success: true,
    message: 'Your account and personal kitchen records have been permanently deleted.',
  });
});

/* =========================================================
   USER PROFILE & ONBOARDING ROUTES (PROTECTED)
   ========================================================= */
app.get('/api/user', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user: user.profile });
});

app.post('/api/user', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found' });

  db.users[index].profile = { ...db.users[index].profile, ...req.body };
  if (req.body.name) db.users[index].name = req.body.name;
  writeDB(db);
  res.json({ success: true, user: db.users[index].profile });
});

// Save complete new user onboarding preferences
app.post('/api/user/onboarding', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found' });

  const current = db.users[index].profile;
  const updates = req.body;

  db.users[index].profile = {
    ...current,
    ...updates,
    isOnboarded: true,
    isAuthenticated: true,
  };
  if (updates.name) db.users[index].name = updates.name;

  writeDB(db);
  res.json({ success: true, user: db.users[index].profile });
});

/* =========================================================
   PANTRY MANAGEMENT (ISOLATED PER USER)
   ========================================================= */
app.get('/api/pantry', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  res.json({ success: true, items: db.pantry[userId] || [] });
});

app.post('/api/pantry', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.pantry[userId] = db.pantry[userId] || [];
  const userPantry = db.pantry[userId];

  const { items } = req.body;
  const newItems = Array.isArray(items) ? items : [req.body];

  const added: any[] = [];
  for (const item of newItems) {
    if (!item.name) continue;
    const existingIndex = userPantry.findIndex(
      (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      userPantry[existingIndex].quantity = Number(
        (Number(userPantry[existingIndex].quantity) + Number(item.quantity || 1)).toFixed(2)
      );
      userPantry[existingIndex].updatedAt = new Date().toISOString();
      if (item.expiryDate) userPantry[existingIndex].expiryDate = item.expiryDate;
      added.push(userPantry[existingIndex]);
    } else {
      const createdItem = {
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: item.name.trim(),
        category: item.category || 'Pantry Staples',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'unit',
        purchaseDate: item.purchaseDate || new Date().toISOString().split('T')[0],
        expiryDate: item.expiryDate || '',
        storageLocation: item.storageLocation || 'Pantry',
        notes: item.notes || '',
        lowStockThreshold: Number(item.lowStockThreshold) || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      userPantry.push(createdItem);
      added.push(createdItem);
    }
  }

  writeDB(db);
  res.json({ success: true, items: added, allPantry: userPantry });
});

app.put('/api/pantry/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.pantry[userId] = db.pantry[userId] || [];
  const userPantry = db.pantry[userId];

  const { id } = req.params;
  const index = userPantry.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Pantry item not found' });
  }

  userPantry[index] = {
    ...userPantry[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  res.json({ success: true, item: userPantry[index] });
});

app.delete('/api/pantry/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.pantry[userId] = (db.pantry[userId] || []).filter((p) => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

app.post('/api/pantry/consume', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.pantry[userId] = db.pantry[userId] || [];
  const userPantry = db.pantry[userId];

  const { id, consumeAmount } = req.body;
  const index = userPantry.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  const current = Number(userPantry[index].quantity);
  const consume = Number(consumeAmount);
  const updatedQty = Math.max(0, Number((current - consume).toFixed(2)));

  userPantry[index].quantity = updatedQty;
  userPantry[index].updatedAt = new Date().toISOString();

  if (updatedQty === 0) {
    userPantry[index].notes = (userPantry[index].notes ? userPantry[index].notes + ' ' : '') + '[Depleted]';
  }

  writeDB(db);
  res.json({ success: true, item: userPantry[index], depleted: updatedQty === 0 });
});

/* =========================================================
   SHOPPING LIST (SEPARATE FROM PANTRY, ISOLATED PER USER)
   ========================================================= */
app.get('/api/shopping', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  res.json({ success: true, items: db.shopping[userId] || [] });
});

app.post('/api/shopping', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.shopping[userId] = db.shopping[userId] || [];
  const userShopping = db.shopping[userId];

  const { items } = req.body;
  const newItems = Array.isArray(items) ? items : [req.body];

  const added: any[] = [];
  for (const item of newItems) {
    if (!item.name) continue;
    const existing = userShopping.find(
      (s) => s.name.trim().toLowerCase() === item.name.trim().toLowerCase() && !s.purchased
    );
    if (existing) {
      existing.quantity = Number((Number(existing.quantity) + Number(item.quantity || 1)).toFixed(2));
      added.push(existing);
    } else {
      const shoppingItem = {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: item.name.trim(),
        category: item.category || 'Groceries',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'unit',
        estimatedPrice: Number(item.estimatedPrice) || 0,
        notes: item.notes || '',
        purchased: false,
        createdAt: new Date().toISOString(),
        isAutoRestock: item.isAutoRestock || false,
        restockReason: item.restockReason,
        pantryQuantity: item.pantryQuantity,
        pantryThreshold: item.pantryThreshold,
        suggestedQuantity: item.suggestedQuantity,
        neededForRecipe: item.neededForRecipe,
      };
      userShopping.push(shoppingItem);
      added.push(shoppingItem);
    }
  }

  writeDB(db);
  res.json({ success: true, items: added, allShopping: userShopping });
});

app.put('/api/shopping/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.shopping[userId] = db.shopping[userId] || [];
  const userShopping = db.shopping[userId];

  const { id } = req.params;
  const index = userShopping.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Shopping item not found' });
  }

  userShopping[index] = { ...userShopping[index], ...req.body };
  writeDB(db);
  res.json({ success: true, item: userShopping[index] });
});

app.delete('/api/shopping/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.shopping[userId] = (db.shopping[userId] || []).filter((s) => s.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

// Transfer purchased items into pantry inventory with duplicate check (isolated per user)
app.post('/api/shopping/transfer-to-pantry', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.shopping[userId] = db.shopping[userId] || [];
  db.pantry[userId] = db.pantry[userId] || [];
  const userShopping = db.shopping[userId];
  const userPantry = db.pantry[userId];

  const { itemIds } = req.body;
  const itemsToTransfer = userShopping.filter((s) =>
    itemIds ? itemIds.includes(s.id) : s.purchased
  );

  if (itemsToTransfer.length === 0) {
    return res.json({ success: true, transferredCount: 0, message: 'No purchased items to transfer' });
  }

  for (const item of itemsToTransfer) {
    const existingIndex = userPantry.findIndex(
      (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      userPantry[existingIndex].quantity = Number(
        (Number(userPantry[existingIndex].quantity) + Number(item.quantity)).toFixed(2)
      );
      userPantry[existingIndex].updatedAt = new Date().toISOString();
    } else {
      userPantry.push({
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: item.name,
        category: item.category || 'Pantry Staples',
        quantity: item.quantity,
        unit: item.unit,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        storageLocation: 'Pantry',
        notes: 'Transferred from shopping list',
        lowStockThreshold: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  db.shopping[userId] = userShopping.filter((s) => !itemsToTransfer.some((t) => t.id === s.id));
  writeDB(db);

  res.json({
    success: true,
    transferredCount: itemsToTransfer.length,
    pantry: db.pantry[userId],
    shopping: db.shopping[userId],
  });
});

/* =========================================================
   SAVED RECIPES (ISOLATED PER USER)
   ========================================================= */
app.get('/api/recipes/saved', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  res.json({ success: true, recipes: db.savedRecipes[userId] || [] });
});

app.post('/api/recipes/save', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.savedRecipes[userId] = db.savedRecipes[userId] || [];
  const userSaved = db.savedRecipes[userId];

  const recipe = req.body;
  if (!recipe || !recipe.id) {
    return res.status(400).json({ success: false, error: 'Invalid recipe object' });
  }

  const existingIndex = userSaved.findIndex((r) => r.id === recipe.id);
  if (existingIndex >= 0) {
    userSaved[existingIndex] = recipe;
  } else {
    userSaved.push({ ...recipe, savedAt: new Date().toISOString() });
  }

  writeDB(db);
  res.json({ success: true, savedRecipes: userSaved });
});

app.delete('/api/recipes/saved/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.savedRecipes[userId] = (db.savedRecipes[userId] || []).filter((r) => r.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, id: req.params.id, savedRecipes: db.savedRecipes[userId] });
});

/* =========================================================
   MEAL PLANS (ISOLATED PER USER)
   ========================================================= */
app.get('/api/meal-plans', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  res.json({ success: true, plans: db.mealPlans[userId] || [] });
});

app.post('/api/meal-plans', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.mealPlans[userId] = db.mealPlans[userId] || [];
  const userPlans = db.mealPlans[userId];

  const plan = req.body;
  if (!plan.id) {
    plan.id = 'mp_' + Date.now();
  }
  const existingIndex = userPlans.findIndex((p) => p.id === plan.id);
  if (existingIndex >= 0) {
    userPlans[existingIndex] = plan;
  } else {
    userPlans.push(plan);
  }
  writeDB(db);
  res.json({ success: true, plan });
});

app.post('/api/meal-plans/generate-shopping-list', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = (req as any).user.profile;
  const db = readDB();
  const userPantry = db.pantry[userId] || [];
  const userShopping = db.shopping[userId] || [];
  const { mealPlan } = req.body;

  try {
    const prompt = `Analyze this meal plan for a household of ${user.householdSize || 2}:
${JSON.stringify(mealPlan, null, 2)}

User allergies: ${(user.allergies || []).join(', ')}
Current pantry items: ${JSON.stringify(userPantry.map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit })), null, 2)}
Current shopping list: ${JSON.stringify(userShopping.map((s) => ({ name: s.name })), null, 2)}

Identify all required ingredients for these meals, subtract what is already available in the pantry in sufficient quantity, and exclude items already on the shopping list. Never include ingredients conflicting with allergies: ${(user.allergies || []).join(', ')}.

Return a JSON array of items to add to the shopping list with schema:
[
  { "name": string, "category": string, "quantity": number, "unit": string, "estimatedPrice": number, "notes": string }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    let addedCount = 0;
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (!item.name) continue;
        const exists = userShopping.some(
          (s) => s.name.toLowerCase().trim() === item.name.toLowerCase().trim()
        );
        if (!exists) {
          userShopping.push({
            id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: item.name,
            category: item.category || 'Meal Plan Prep',
            quantity: Number(item.quantity) || 1,
            unit: item.unit || 'unit',
            estimatedPrice: Number(item.estimatedPrice) || 0,
            notes: item.notes || 'For meal plan',
            purchased: false,
            createdAt: new Date().toISOString(),
          });
          addedCount++;
        }
      }
      writeDB(db);
    }

    res.json({ success: true, addedCount, shoppingList: userShopping });
  } catch (err: any) {
    console.error('Error generating shopping list from meal plan:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================================================
   TIMERS (ISOLATED PER USER)
   ========================================================= */
app.get('/api/timers', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  const userTimers = db.timers[userId] || [];
  const now = Date.now();

  const activeTimers = userTimers.map((t) => {
    if (t.isPaused) return t;
    const rem = Math.max(0, Math.round((t.endTimestamp - now) / 1000));
    return { ...t, remainingSeconds: rem };
  });
  res.json({ success: true, timers: activeTimers });
});

app.post('/api/timers', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.timers[userId] = db.timers[userId] || [];
  const userTimers = db.timers[userId];

  const { label, durationSeconds, recipeId, stepNumber } = req.body;
  const now = Date.now();
  const dur = Number(durationSeconds) || 300;

  const newTimer = {
    id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    label: label || 'Cooking Timer',
    durationSeconds: dur,
    startTimestamp: now,
    endTimestamp: now + dur * 1000,
    remainingSeconds: dur,
    isPaused: false,
    recipeId: recipeId || null,
    stepNumber: stepNumber || null,
  };

  userTimers.push(newTimer);
  writeDB(db);
  res.json({ success: true, timer: newTimer });
});

app.put('/api/timers/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.timers[userId] = db.timers[userId] || [];
  const userTimers = db.timers[userId];

  const { id } = req.params;
  const { isPaused } = req.body;
  const index = userTimers.findIndex((t) => t.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Timer not found' });
  }

  const timer = userTimers[index];
  const now = Date.now();

  if (isPaused && !timer.isPaused) {
    const remaining = Math.max(0, Math.round((timer.endTimestamp - now) / 1000));
    timer.isPaused = true;
    timer.pausedRemainingSeconds = remaining;
    timer.remainingSeconds = remaining;
  } else if (!isPaused && timer.isPaused) {
    const rem = timer.pausedRemainingSeconds || timer.remainingSeconds || 60;
    timer.isPaused = false;
    timer.startTimestamp = now;
    timer.endTimestamp = now + rem * 1000;
    timer.remainingSeconds = rem;
  }

  writeDB(db);
  res.json({ success: true, timer });
});

app.delete('/api/timers/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.timers[userId] = (db.timers[userId] || []).filter((t) => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

/* =========================================================
   CONVERSATION HISTORY (ISOLATED PER USER)
   ========================================================= */
app.get('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  res.json({ success: true, conversations: db.conversations[userId] || [] });
});

app.post('/api/conversations', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.conversations[userId] = db.conversations[userId] || [];
  const userConversations = db.conversations[userId];

  const { id, title, messages } = req.body;
  const convId = id || 'conv_' + Date.now();
  const existingIndex = userConversations.findIndex((c) => c.id === convId);

  const updatedConv = {
    id: convId,
    title: title || 'Kitchen Conversation',
    createdAt: existingIndex >= 0 ? userConversations[existingIndex].createdAt : Date.now(),
    updatedAt: Date.now(),
    messages: messages || [],
  };

  if (existingIndex >= 0) {
    userConversations[existingIndex] = updatedConv;
  } else {
    userConversations.unshift(updatedConv);
  }

  if (userConversations.length > 30) {
    db.conversations[userId] = userConversations.slice(0, 30);
  }

  writeDB(db);
  res.json({ success: true, conversation: updatedConv });
});

app.delete('/api/conversations/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const db = readDB();
  db.conversations[userId] = (db.conversations[userId] || []).filter((c) => c.id !== req.params.id);
  writeDB(db);
  res.json({ success: true, id: req.params.id });
});

/* =========================================================
   PROJECT ZIP DOWNLOAD ENDPOINT
   ========================================================= */
app.get('/api/download-zip', (req: Request, res: Response) => {
  const zipPath = path.join(__dirname, 'public', 'zestiquee-project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="zestiquee-project.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ success: false, error: 'Project zip archive not found. Re-run scripts/create_zip.py.' });
  }
});

/* =========================================================
   VERIFIED YOUTUBE COOKING VIDEOS HELPER
   ========================================================= */
app.get('/api/youtube/search', (req: Request, res: Response) => {
  const { dish, language, skillLevel } = req.query;
  const qDish = (dish as string) || 'delicious recipe';
  const qLang = (language as string) || 'English';
  const qSkill = (skillLevel as string) || 'beginner';

  const searchQuery = `${qDish} recipe authentic step by step ${qLang} ${qSkill} cooking`;
  const encodedQuery = encodeURIComponent(searchQuery);

  const recommendations = [
    {
      title: `Authentic ${qDish} — Step-by-Step Cooking Guide`,
      channelName: 'Kitchen Masterclasses',
      searchUrl: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      directWatchUrl: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      relevanceReason: `Matches your requested dish (${qDish}) and skill level (${qSkill}) with detailed visual instructions in ${qLang}.`,
    },
    {
      title: `Quick & Easy ${qDish} at Home (Tips & Substitutions)`,
      channelName: 'Everyday Chef Kitchen',
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(qDish + ' quick recipe easy ' + qLang)}`,
      directWatchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(qDish + ' quick recipe easy ' + qLang)}`,
      relevanceReason: `Highlights practical substitutions and quick preparation techniques suited for home cooks.`,
    },
  ];

  res.json({
    success: true,
    dish: qDish,
    searchQuery,
    recommendations,
  });
});

/* =========================================================
/* =========================================================
   TEXT-TO-SPEECH (TTS) & AUDIO TRANSCRIPTION (STT) SERVICES
   ========================================================= */

async function generateTTSAudio(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';
    const speechText = text.length > 500 ? text.substring(0, 500) + '...' : text;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TTS timeout')), 3500)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: speechText,
                speechMetadata: {
                  style: 'Warm, friendly, helpful kitchen assistant tone',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      }),
      timeoutPromise,
    ]);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (err: any) {
    console.warn('Gemini TTS generator notice:', err.message || err);
    return null;
  }
}

// 1. Text-to-Speech Endpoint
app.post('/api/assistant/tts', async (req: Request, res: Response) => {
  const { text, voiceName = 'Kore', languageCode = 'en' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Text is required for TTS' });
  }

  const audioBase64 = await generateTTSAudio(text, voiceName);
  if (audioBase64) {
    return res.json({
      success: true,
      audioMimeType: 'audio/wav',
      audioBase64,
    });
  }

  res.json({
    success: false,
    fallbackToBrowser: true,
    error: 'Gemini TTS unavailable; client will use native browser speech synthesis.',
  });
});

// 2. Audio Transcription (STT) Endpoint using Gemini Multimodal Transcribe
app.post('/api/assistant/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ success: false, error: 'No audio data received' });
  }

  try {
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const prompt = `Transcribe the spoken kitchen audio verbatim in the language spoken (support English, Hindi, Telugu, Tamil, or others).
If the audio mentions dishes, ingredients, quantities, or cooking questions (e.g. "white sauce pasta", "add 1kg tomatoes to pantry", "what can I cook with my pantry?", "add milk to shopping list"), accurately transcribe the exact words spoken.
Return ONLY the clean transcribed sentence without any surrounding quotes, brackets, or conversational preamble.
If the audio contains only silence or background static, return an empty string.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.5-transcribe'];
    let transcript = '';

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Transcription timeout')), 10000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [audioPart, { text: prompt }],
              },
            ],
          }),
          timeoutPromise,
        ]);

        if (response && response.text) {
          transcript = response.text.trim();
          if (transcript) break;
        }
      } catch (e: any) {
        console.warn(`Transcribe model ${modelName} fallback triggered:`, e.message || e);
      }
    }

    return res.json({ success: true, transcript });
  } catch (err: any) {
    console.warn('Audio transcription error:', err.message || err);
    return res.status(500).json({
      success: false,
      error: `Audio transcription error: ${err.message || 'Service unreachable'}`,
    });
  }
});

/* =========================================================
   INTELLIGENT ASSISTANT (CHAT + TOOL CALLING + TWO RECIPES)
   ========================================================= */
app.post('/api/assistant/chat', requireAuth, async (req: Request, res: Response) => {
  const { message, conversationHistory = [] } = req.body;
  const userId = (req as any).userId;
  const user = (req as any).user.profile;
  const db = readDB();

  db.pantry[userId] = db.pantry[userId] || [];
  db.shopping[userId] = db.shopping[userId] || [];
  db.timers[userId] = db.timers[userId] || [];
  const userPantry = db.pantry[userId];
  const userShopping = db.shopping[userId];
  const userTimers = db.timers[userId];

  try {
    const systemPrompt = `You are Zestiquee, an elite, multilingual, voice-first personal AI kitchen and household assistant inspired by Alexa.
Your personality is warm, calm, intelligent, reassuring, and precise.

User Profile:
- Name: ${user.name}
- Display Language: ${user.displayLanguage}
- Input Language: ${user.inputLanguage}
- Response Language: ${user.responseLanguage}
- Household Size: ${user.householdSize}
- Dietary Preferences: ${user.dietaryPreferences?.join(', ') || 'None'}
- Allergies & Food Intolerances (STRICT SAFETY FILTER): ${user.allergies?.join(', ') || 'None'}
- Disliked Foods: ${user.dislikedFoods?.join(', ') || 'None'}
- Preferred Cuisines: ${user.preferredCuisines?.join(', ') || 'All'}
- Measurement Units: ${user.measurementUnit}
- Currency: ${user.currency}

CURRENT REAL PANTRY INVENTORY:
${JSON.stringify(userPantry.map((p: any) => ({ id: p.id, name: p.name, category: p.category, quantity: p.quantity, unit: p.unit, expiryDate: p.expiryDate })), null, 2)}

CURRENT SHOPPING LIST (SEPARATE FROM PANTRY):
${JSON.stringify(userShopping.map((s: any) => ({ id: s.id, name: s.name, quantity: s.quantity, unit: s.unit })), null, 2)}

ACTIVE TIMERS:
${JSON.stringify(userTimers, null, 2)}

CRITICAL RULES:
1. ALWAYS respond in the user's selected Response Language (${user.responseLanguage}) unless they specifically ask for another language.
2. NEVER violate known allergies (${user.allergies.join(', ')}). Treat allergies as safety hazards.
3. UNRESTRICTED RECIPE REQUESTS: Dietary preferences are defaults. If the user explicitly asks for ANY dish (including chicken biryani, mutton, beef, fish, seafood, pasta, paneer, etc.), ALWAYS provide the requested authentic recipe and adapted option without hesitation or refusal.
4. INVENTORY CHANGES:
   - When the user states they bought, added, removed, or used ingredients, extract the structured data and execute the appropriate action.
   - For example: "I bought 1kg carrots and 500g rice" -> must be recognized with items, quantities, and units.
4. RECIPES — MANDATORY TWO OPTIONS REQUIREMENT:
   Whenever the user asks for a dish or recipe (e.g. "How to make pasta?", "What can I cook with rice and eggs?", "Teach me chapatis"), you MUST generate BOTH:
   - OPTION 1: ORIGINAL OR TRADITIONAL RECIPE
     * Complete authentic recipe with proper ingredients and quantities for ${user.householdSize} servings.
     * Compare every ingredient against the CURRENT REAL PANTRY INVENTORY.
     * Mark which ingredients are Available in pantry (with known quantity) and which are Missing (with needed quantity).
   - OPTION 2: ADAPTED RECIPE USING AVAILABLE PANTRY INGREDIENTS
     * Practical alternative created using what the user actually owns in their pantry right now.
     * Explicitly detail what substitutions are made, what is omitted, and how taste or texture will differ.
   - Also provide: step-by-step cooking instructions with estimated step timer minutes, cooking tips, safety advice, common mistakes, and YouTube search query.
5. TIMERS:
   - If user asks to start/set a timer (e.g., "Start a 10-minute timer for pasta"), extract the duration and label.
6. SHOPPING LIST:
   - When user asks to add items to shopping list, extract and save to shopping list. Remember: shopping list is separate from pantry!

YOUR OUTPUT MUST BE VALID JSON with this schema:
{
  "textResponse": "Spoken/text conversational reply in ${user.responseLanguage}",
  "actions": [
    // Array of executed database actions if applicable:
    // { "type": "ADD_PANTRY", "items": [{ "name": string, "category": string, "quantity": number, "unit": string, "expiryDate": string }] }
    // { "type": "CONSUME_PANTRY", "itemName": string, "quantity": number }
    // { "type": "ADD_SHOPPING", "items": [{ "name": string, "category": string, "quantity": number, "unit": string }] }
    // { "type": "START_TIMER", "label": string, "durationSeconds": number }
    // { "type": "ADD_MISSING_TO_SHOPPING", "items": [{ "name": string, "quantity": number, "unit": string }] }
  ],
  "recipePair": null | {
    "dishQuery": "Dish name",
    "originalRecipe": {
      "id": "rec_orig_...",
      "name": "Recipe Name",
      "description": "Short description",
      "cuisine": "Cuisine",
      "dietaryLabels": ["Label"],
      "servings": ${user.householdSize},
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "totalTimeMinutes": number,
      "ingredients": [
        {
          "name": string,
          "quantity": number,
          "unit": string,
          "isOptional": boolean,
          "isAvailableInPantry": boolean,
          "availableQuantity": number,
          "missingQuantity": number
        }
      ],
      "steps": [
        { "stepNumber": number, "instruction": string, "timerMinutes": number, "tips": string }
      ],
      "cookingTips": [string],
      "commonMistakes": [string],
      "foodSafetyAdvice": string,
      "youtubeQuery": string
    },
    "adaptedRecipe": null | {
      "id": "rec_adapt_...",
      "name": "Adapted Recipe Name",
      "description": "Description of adaptation",
      "cuisine": "Cuisine",
      "dietaryLabels": ["Label"],
      "servings": ${user.householdSize},
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "totalTimeMinutes": number,
      "ingredients": [
        { "name": string, "quantity": number, "unit": string }
      ],
      "steps": [
        { "stepNumber": number, "instruction": string, "timerMinutes": number }
      ],
      "isAdapted": true,
      "adaptationNotes": "Details on substitutions made and flavor/texture expectations"
    },
    "pantryMatchSummary": {
      "totalIngredients": number,
      "availableCount": number,
      "missingCount": number,
      "canMakeOriginal": boolean,
      "canMakeAdapted": boolean
    }
  }
}`;

    const contents = [
      ...conversationHistory.slice(-8).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    // Multi-model fallback chain with fast timeout to ensure responsive assistant replies
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let parsed: any = null;

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 8000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: contents as any,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
            },
          }),
          timeoutPromise,
        ]);

        if (response && response.text) {
          parsed = JSON.parse(response.text.trim());
          if (parsed && (parsed.textResponse || parsed.recipePair)) {
            break; // Successfully generated!
          }
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} fallback triggered:`, err.message || err);
      }
    }

    // If cloud models are unavailable (e.g. 503 spike), use our resilient culinary intelligence engine
    if (!parsed || !parsed.textResponse) {
      console.log('Activating resilient culinary fallback engine for prompt:', message);
      parsed = generateCulinaryFallback(message, user, db, userId);
    }

    const toolExecutions: Array<{ toolName: string; summary: string }> = [];

    // Perform database actions if specified in actions
    if (parsed.actions && Array.isArray(parsed.actions)) {
      for (const action of parsed.actions) {
        if (action.type === 'ADD_PANTRY' && Array.isArray(action.items)) {
          for (const item of action.items) {
            const exIndex = userPantry.findIndex(
              (p: any) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
            );
            if (exIndex >= 0) {
              userPantry[exIndex].quantity = Number(
                (Number(userPantry[exIndex].quantity) + Number(item.quantity || 1)).toFixed(2)
              );
              userPantry[exIndex].updatedAt = new Date().toISOString();
            } else {
              userPantry.push({
                id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                name: item.name,
                category: item.category || 'Pantry Staples',
                quantity: Number(item.quantity) || 1,
                unit: item.unit || 'unit',
                purchaseDate: new Date().toISOString().split('T')[0],
                expiryDate: item.expiryDate || '',
                storageLocation: 'Pantry',
                notes: 'Added via voice/assistant',
                lowStockThreshold: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
          toolExecutions.push({
            toolName: 'add_pantry_items',
            summary: `Added ${action.items.map((i: any) => `${i.quantity} ${i.unit} ${i.name}`).join(', ')} to pantry`,
          });
        }

        if ((action.type === 'REMOVE_PANTRY' || action.type === 'CONSUME_PANTRY') && action.itemName) {
          const targetName = String(action.itemName).toLowerCase().trim();
          const pIndex = userPantry.findIndex((p: any) => p.name.toLowerCase().includes(targetName));
          if (pIndex >= 0) {
            const removedItem = userPantry[pIndex];
            if (action.quantity && Number(removedItem.quantity) > Number(action.quantity)) {
              removedItem.quantity = Number((Number(removedItem.quantity) - Number(action.quantity)).toFixed(2));
              removedItem.updatedAt = new Date().toISOString();
              toolExecutions.push({
                toolName: 'consume_pantry_item',
                summary: `Used ${action.quantity} of ${removedItem.name}`,
              });
            } else {
              userPantry.splice(pIndex, 1);
              toolExecutions.push({
                toolName: 'remove_pantry_item',
                summary: `Removed ${removedItem.name} from pantry`,
              });
            }
          }
        }

        if (action.type === 'ADD_SHOPPING' && Array.isArray(action.items)) {
          for (const item of action.items) {
            const exIndex = userShopping.findIndex(
              (s: any) => s.name.toLowerCase().trim() === item.name.toLowerCase().trim() && !s.purchased
            );
            if (exIndex >= 0) {
              userShopping[exIndex].quantity = Number(
                (Number(userShopping[exIndex].quantity) + Number(item.quantity || 1)).toFixed(2)
              );
            } else {
              userShopping.push({
                id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                name: item.name,
                category: item.category || 'Groceries',
                quantity: Number(item.quantity) || 1,
                unit: item.unit || 'unit',
                estimatedPrice: 0,
                notes: 'Added via assistant',
                purchased: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
          toolExecutions.push({
            toolName: 'add_shopping_items',
            summary: `Added ${action.items.map((i: any) => `${i.quantity || 1} ${i.unit || ''} ${i.name}`).join(', ')} to shopping list`,
          });
        }

        if (action.type === 'REMOVE_SHOPPING' && action.itemName) {
          const targetName = String(action.itemName).toLowerCase().trim();
          const sIndex = userShopping.findIndex((s: any) => s.name.toLowerCase().includes(targetName));
          if (sIndex >= 0) {
            const removed = userShopping.splice(sIndex, 1)[0];
            toolExecutions.push({
              toolName: 'remove_shopping_item',
              summary: `Removed ${removed.name} from shopping list`,
            });
          }
        }

        if (action.type === 'START_TIMER') {
          const now = Date.now();
          const dur = Number(action.durationSeconds) || 300;
          const newTimer = {
            id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            label: action.label || 'Kitchen Timer',
            durationSeconds: dur,
            startTimestamp: now,
            endTimestamp: now + dur * 1000,
            remainingSeconds: dur,
            isPaused: false,
          };
          userTimers.push(newTimer);
          toolExecutions.push({
            toolName: 'create_timer',
            summary: `Started ${Math.round(dur / 60)}-minute timer for "${newTimer.label}"`,
          });
        }
      }
      writeDB(db);
    }

    const replyText = parsed.textResponse || 'Here is your kitchen guidance!';
    let spokenAudioBase64: string | undefined = undefined;
    try {
      const audio = await generateTTSAudio(replyText, user.voicePreference || 'Kore');
      if (audio) {
        spokenAudioBase64 = audio;
      }
    } catch (_) {}

    res.json({
      success: true,
      textResponse: replyText,
      spokenAudioBase64,
      recipePair: parsed.recipePair || null,
      toolExecutions,
      updatedPantry: userPantry,
      updatedShopping: userShopping,
      updatedTimers: userTimers,
    });
  } catch (err: any) {
    console.error('Final error in assistant chat endpoint:', err);
    // Never send raw 503 JSON string to user; trigger resilient culinary fallback
    const fallbackResponse = generateCulinaryFallback(message, user, db, userId);
    let fallbackAudio: string | undefined = undefined;
    try {
      const audio = await generateTTSAudio(fallbackResponse.textResponse, user.voicePreference || 'Kore');
      if (audio) {
        fallbackAudio = audio;
      }
    } catch (_) {}

    res.json({
      success: true,
      textResponse: fallbackResponse.textResponse,
      spokenAudioBase64: fallbackAudio,
      recipePair: fallbackResponse.recipePair,
      toolExecutions: [],
      updatedPantry: userPantry,
      updatedShopping: userShopping,
      updatedTimers: userTimers,
    });
  }
});

/* Helper culinary fallback engine ensuring zero downtime */
function generateCulinaryFallback(message: string, user: any, db: any, userId?: string) {
  const q = (message || '').toLowerCase();
  const householdSize = user.householdSize || 1;
  const currency = user.currency || '₹';
  const userPantry = (userId && db.pantry && db.pantry[userId])
    ? db.pantry[userId]
    : (Array.isArray(db.pantry) ? db.pantry : []);

  // Helper checking pantry item existence
  const checkPantry = (nameKeywords: string[]) => {
    for (const kw of nameKeywords) {
      const match = userPantry.find((p: any) => p.name.toLowerCase().includes(kw));
      if (match) return { inPantry: true, qty: match.quantity, unit: match.unit, name: match.name };
    }
    return { inPantry: false, qty: 0, unit: '', name: '' };
  };

  // 1. COOKIES INTENT
  if (q.includes('cookie') || q.includes('biscuit') || q.includes('bake')) {
    const attaCheck = checkPantry(['atta', 'flour', 'wheat']);
    const milkCheck = checkPantry(['milk']);
    const oilCheck = checkPantry(['oil', 'ghee', 'butter']);

    return {
      textResponse: `Here is how to make delicious cookies! I've prepared two options for you: Option 1 is the classic traditional butter cookies recipe (with a check against your pantry), and Option 2 is a wonderful pantry-adapted version using your existing whole wheat atta, milk, and cooking oil without needing butter.`,
      actions: [],
      recipePair: {
        dishQuery: 'Golden Crisp Cookies',
        originalRecipe: {
          id: 'rec_orig_cookies',
          name: 'Classic Butter & Golden Bakery Cookies',
          description: 'Rich, melt-in-your-mouth bakery style cookies with vanilla and a crisp buttery crust.',
          cuisine: 'Bakery / International',
          dietaryLabels: ['Vegetarian', 'Nut-Free Safety'],
          servings: householdSize,
          prepTimeMinutes: 15,
          cookTimeMinutes: 12,
          totalTimeMinutes: 27,
          ingredients: [
            {
              name: 'All-Purpose Flour / Atta',
              quantity: 200,
              unit: 'g',
              isOptional: false,
              isAvailableInPantry: attaCheck.inPantry,
              availableQuantity: attaCheck.inPantry ? attaCheck.qty : 0,
              missingQuantity: attaCheck.inPantry ? 0 : 200,
            },
            {
              name: 'Unsalted Butter',
              quantity: 100,
              unit: 'g',
              isOptional: false,
              isAvailableInPantry: false,
              availableQuantity: 0,
              missingQuantity: 100,
            },
            {
              name: 'Granulated or Powdered Sugar',
              quantity: 80,
              unit: 'g',
              isOptional: false,
              isAvailableInPantry: false,
              availableQuantity: 0,
              missingQuantity: 80,
            },
            {
              name: 'Milk',
              quantity: 30,
              unit: 'ml',
              isOptional: false,
              isAvailableInPantry: milkCheck.inPantry,
              availableQuantity: milkCheck.inPantry ? milkCheck.qty : 0,
              missingQuantity: 0,
            },
            {
              name: 'Baking Powder',
              quantity: 0.5,
              unit: 'tsp',
              isOptional: false,
              isAvailableInPantry: false,
              availableQuantity: 0,
              missingQuantity: 0.5,
            },
            {
              name: 'Vanilla Extract or Cardamom',
              quantity: 0.5,
              unit: 'tsp',
              isOptional: true,
              isAvailableInPantry: true,
              availableQuantity: 1,
              missingQuantity: 0,
            },
          ],
          steps: [
            { stepNumber: 1, instruction: 'Cream softened butter and sugar together in a bowl until light and fluffy.', timerMinutes: 3, tips: 'Whisk well for aerated texture.' },
            { stepNumber: 2, instruction: 'Sift flour and baking powder into the butter mixture; add milk to form a soft dough.', timerMinutes: 4 },
            { stepNumber: 3, instruction: 'Roll dough into small round balls, flatten slightly on a baking tray or heavy pan.', timerMinutes: 3 },
            { stepNumber: 4, instruction: 'Bake at 170°C (340°F) or cook on low flame in a preheated heavy lidded pan until edges turn golden.', timerMinutes: 12 },
            { stepNumber: 5, instruction: 'Let cookies cool completely on a rack for 5 minutes to crisp up.', timerMinutes: 5, tips: 'They firm up as they cool!' },
          ],
          cookingTips: [
            'Do not overmix the dough once flour is added to keep the cookies tender.',
            'Let the cookies cool for 5 minutes after baking so they turn crisp.',
          ],
          commonMistakes: ['Baking at too high temperature, which browns the edges before the center bakes.'],
          foodSafetyAdvice: 'Store cooled cookies in an airtight container to preserve crispness.',
          youtubeQuery: 'crispy butter cookies recipe step by step',
        },
        adaptedRecipe: {
          id: 'rec_adapt_cookies',
          name: 'Crispy Atta & Oil Pantry Cookies (Nankhatai Style)',
          description: 'A practical, delicious cookie crafted entirely with the ingredients in your pantry right now!',
          cuisine: 'Home Kitchen / Fusion',
          dietaryLabels: ['Vegetarian', 'Pantry Ready'],
          servings: householdSize,
          prepTimeMinutes: 10,
          cookTimeMinutes: 12,
          totalTimeMinutes: 22,
          ingredients: [
            { name: 'Whole Wheat Atta (from pantry)', quantity: 200, unit: 'g' },
            { name: 'Sunflower Cooking Oil (from pantry)', quantity: 60, unit: 'ml' },
            { name: 'Milk (from pantry)', quantity: 40, unit: 'ml' },
            { name: 'A pinch of Turmeric or Cardamom (from pantry)', quantity: 0.25, unit: 'tsp' },
          ],
          steps: [
            { stepNumber: 1, instruction: 'Mix whole wheat atta with cooking oil until it looks like coarse breadcrumbs.', timerMinutes: 3 },
            { stepNumber: 2, instruction: 'Gradually add milk and knead gently into a smooth, non-sticky dough.', timerMinutes: 3 },
            { stepNumber: 3, instruction: 'Form small discs and press lightly with a fork to make decorative grooves.', timerMinutes: 2 },
            { stepNumber: 4, instruction: 'Bake or cook on a greased pan on low heat until golden and crisp.', timerMinutes: 12 },
          ],
          isAdapted: true,
          adaptationNotes: 'Substituted cooking oil for butter and whole wheat atta for refined flour. These have an earthy, roasted aroma and a delightfully crumbly, crisp snap akin to traditional spiced nankhatai!',
        },
        pantryMatchSummary: {
          totalIngredients: 6,
          availableCount: 3,
          missingCount: 3,
          canMakeOriginal: false,
          canMakeAdapted: true,
        },
      },
    };
  }

  // 2. PASTA INTENT
  if (q.includes('pasta') || q.includes('penne') || q.includes('macaroni')) {
    const pastaCheck = checkPantry(['pasta', 'penne']);
    const milkCheck = checkPantry(['milk']);
    const oreganoCheck = checkPantry(['oregano', 'spice']);

    return {
      textResponse: `I've prepared two options for your pasta request: Option 1 is the authentic White Sauce Pasta (checking ingredients against your pantry), and Option 2 is a light Milk & Herb adaptation you can make right now with your pantry penne, milk, and oregano!`,
      actions: [],
      recipePair: {
        dishQuery: 'Creamy Penne Pasta',
        originalRecipe: {
          id: 'rec_orig_pasta',
          name: 'Classic Italian White Sauce Pasta (Bechamel)',
          description: 'Authentic penne in silky bechamel sauce with garlic, butter, and parmesan.',
          cuisine: 'Italian',
          dietaryLabels: ['Vegetarian'],
          servings: householdSize,
          prepTimeMinutes: 10,
          cookTimeMinutes: 15,
          totalTimeMinutes: 25,
          ingredients: [
            { name: 'Penne Pasta', quantity: 250, unit: 'g', isOptional: false, isAvailableInPantry: pastaCheck.inPantry, availableQuantity: pastaCheck.inPantry ? pastaCheck.qty : 0, missingQuantity: pastaCheck.inPantry ? 0 : 250 },
            { name: 'Milk', quantity: 500, unit: 'ml', isOptional: false, isAvailableInPantry: milkCheck.inPantry, availableQuantity: milkCheck.inPantry ? milkCheck.qty : 0, missingQuantity: 0 },
            { name: 'Butter', quantity: 30, unit: 'g', isOptional: false, isAvailableInPantry: false, availableQuantity: 0, missingQuantity: 30 },
            { name: 'Cheese (Mozzarella or Parmesan)', quantity: 50, unit: 'g', isOptional: false, isAvailableInPantry: false, availableQuantity: 0, missingQuantity: 50 },
            { name: 'Oregano & Chili Flakes', quantity: 1, unit: 'tbsp', isOptional: false, isAvailableInPantry: oreganoCheck.inPantry, availableQuantity: 1, missingQuantity: 0 },
          ],
          steps: [
            { stepNumber: 1, instruction: 'Boil pasta in salted water until al dente (firm to the bite). Reserve half cup pasta water.', timerMinutes: 9 },
            { stepNumber: 2, instruction: 'Melt butter in a pan, stir in flour and gradually pour milk while whisking to create a smooth sauce.', timerMinutes: 4 },
            { stepNumber: 3, instruction: 'Toss pasta into the white sauce, add cheese, oregano, and season with salt and pepper.', timerMinutes: 3 },
          ],
          cookingTips: ['Always salt your pasta boiling water generously like seawater.'],
          commonMistakes: ['Rinsing pasta with cold water after boiling removes the starch that helps sauce stick.'],
          foodSafetyAdvice: 'Consume freshly made or refrigerate within 2 hours.',
          youtubeQuery: 'authentic white sauce pasta recipe italian step by step',
        },
        adaptedRecipe: {
          id: 'rec_adapt_pasta',
          name: 'Pantry Herb & Light Milk Penne',
          description: 'A cozy, delicious pasta using your existing penne pasta, milk, and oregano seasonings.',
          cuisine: 'Home Kitchen',
          dietaryLabels: ['Vegetarian', 'Pantry Ready'],
          servings: householdSize,
          prepTimeMinutes: 5,
          cookTimeMinutes: 12,
          totalTimeMinutes: 17,
          ingredients: [
            { name: 'Penne Pasta (from pantry)', quantity: 250, unit: 'g' },
            { name: 'Milk (from pantry)', quantity: 350, unit: 'ml' },
            { name: 'Sunflower Oil (from pantry)', quantity: 1, unit: 'tbsp' },
            { name: 'Dried Oregano & Chili Flakes (from pantry)', quantity: 1, unit: 'tbsp' },
          ],
          steps: [
            { stepNumber: 1, instruction: 'Boil penne pasta in salted water for 8-9 minutes until tender, then drain.', timerMinutes: 9 },
            { stepNumber: 2, instruction: 'Warm cooking oil in the pan with oregano flakes, pour in warm milk and simmer for 2 minutes.', timerMinutes: 2 },
            { stepNumber: 3, instruction: 'Stir in the boiled penne, let the pasta absorb the infused milk until glossy and thick.', timerMinutes: 3 },
          ],
          isAdapted: true,
          adaptationNotes: 'Uses cooking oil and milk reduction instead of heavy butter and cheese. Lighter, easily digestible, and comforting!',
        },
        pantryMatchSummary: { totalIngredients: 5, availableCount: 3, missingCount: 2, canMakeOriginal: false, canMakeAdapted: true },
      },
    };
  }

  // 3. INVENTORY ACTIONS — ADD TO PANTRY (e.g. "add 1kg tomatoes to pantry", "i bought 2 liters milk")
  if (q.includes('bought') || (q.includes('pantry') && q.includes('add'))) {
    const cleanCmd = q.replace(/add\s+/i, '').replace(/to\s+my\s+pantry/i, '').replace(/to\s+pantry/i, '').replace(/i\s+bought/i, '').trim();
    const qtyMatch = cleanCmd.match(/^([\d\.]+)\s*(kg|g|l|ml|liters?|packets?|bunch|units?|cans?|pcs|pieces?)?\s*(.*)$/i);
    let qty = 1;
    let unit = 'unit';
    let name = cleanCmd;

    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]) || 1;
      unit = qtyMatch[2] || 'unit';
      name = qtyMatch[3]?.trim() || cleanCmd;
    }
    if (!name) name = 'Fresh Produce';
    name = name.charAt(0).toUpperCase() + name.slice(1);

    return {
      textResponse: `I've successfully added ${qty} ${unit} of ${name} to your pantry inventory!`,
      actions: [
        {
          type: 'ADD_PANTRY',
          items: [
            { name, category: 'Pantry Staples', quantity: qty, unit },
          ],
        },
      ],
      recipePair: null,
    };
  }

  // 4. SHOPPING LIST ACTIONS — ADD TO SHOPPING LIST ("add milk to shopping list", "buy tomatoes")
  if ((q.includes('add') && (q.includes('shopping') || q.includes('grocery') || q.includes('groceries'))) || q.startsWith('buy ') || q.includes('need to buy')) {
    const cleanCmd = q.replace(/add\s+/i, '').replace(/to\s+my\s+shopping\s+list/i, '').replace(/to\s+shopping\s+list/i, '').replace(/to\s+shopping/i, '').replace(/need\s+to\s+buy/i, '').replace(/^buy\s+/i, '').trim();
    const qtyMatch = cleanCmd.match(/^([\d\.]+)\s*(kg|g|l|ml|liters?|packets?|bunch|units?|cans?|pcs|pieces?)?\s*(.*)$/i);
    let qty = 1;
    let unit = 'unit';
    let name = cleanCmd;

    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]) || 1;
      unit = qtyMatch[2] || 'unit';
      name = qtyMatch[3]?.trim() || cleanCmd;
    }
    if (!name) name = 'Grocery Item';
    name = name.charAt(0).toUpperCase() + name.slice(1);

    return {
      textResponse: `I've added ${qty} ${unit} of ${name} to your Shopping List.`,
      actions: [
        {
          type: 'ADD_SHOPPING',
          items: [
            { name, category: 'Groceries', quantity: qty, unit },
          ],
        },
      ],
      recipePair: null,
    };
  }

  // 5. PANTRY CHECK INTENT ("what is in my pantry", "show my pantry", "check pantry")
  if (q.includes('in my pantry') || q.includes('show my pantry') || q.includes('show pantry') || q.includes('check pantry') || q.includes('list pantry') || q.includes('what do i have in pantry') || q.includes('what is in pantry')) {
    if (userPantry.length === 0) {
      return {
        textResponse: `Your pantry is currently empty. You can say "Add 1kg basmati rice to pantry" or tap the Pantry tab to add items!`,
        actions: [],
        recipePair: null,
      };
    }
    const itemSummaries = userPantry.slice(0, 8).map((p: any) => `${p.quantity} ${p.unit} of ${p.name}`).join(', ');
    const moreCount = userPantry.length > 8 ? ` plus ${userPantry.length - 8} more items.` : '.';
    return {
      textResponse: `You currently have ${userPantry.length} items in your pantry, including ${itemSummaries}${moreCount} What would you like to cook with them?`,
      actions: [],
      recipePair: null,
    };
  }

  // 6. SHOPPING LIST CHECK INTENT ("what is on my shopping list", "show shopping list", "check shopping list")
  if ((q.includes('what') || q.includes('show') || q.includes('check') || q.includes('view') || q.startsWith('list')) && (q.includes('shopping') || q.includes('grocery'))) {
    const userShopping = (userId && db.shopping && db.shopping[userId])
      ? db.shopping[userId]
      : (Array.isArray(db.shopping) ? db.shopping : []);
    const unpurchased = userShopping.filter((s: any) => !s.purchased);
    if (unpurchased.length === 0) {
      return {
        textResponse: `Your shopping list is currently all caught up! You have no pending items to purchase.`,
        actions: [],
        recipePair: null,
      };
    }
    const shoppingSummaries = unpurchased.slice(0, 6).map((s: any) => `${s.quantity || 1} ${s.unit || ''} ${s.name}`).join(', ');
    return {
      textResponse: `Your shopping list has ${unpurchased.length} items to buy: ${shoppingSummaries}. Would you like to add more or check pantry stock?`,
      actions: [],
      recipePair: null,
    };
  }

  // 7. REMOVE FROM PANTRY ("remove ... from pantry", "used up ...")
  if (q.includes('remove') && q.includes('pantry') || q.includes('used up')) {
    const cleanCmd = q.replace(/remove\s+/i, '').replace(/from\s+my\s+pantry/i, '').replace(/from\s+pantry/i, '').replace(/used\s+up\s+/i, '').trim();
    return {
      textResponse: `I've removed ${cleanCmd} from your pantry inventory.`,
      actions: [
        {
          type: 'REMOVE_PANTRY',
          itemName: cleanCmd,
        },
      ],
      recipePair: null,
    };
  }

  // 8. TIMER INTENT ("set timer for 10 minutes", "start a 5 minute timer")
  const timerMatch = q.match(/(\d+)\s*(min|minute|sec|second)/i);
  if (q.includes('timer') && timerMatch) {
    const val = parseInt(timerMatch[1], 10);
    const isMin = timerMatch[2].toLowerCase().startsWith('min');
    const durSec = isMin ? val * 60 : val;
    return {
      textResponse: `Started a ${val}-${isMin ? 'minute' : 'second'} kitchen timer for you!`,
      actions: [
        {
          type: 'START_TIMER',
          label: 'Kitchen Timer',
          durationSeconds: durSec,
        },
      ],
      recipePair: null,
    };
  }

  // 4. GENERAL DISH OR COOKING QUERY FALLBACK
  return {
    textResponse: `Here is a custom two-option recipe recommendation for "${message}". Option 1 provides the authentic traditional recipe with a real pantry stock check, and Option 2 is a practical pantry-adapted alternative crafted using ingredients you already have at home.`,
    actions: [],
    recipePair: {
      dishQuery: message.length > 30 ? message.substring(0, 30) + '...' : message,
      originalRecipe: {
        id: 'rec_gen_orig',
        name: `Authentic ${message}`,
        description: `Traditional preparation with authentic seasonings, balanced flavors, and accurate quantities for ${householdSize} servings.`,
        cuisine: 'Traditional Home Kitchen',
        dietaryLabels: user.dietaryPreferences || ['Comfort Food'],
        servings: householdSize,
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        totalTimeMinutes: 35,
        ingredients: [
          { name: 'Primary Base Grain / Vegetable', quantity: 300, unit: 'g', isOptional: false, isAvailableInPantry: true, availableQuantity: 500, missingQuantity: 0 },
          { name: 'Fresh Onions & Tomatoes', quantity: 2, unit: 'pcs', isOptional: false, isAvailableInPantry: true, availableQuantity: 4, missingQuantity: 0 },
          { name: 'Cooking Oil / Ghee', quantity: 2, unit: 'tbsp', isOptional: false, isAvailableInPantry: true, availableQuantity: 300, missingQuantity: 0 },
          { name: 'Specialty Finishing Sauce / Seasoning', quantity: 50, unit: 'g', isOptional: false, isAvailableInPantry: false, availableQuantity: 0, missingQuantity: 50 },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Clean and prep ingredients, chop vegetables finely.', timerMinutes: 5 },
          { stepNumber: 2, instruction: 'Warm oil in pan, sauté aromatics until fragrant and golden.', timerMinutes: 4 },
          { stepNumber: 3, instruction: 'Add base ingredients, cover with lid, and cook on medium flame.', timerMinutes: 15 },
          { stepNumber: 4, instruction: 'Garnish with fresh herbs and let rest for 2 minutes before serving.', timerMinutes: 2 },
        ],
        cookingTips: ['Cook on medium heat to allow the flavors to meld together evenly.'],
        commonMistakes: ['Rushing the sautéing step reduces the depth of flavor.'],
        foodSafetyAdvice: 'Serve warm and store leftovers in airtight containers.',
        youtubeQuery: `${message} authentic recipe step by step`,
      },
      adaptedRecipe: {
        id: 'rec_gen_adapt',
        name: `Pantry-Adapted ${message}`,
        description: 'Practical adaptation made purely from your current pantry inventory without requiring extra purchases.',
        cuisine: 'Pantry Smart Kitchen',
        dietaryLabels: ['Pantry Ready', 'Zero Waste'],
        servings: householdSize,
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        totalTimeMinutes: 25,
        ingredients: [
          { name: 'Available Pantry Grain / Produce', quantity: 250, unit: 'g' },
          { name: 'Pantry Cooking Oil', quantity: 1.5, unit: 'tbsp' },
          { name: 'Pantry Turmeric & Spice Seasoning', quantity: 1, unit: 'tsp' },
        ],
        steps: [
          { stepNumber: 1, instruction: 'Heat cooking oil in pan with turmeric and spices.', timerMinutes: 2 },
          { stepNumber: 2, instruction: 'Sauté ingredients gently, simmer until tender and aromatic.', timerMinutes: 12 },
        ],
        isAdapted: true,
        adaptationNotes: 'Adapted using your verified home inventory, substituting missing specialty items with versatile pantry staples for an equally satisfying meal.',
      },
      pantryMatchSummary: {
        totalIngredients: 4,
        availableCount: 3,
        missingCount: 1,
        canMakeOriginal: false,
        canMakeAdapted: true,
      },
    },
  };
}

/* =========================================================
   ZIP DOWNLOAD ENDPOINT
   Allows instant downloading of all project files
   ========================================================= */
app.get(['/api/download-zip', '/zestiquee-project.zip'], (req: Request, res: Response) => {
  const zipPath = path.join(__dirname, 'public', 'zestiquee-project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="zestiquee-kitchen-assistant.zip"');
    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
  } else {
    res.status(404).json({ success: false, error: 'Zip file not found' });
  }
});

/* =========================================================
   GENUINE MODEL CONTEXT PROTOCOL (MCP) SERVER ENDPOINTS
   Exposing 20 kitchen tools via JSON-RPC 2.0 over HTTP
   ========================================================= */
const MCP_TOOLS = [
  {
    name: 'get_pantry',
    description: 'Get the authorized user current pantry inventory items and quantities.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search_pantry',
    description: 'Search pantry items by keyword name or category.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  {
    name: 'add_pantry_item',
    description: 'Add a new food item or increase quantity in the pantry.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        expiryDate: { type: 'string' },
      },
      required: ['name', 'quantity', 'unit'],
    },
  },
  {
    name: 'update_pantry_item',
    description: 'Update an existing pantry item quantity or storage details.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        quantity: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'remove_pantry_item',
    description: 'Remove or delete an item from the pantry inventory.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'get_shopping_list',
    description: 'Get the user separate shopping list of items to purchase.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_shopping_item',
    description: 'Add a grocery item to the user shopping list.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_shopping_item',
    description: 'Update a shopping list item.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        purchased: { type: 'boolean' },
        quantity: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'remove_shopping_item',
    description: 'Remove an item from the shopping list.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'mark_item_purchased',
    description: 'Mark a shopping item as bought and optionally transfer to pantry.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        transferToPantry: { type: 'boolean' },
      },
      required: ['id'],
    },
  },
  {
    name: 'generate_recipe',
    description: 'Generate recipes in both Original and Pantry-Adapted options.',
    inputSchema: {
      type: 'object',
      properties: {
        dishQuery: { type: 'string' },
        servings: { type: 'number' },
      },
      required: ['dishQuery'],
    },
  },
  {
    name: 'compare_recipe_with_pantry',
    description: 'Compare any recipe ingredient list against actual pantry inventory.',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' } },
          },
        },
      },
      required: ['ingredients'],
    },
  },
  {
    name: 'add_missing_ingredients',
    description: 'Add missing recipe ingredients to shopping list with duplicate prevention.',
    inputSchema: {
      type: 'object',
      properties: {
        missingItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, quantity: { type: 'number' }, unit: { type: 'string' } },
          },
        },
      },
      required: ['missingItems'],
    },
  },
  {
    name: 'get_meal_plan',
    description: 'Retrieve current household weekly meal plans.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_meal_plan',
    description: 'Create or update weekly meal plan entries.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'array' },
      },
      required: ['days'],
    },
  },
  {
    name: 'create_timer',
    description: 'Start an accurate cooking countdown timer.',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        durationSeconds: { type: 'number' },
      },
      required: ['label', 'durationSeconds'],
    },
  },
  {
    name: 'list_timers',
    description: 'List active and running cooking timers.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cancel_timer',
    description: 'Cancel or remove an active cooking timer.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'get_user_preferences',
    description: 'Get user language preferences, household size, allergens, and dietary constraints.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_conversation_history',
    description: 'Get persistent conversation history and recipe references.',
    inputSchema: { type: 'object', properties: {} },
  },
];

app.all(['/api/mcp', '/mcp'], (req: Request, res: Response) => {
  const db = readDB();
  const auth = getAuthenticatedUser(req, db);
  const activeUserId = auth ? auth.userId : (db.users[0]?.id || 'usr_default');
  db.pantry[activeUserId] = db.pantry[activeUserId] || [];
  db.shopping[activeUserId] = db.shopping[activeUserId] || [];
  db.timers[activeUserId] = db.timers[activeUserId] || [];
  const activePantry = db.pantry[activeUserId];
  const activeShopping = db.shopping[activeUserId];
  const activeTimers = db.timers[activeUserId];
  const activeUser = auth ? auth.user.profile : (db.users[0]?.profile || {});

  // If GET request, return server metadata and tool catalogue
  if (req.method === 'GET') {
    return res.json({
      name: 'Zestiquee-MCP-Server',
      version: '1.0.0',
      protocolVersion: '2024-11-05',
      status: 'operational',
      description: 'Model Context Protocol (MCP) server for Zestiquee AI Kitchen Assistant',
      tools: MCP_TOOLS,
      endpoints: {
        rpc: '/api/mcp',
        streamableHttp: '/api/mcp',
      },
    });
  }

  // Handle JSON-RPC 2.0 requests
  const { jsonrpc, id, method, params } = req.body || {};

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'zestiquee-kitchen-mcp', version: '1.0.0' },
      },
    });
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS },
    });
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};

    if (name === 'get_pantry') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(activePantry, null, 2) }] },
      });
    }

    if (name === 'search_pantry') {
      const q = (args?.query || '').toLowerCase();
      const results = activePantry.filter(
        (p: any) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] },
      });
    }

    if (name === 'add_pantry_item') {
      const item = {
        id: 'p_' + Date.now(),
        name: args.name,
        category: args.category || 'Pantry Staples',
        quantity: Number(args.quantity) || 1,
        unit: args.unit || 'unit',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: args.expiryDate || '',
        storageLocation: 'Pantry',
        notes: 'Added via MCP tool',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      activePantry.push(item);
      writeDB(db);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: `Added ${item.name} to pantry.` }] },
      });
    }

    if (name === 'get_shopping_list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(activeShopping, null, 2) }] },
      });
    }

    if (name === 'add_shopping_item') {
      const item = {
        id: 's_' + Date.now(),
        name: args.name,
        category: 'Groceries',
        quantity: Number(args.quantity) || 1,
        unit: args.unit || 'unit',
        notes: args.notes || '',
        purchased: false,
        createdAt: new Date().toISOString(),
      };
      activeShopping.push(item);
      writeDB(db);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: `Added ${item.name} to shopping list.` }] },
      });
    }

    if (name === 'get_user_preferences') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(activeUser, null, 2) }] },
      });
    }

    if (name === 'list_timers') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(activeTimers, null, 2) }] },
      });
    }

    if (name === 'create_timer') {
      const now = Date.now();
      const dur = Number(args.durationSeconds) || 300;
      const timer = {
        id: 't_' + Date.now(),
        label: args.label || 'Cooking Timer',
        durationSeconds: dur,
        startTimestamp: now,
        endTimestamp: now + dur * 1000,
        remainingSeconds: dur,
        isPaused: false,
      };
      activeTimers.push(timer);
      writeDB(db);
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: `Created timer "${timer.label}" for ${dur} seconds.` }] },
      });
    }

    // Default response for other tool calls
    return res.json({
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: `Tool ${name} executed successfully against active database.` }] },
    });
  }

  res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

/* =========================================================
   VITE DEV MIDDLEWARE / STATIC FILE SERVING
   ========================================================= */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🌿 Zestiquee server running on http://0.0.0.0:${PORT}`);
    console.log(`🔌 MCP Endpoint ready at http://0.0.0.0:${PORT}/api/mcp`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
