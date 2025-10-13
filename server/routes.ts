import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { userCreatedHunts } from "@shared/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import axios from "axios";
import { randomUUID } from "crypto";
import { emailService } from "./emailService";
import { 
  loginSchema, 
  signupSchema, 
  resetPasswordSchema, 
  paymentInitSchema, 
  subscriptionInitSchema, 
  paymentVerifySchema, 
  deploymentPaymentSchema,
  updatePasswordSchema,
  createUserHuntSchema,
  updateUserHuntSchema,
  createUserClueSchema,
  updateUserClueSchema,
  createHuntInvitationSchema,
  respondToInvitationSchema,
  updateSessionProgressSchema,
  type Badge 
} from "@shared/schema";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware
interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.userId = decoded.userId;
    req.isAdmin = decoded.isAdmin || false;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed database on startup
  try {
    await storage.seedDatabase();
  } catch (error) {
    console.error("Failed to seed database:", error);
  }

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data' });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: 'Password reset link sent if email exists' });
      }

      // Generate secure reset token
      const resetToken = randomUUID();
      
      // Create expiry time (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Store token in database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
      });
      
      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
      
      if (!emailSent) {
        console.error('Failed to send password reset email to:', email);
        // Still return success to not reveal email existence
      }
      
      res.json({ message: 'Password reset link sent if email exists' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = updatePasswordSchema.parse(req.body);
      
      // Validate token exists and is not expired
      const resetToken = await storage.getValidPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }
      
      // Hash the new password
      const newPasswordHash = await bcrypt.hash(password, 10);
      
      // Update user's password
      await storage.updateUserPassword(resetToken.userId, newPasswordHash);
      
      // Invalidate the reset token
      await storage.invalidatePasswordResetToken(token);
      
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data' });
      }
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete account endpoint
  app.delete('/api/account/delete', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      // Delete all user data in the correct order (respecting foreign key constraints)
      await storage.deleteUserAccount(userId);
      
      res.json({ success: true, message: 'Account and all associated data have been permanently deleted' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Failed to delete account. Please try again or contact support.' });
    }
  });

  // Diagnostic endpoint for mobile troubleshooting
  app.get('/api/diagnostic', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUser(userId);
      const hunts = await storage.getAllHunts();
      const userPurchases = await storage.getPurchasesByUserId(userId);
      const completedHunts = await storage.getUserCompletedHunts(userId);
      
      res.json({
        timestamp: new Date().toISOString(),
        user: { id: user?.id, email: user?.email, isAdmin: user?.isAdmin },
        stats: {
          totalHunts: hunts.length,
          userPurchases: userPurchases.length,
          completedHunts: completedHunts.length,
          freeHunts: hunts.filter(h => parseFloat(h.price) === 0).length
        },
        recentHunts: hunts.slice(0, 3).map(h => ({ id: h.id, title: h.title, price: h.price })),
        serverVersion: '2025-08-17-deployment-fix'
      });
    } catch (error) {
      console.error('Diagnostic error:', error);
      res.status(500).json({ message: 'Diagnostic failed' });
    }
  });

  // Hunt Routes
  app.get('/api/hunts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const allHunts = await storage.getAllHunts();
      
      // Filter out admin-only hunts for regular users
      const hunts = allHunts.filter(hunt => req.isAdmin || !hunt.isAdminOnly);
      
      const userPurchases = await storage.getPurchasesByUserId(userId);
      const purchasedHuntIds = new Set(userPurchases.filter(p => p.paymentStatus === 'completed').map(p => p.huntId));
      
      // Check if user has active subscription (unlocks all hunts)
      const hasActiveSubscription = await storage.hasActiveSubscription(userId);
      
      const huntsWithUnlocked = hunts.map(hunt => ({
        ...hunt,
        price: req.isAdmin ? "5.00" : hunt.price, // Admin price: 5 KES
        unlocked: parseFloat(hunt.price) === 0 || hasActiveSubscription || purchasedHuntIds.has(hunt.id)
      }));
      
      res.json(huntsWithUnlocked);
    } catch (error) {
      console.error('Get hunts error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/hunts/category/:category', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { category } = req.params;
      const userId = req.userId!;
      const allHunts = await storage.getHuntsByCategory(category);
      
      // Filter out admin-only hunts for regular users
      const hunts = allHunts.filter(hunt => req.isAdmin || !hunt.isAdminOnly);
      
      const userPurchases = await storage.getPurchasesByUserId(userId);
      const purchasedHuntIds = new Set(userPurchases.filter(p => p.paymentStatus === 'completed').map(p => p.huntId));
      
      // Check if user has active subscription (unlocks all hunts)
      const hasActiveSubscription = await storage.hasActiveSubscription(userId);
      
      const huntsWithUnlocked = hunts.map(hunt => ({
        ...hunt,
        price: req.isAdmin ? "5.00" : hunt.price, // Admin price: 5 KES
        unlocked: parseFloat(hunt.price) === 0 || hasActiveSubscription || purchasedHuntIds.has(hunt.id)
      }));
      
      res.json(huntsWithUnlocked);
    } catch (error) {
      console.error('Get hunts by category error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/hunts/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const hunt = await storage.getHunt(req.params.id);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      // Check if user has active subscription (unlocks all hunts)
      const hasActiveSubscription = await storage.hasActiveSubscription(userId);
      
      // Check if user has access
      const purchase = await storage.getUserPurchase(userId, hunt.id);
      const adjustedPrice = req.isAdmin ? "5.00" : hunt.price; // Admin price: 5 KES
      const isFreeHunt = parseFloat(hunt.price) === 0;
      const unlocked = isFreeHunt || hasActiveSubscription || (purchase?.paymentStatus === 'completed');
      
      res.json({ ...hunt, price: adjustedPrice, unlocked });
    } catch (error) {
      console.error('Get hunt error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Clue Routes
  app.get('/api/clues/:huntId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const hunt = await storage.getHunt(req.params.huntId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      // Check if user has access
      const purchase = await storage.getUserPurchase(req.userId!, hunt.id);
      const hasActiveSubscription = await storage.hasActiveSubscription(req.userId!);
      const adjustedPrice = req.isAdmin ? "5.00" : hunt.price; // Admin price: 5 KES
      const isFreeHunt = parseFloat(hunt.price) === 0;
      const unlocked = req.isAdmin || isFreeHunt || hasActiveSubscription || (purchase?.paymentStatus === 'completed');
      
      if (!unlocked) {
        return res.status(403).json({ message: 'Hunt not purchased' });
      }
      
      const clues = await storage.getCluesByHuntId(req.params.huntId);
      res.json(clues);
    } catch (error) {
      console.error('Get clues error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/clues/:clueId/answer', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { answer, bypass } = req.body;
      const clue = await storage.getClue(req.params.clueId);
      
      if (!clue) {
        return res.status(404).json({ message: 'Clue not found' });
      }
      
      // Get the hunt to check if it's the Urban Canvas hunt (auto-accept all answers)
      const hunt = await storage.getHunt(clue.huntId);
      const isUrbanCanvasHunt = hunt?.title === "Nairobi's Urban Canvas";
      
      // Handle bypass request
      if (bypass) {
        await storage.bypassClue(req.userId!, clue.huntId, clue.id);
        // Treat bypass as correct answer
        const isCorrect = true;
        
        // Continue with normal flow for correct answer
        let progress = await storage.getUserProgress(req.userId!, clue.huntId);
        if (!progress) {
          progress = await storage.createUserProgress({
            userId: req.userId!,
            huntId: clue.huntId,
            currentClueId: clue.id,
            totalPoints: 0, // No points awarded for bypassed clue
            completed: false,
          });
        } else {
          const allClues = await storage.getCluesByHuntId(clue.huntId);
          const nextClue = allClues.find(c => c.order === clue.order + 1);
          const isCompleting = !nextClue;
          
          let completionTimeMinutes = null;
          if (isCompleting && progress.startedAt) {
            const completionTime = Date.now() - new Date(progress.startedAt).getTime();
            completionTimeMinutes = Math.round(completionTime / (1000 * 60));
          }
          
          progress = await storage.updateUserProgress(req.userId!, clue.huntId, {
            currentClueId: nextClue?.id || null,
            totalPoints: progress.totalPoints, // No points for bypassed clue
            completed: isCompleting,
            completedAt: isCompleting ? new Date() : undefined,
            completionTimeMinutes: isCompleting ? completionTimeMinutes : undefined,
          });
          
          let newBadges: Badge[] = [];
          if (isCompleting) {
            newBadges = await storage.checkAndAwardBadges(req.userId!, clue.huntId);
          }
          
          return res.json({ 
            correct: true,
            bypassed: true,
            correctAnswer: clue.answer,
            points: 0,
            totalPoints: progress.totalPoints,
            completed: progress.completed,
            newBadges: newBadges,
            narrative: clue.narrative
          });
        }
        
        return res.json({ 
          correct: true,
          bypassed: true,
          correctAnswer: clue.answer,
          points: 0,
          totalPoints: progress.totalPoints,
          completed: progress.completed,
          newBadges: [],
          narrative: clue.narrative
        });
      }
      
      const isCorrect = isUrbanCanvasHunt || (answer.toLowerCase().trim() === clue.answer.toLowerCase().trim());
      
      if (isCorrect) {
        // Update user progress
        let progress = await storage.getUserProgress(req.userId!, clue.huntId);
        if (!progress) {
          progress = await storage.createUserProgress({
            userId: req.userId!,
            huntId: clue.huntId,
            currentClueId: clue.id,
            totalPoints: clue.points,
            completed: false,
          });
        } else {
          const allClues = await storage.getCluesByHuntId(clue.huntId);
          const nextClue = allClues.find(c => c.order === clue.order + 1);
          const isCompleting = !nextClue;
          
          // Calculate completion time if completing the hunt
          let completionTimeMinutes = null;
          if (isCompleting && progress.startedAt) {
            const completionTime = Date.now() - new Date(progress.startedAt).getTime();
            completionTimeMinutes = Math.round(completionTime / (1000 * 60));
          }
          
          progress = await storage.updateUserProgress(req.userId!, clue.huntId, {
            currentClueId: nextClue?.id || null,
            totalPoints: progress.totalPoints + clue.points,
            completed: isCompleting,
            completedAt: isCompleting ? new Date() : undefined,
            completionTimeMinutes: isCompleting ? completionTimeMinutes : undefined,
          });
          
          // Check and award badges if hunt is completed
          let newBadges: Badge[] = [];
          if (isCompleting) {
            newBadges = await storage.checkAndAwardBadges(req.userId!, clue.huntId);
          }
          
          res.json({ 
            correct: true, 
            points: clue.points,
            totalPoints: progress.totalPoints,
            completed: progress.completed,
            newBadges: newBadges,
            narrative: clue.narrative
          });
          return;
        }
        
        res.json({ 
          correct: true, 
          points: clue.points,
          totalPoints: progress.totalPoints,
          completed: progress.completed,
          newBadges: [],
          narrative: clue.narrative
        });
      } else {
        // Track incorrect attempt
        const attemptRecord = await storage.incrementClueAttempt(req.userId!, clue.huntId, clue.id);
        const attempts = attemptRecord.incorrectAttempts;
        
        // Prepare response with hint information
        const response: any = { 
          correct: false,
          attempts: attempts
        };
        
        // Show hint after 3 attempts (if hint exists)
        if (attempts >= 3 && clue.hint && !attemptRecord.hintViewed) {
          response.showHint = true;
          response.hint = clue.hint;
        } else if (attempts >= 3 && clue.hint && attemptRecord.hintViewed) {
          response.hint = clue.hint;
        }
        
        // Offer bypass after 4 attempts
        if (attempts >= 4) {
          response.canBypass = true;
          response.bypassMessage = "Having trouble? You can skip this clue and see the answer.";
        }
        
        res.json(response);
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Purchase Routes
  app.post('/api/purchases', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { huntId, paymentMethod } = req.body;
      
      const hunt = await storage.getHunt(huntId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      // Check if already purchased
      const existingPurchase = await storage.getUserPurchase(req.userId!, huntId);
      if (existingPurchase) {
        return res.status(400).json({ message: 'Hunt already purchased' });
      }
      
      // Create purchase (simulate payment for MVP)
      const purchase = await storage.createPurchase({
        userId: req.userId!,
        huntId,
        amountPaid: hunt.price,
        paymentMethod,
        paymentStatus: 'completed',
        transactionReference: `TEST-${Date.now()}`,
      });
      
      res.json(purchase);
    } catch (error) {
      console.error('Purchase error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/purchases', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const purchases = await storage.getPurchasesByUserId(req.userId!);
      res.json(purchases);
    } catch (error) {
      console.error('Get purchases error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Progress Routes
  app.get('/api/progress', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const completedHunts = await storage.getUserCompletedHunts(req.userId!);
      res.json(completedHunts);
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/progress/:huntId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const progress = await storage.getUserProgress(req.userId!, req.params.huntId);
      res.json(progress);
    } catch (error) {
      console.error('Get hunt progress error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Badge Routes
  app.get('/api/badges', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error('Get badges error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/badges/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userBadges = await storage.getUserBadges(req.userId!);
      res.json(userBadges);
    } catch (error) {
      console.error('Get user badges error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Collection Routes
  app.get('/api/collections/:category', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { category } = req.params;
      const collections = await storage.getCollectionsByCategory(category);
      res.json(collections);
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Payment routes
  app.post('/api/pay', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email, amount, huntId } = paymentInitSchema.parse(req.body);
      const userId = req.userId!;

      // Check if user already has active subscription
      const hasSubscription = await storage.hasActiveSubscription(userId);
      if (hasSubscription) {
        return res.status(400).json({ message: 'You have an active subscription that unlocks all hunts' });
      }

      // Check if user already purchased this hunt
      const existingPurchase = await storage.getUserPurchase(userId, huntId);
      if (existingPurchase && existingPurchase.paymentStatus === 'completed') {
        return res.status(400).json({ message: 'Hunt already purchased' });
      }

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: amount * 100, // Convert to kobo
          currency: 'KES',
          channels: ['mobile_money'],
          metadata: {
            userId,
            huntId,
            type: 'one-time',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Create pending purchase record
      await storage.createPurchase({
        userId,
        huntId,
        amountPaid: amount.toString(),
        paymentMethod: 'paystack',
        paymentStatus: 'pending',
        transactionReference: response.data.data.reference,
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('Payment initialization error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Payment initialization failed' });
    }
  });

  app.post('/api/subscribe', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email, plan } = subscriptionInitSchema.parse(req.body);
      const userId = req.userId!;

      // Check if user already has active subscription
      const hasSubscription = await storage.hasActiveSubscription(userId);
      if (hasSubscription) {
        return res.status(400).json({ message: 'You already have an active subscription' });
      }

      const planAmounts = {
        monthly: 999, // KES 999
        yearly: 9999, // KES 9999
      };

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: planAmounts[plan] * 100, // Convert to kobo
          currency: 'KES',
          channels: ['mobile_money'],
          metadata: {
            userId,
            plan,
            type: 'subscription',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Subscription initialization error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Subscription initialization failed' });
    }
  });

  // Hunt deployment payment route
  app.post('/api/deploy-hunt', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { email, huntId, amount } = deploymentPaymentSchema.parse(req.body);
      const userId = req.userId!;

      // Enforce deployment fee of 50 KES
      const DEPLOYMENT_FEE = 50;
      if (amount !== DEPLOYMENT_FEE) {
        return res.status(400).json({ message: `Deployment fee must be exactly ${DEPLOYMENT_FEE} KES` });
      }

      // Check if user owns this hunt
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found or not owned by user' });
      }

      // Check if hunt is already deployed
      if (hunt.status === 'active') {
        return res.status(400).json({ message: 'Hunt is already deployed' });
      }

      // Check if hunt has at least one clue
      const clues = await storage.getUserCluesByHuntId(huntId);
      if (clues.length === 0) {
        return res.status(400).json({ message: 'Hunt must have at least one clue before deployment' });
      }

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: DEPLOYMENT_FEE * 100, // Convert to kobo (use server-side fee, not client-supplied)
          currency: 'KES',
          channels: ['mobile_money'],
          metadata: {
            userId,
            huntId,
            type: 'deployment',
            amount: DEPLOYMENT_FEE,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Deployment payment initialization error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Deployment payment initialization failed' });
    }
  });

  app.get('/api/verify/:reference', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { reference } = paymentVerifySchema.parse(req.params);
      const userId = req.userId!;

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const transaction = response.data.data;
      
      if (transaction.status === 'success') {
        const metadata = transaction.metadata;
        
        if (metadata.type === 'one-time') {
          // Update purchase status
          const purchase = await storage.getPurchaseByReference(reference);
          if (purchase) {
            await storage.updatePurchase(purchase.id, { paymentStatus: 'completed' });
          }
        } else if (metadata.type === 'subscription') {
          // Create or update subscription
          const expiryDate = new Date();
          if (metadata.plan === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
          } else if (metadata.plan === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          }

          await storage.createSubscription({
            userId,
            plan: metadata.plan,
            status: 'active',
            startDate: new Date(),
            expiryDate,
            paymentReference: reference,
          });
        } else if (metadata.type === 'deployment') {
          // Verify deployment payment and update hunt status
          const huntId = metadata.huntId;
          const DEPLOYMENT_FEE = 50;

          if (!huntId) {
            return res.status(400).json({ success: false, message: 'Hunt ID missing in payment metadata' });
          }

          // Verify hunt exists and belongs to the payer
          const hunt = await storage.getUserHunt(huntId, userId);
          if (!hunt) {
            return res.status(404).json({ success: false, message: 'Hunt not found or not owned by user' });
          }

          // Verify hunt is eligible for deployment
          if (hunt.status === 'active') {
            return res.status(400).json({ success: false, message: 'Hunt is already deployed' });
          }

          // Verify hunt has at least one clue
          const clues = await storage.getUserCluesByHuntId(huntId);
          if (clues.length === 0) {
            return res.status(400).json({ success: false, message: 'Hunt must have clues to deploy' });
          }

          // Verify payment amount matches deployment fee
          const paidAmount = transaction.amount / 100; // Convert from kobo to KES
          if (paidAmount !== DEPLOYMENT_FEE) {
            return res.status(400).json({ 
              success: false, 
              message: `Invalid payment amount. Expected ${DEPLOYMENT_FEE} KES, received ${paidAmount} KES` 
            });
          }

          // All checks passed - deploy the hunt
          await storage.updateUserHunt(huntId, userId, {
            status: 'active',
            isDraft: false,
            deployedAt: new Date(),
          });
        }

        res.json({ success: true, message: 'Payment verified successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Payment verification failed' });
    }
  });

  // Check subscription status
  app.get('/api/subscription/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const subscription = await storage.getUserActiveSubscription(userId);
      res.json({ hasActiveSubscription: !!subscription, subscription });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ message: 'Failed to check subscription status' });
    }
  });

  // User-Created Hunts API Routes
  
  // Create a new user hunt
  app.post('/api/user-hunts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      // Validate request body
      const huntData = createUserHuntSchema.parse(req.body);
      
      // Generate secure invite code
      const inviteCode = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
      
      const hunt = await storage.createUserHunt({
        ...huntData,
        creatorId: userId,
        inviteCode,
      });
      
      res.json(hunt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error creating user hunt:', error);
      res.status(500).json({ message: 'Failed to create hunt' });
    }
  });

  // Get user's hunts
  app.get('/api/user-hunts', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const hunts = await storage.getUserHunts(userId);
      res.json(hunts);
    } catch (error) {
      console.error('Error fetching user hunts:', error);
      res.status(500).json({ message: 'Failed to fetch hunts' });
    }
  });

  // Get specific user hunt
  app.get('/api/user-hunts/:huntId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching user hunt:', error);
      res.status(500).json({ message: 'Failed to fetch hunt' });
    }
  });

  // Update user hunt
  app.put('/api/user-hunts/:huntId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      // Validate request body
      const updates = updateUserHuntSchema.parse(req.body);
      
      // Verify user owns the hunt before updating
      const existingHunt = await storage.getUserHunt(huntId, userId);
      if (!existingHunt) {
        return res.status(403).json({ message: 'Access denied: You do not own this hunt' });
      }
      
      const hunt = await storage.updateUserHunt(huntId, userId, updates);
      res.json(hunt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error updating user hunt:', error);
      res.status(500).json({ message: 'Failed to update hunt' });
    }
  });

  // Delete user hunt
  app.delete('/api/user-hunts/:huntId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      await storage.deleteUserHunt(huntId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user hunt:', error);
      res.status(500).json({ message: 'Failed to delete hunt' });
    }
  });

  // Get hunt by invite code
  app.get('/api/user-hunts/invite/:inviteCode', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { inviteCode } = req.params;
      
      const hunt = await storage.getUserHuntByInviteCode(inviteCode);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching hunt by invite code:', error);
      res.status(500).json({ message: 'Failed to fetch hunt' });
    }
  });

  // Join hunt by huntId (simple join without session)
  app.post('/api/user-hunts/:huntId/join', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      // Get hunt details to check status and existence
      const [hunt] = await db.select()
        .from(userCreatedHunts)
        .where(eq(userCreatedHunts.id, huntId))
        .limit(1);
      
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      // Check if hunt is deployed (active) - only allow joining active hunts
      if (hunt.status === 'draft') {
        return res.status(403).json({ 
          message: 'Hunt is not yet deployed. Ask the creator to deploy the hunt first.',
          code: 'HUNT_NOT_DEPLOYED'
        });
      }
      
      // Verify hunt has clues
      try {
        const clues = await storage.getUserCluesByHuntId(huntId);
        if (!clues || clues.length === 0) {
          return res.status(400).json({ message: 'Hunt has no clues and cannot be played' });
        }
      } catch {
        return res.status(400).json({ message: 'Hunt is not properly configured' });
      }
      
      // For now, implement a basic join mechanism
      // In the future, this would:
      // - Add user to hunt participants table
      // - Create user progress entry
      // - Send notifications to hunt creator
      // - etc.
      
      res.json({ 
        success: true,
        message: 'Successfully joined hunt',
        huntId,
        userId,
        huntTitle: hunt.title,
        joinedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error joining hunt:', error);
      res.status(500).json({ message: 'Failed to join hunt' });
    }
  });

  // Clue management routes
  
  // Create clue for user hunt
  app.post('/api/user-hunts/:huntId/clues', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      console.log('Received clue data:', JSON.stringify(req.body, null, 2));
      
      // Validate request body
      const clueData = createUserClueSchema.parse(req.body);
      
      // Verify user owns the hunt
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(403).json({ message: 'Access denied: You do not own this hunt' });
      }
      
      const clue = await storage.createUserClue({
        ...clueData,
        huntId,
      });
      
      res.json(clue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Clue validation error:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error creating clue:', error);
      res.status(500).json({ message: 'Failed to create clue' });
    }
  });

  // Get clues for user hunt
  app.get('/api/user-hunts/:huntId/clues', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { huntId } = req.params;
      
      const clues = await storage.getUserCluesByHuntId(huntId);
      res.json(clues);
    } catch (error) {
      console.error('Error fetching clues:', error);
      res.status(500).json({ message: 'Failed to fetch clues' });
    }
  });

  // Update clue
  app.put('/api/user-clues/:clueId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { clueId } = req.params;
      
      // Validate request body
      const updates = updateUserClueSchema.parse(req.body);
      
      // Verify user owns the clue by checking hunt ownership
      const clue = await storage.getUserClue(clueId);
      if (!clue) {
        return res.status(404).json({ message: 'Clue not found' });
      }
      
      const hunt = await storage.getUserHunt(clue.huntId, userId);
      if (!hunt) {
        return res.status(403).json({ message: 'Access denied: You do not own this clue' });
      }
      
      const updatedClue = await storage.updateUserClue(clueId, updates);
      res.json(updatedClue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error updating clue:', error);
      res.status(500).json({ message: 'Failed to update clue' });
    }
  });

  // Delete clue
  app.delete('/api/user-clues/:clueId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { clueId } = req.params;
      
      // Verify user owns the clue by checking hunt ownership
      const clue = await storage.getUserClue(clueId);
      if (!clue) {
        return res.status(404).json({ message: 'Clue not found' });
      }
      
      const hunt = await storage.getUserHunt(clue.huntId, userId);
      if (!hunt) {
        return res.status(403).json({ message: 'Access denied: You do not own this clue' });
      }
      
      await storage.deleteUserClue(clueId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting clue:', error);
      res.status(500).json({ message: 'Failed to delete clue' });
    }
  });

  // Hunt invitation routes
  
  // Create hunt invitation
  app.post('/api/user-hunts/:huntId/invitations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      // Validate request body
      const { invitedEmail } = createHuntInvitationSchema.parse(req.body);
      
      // Verify user owns the hunt
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(403).json({ message: 'Access denied: You do not own this hunt' });
      }
      
      // Generate unique invite token
      const inviteToken = randomUUID();
      
      const invitation = await storage.createHuntInvitation({
        huntId,
        invitedEmail,
        inviteToken,
      });
      
      res.json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error creating invitation:', error);
      res.status(500).json({ message: 'Failed to create invitation' });
    }
  });

  // Get hunt invitations
  app.get('/api/user-hunts/:huntId/invitations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      // Verify user owns the hunt
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      
      const invitations = await storage.getHuntInvitations(huntId);
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  });

  // Get user's invitations
  app.get('/api/user-invitations', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      const invitations = await storage.getUserInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error('Error fetching user invitations:', error);
      res.status(500).json({ message: 'Failed to fetch invitations' });
    }
  });

  // Respond to invitation
  app.post('/api/invitations/:inviteToken/respond', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { inviteToken } = req.params;
      
      // Validate request body
      const { status } = respondToInvitationSchema.parse(req.body);
      
      const invitation = await storage.respondToInvitation(inviteToken, userId, status);
      res.json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error responding to invitation:', error);
      res.status(500).json({ message: 'Failed to respond to invitation' });
    }
  });

  // Hunt session routes (multiplayer)
  
  // Create hunt session
  app.post('/api/user-hunts/:huntId/sessions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { huntId } = req.params;
      
      // Verify user has access to the hunt
      const hunt = await storage.getUserHunt(huntId, userId);
      if (!hunt) {
        return res.status(403).json({ message: 'Access denied: You do not have access to this hunt' });
      }
      
      // Generate secure session code
      const sessionCode = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
      
      const session = await storage.createHuntSession({
        huntId,
        hostUserId: userId,
        sessionCode,
      });
      
      // Add host as participant
      await storage.addHuntParticipant({
        sessionId: session.id,
        userId,
        role: 'host',
      });
      
      res.json(session);
    } catch (error) {
      console.error('Error creating hunt session:', error);
      res.status(500).json({ message: 'Failed to create session' });
    }
  });

  // Join hunt session
  app.post('/api/hunt-sessions/:sessionCode/join', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { sessionCode } = req.params;
      
      const session = await storage.getHuntSessionByCode(sessionCode);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      const participant = await storage.addHuntParticipant({
        sessionId: session.id,
        userId,
        role: 'participant',
      });
      
      res.json(participant);
    } catch (error) {
      console.error('Error joining hunt session:', error);
      res.status(500).json({ message: 'Failed to join session' });
    }
  });

  // Get session participants
  app.get('/api/hunt-sessions/:sessionId/participants', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { sessionId } = req.params;
      
      // Verify user is a participant in the session
      const participant = await storage.getSessionParticipant(sessionId, userId);
      if (!participant) {
        return res.status(403).json({ message: 'Access denied: You are not a participant in this session' });
      }
      
      const participants = await storage.getSessionParticipants(sessionId);
      res.json(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ message: 'Failed to fetch participants' });
    }
  });

  // Update session progress
  app.post('/api/hunt-sessions/:sessionId/progress', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { sessionId } = req.params;
      
      // Validate request body
      const { clueId, answer, isSolved } = updateSessionProgressSchema.parse(req.body);
      
      // Verify user is a participant in the session
      const participant = await storage.getSessionParticipant(sessionId, userId);
      if (!participant) {
        return res.status(403).json({ message: 'Access denied: You are not a participant in this session' });
      }
      
      const progress = await storage.updateSessionProgress({
        sessionId,
        clueId,
        solvedBy: userId,
        answer,
        isSolved,
      });
      
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      console.error('Error updating session progress:', error);
      res.status(500).json({ message: 'Failed to update progress' });
    }
  });

  // Get session progress
  app.get('/api/hunt-sessions/:sessionId/progress', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const { sessionId } = req.params;
      
      // Verify user is a participant in the session
      const participant = await storage.getSessionParticipant(sessionId, userId);
      if (!participant) {
        return res.status(403).json({ message: 'Access denied: You are not a participant in this session' });
      }
      
      const progress = await storage.getSessionProgress(sessionId);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching session progress:', error);
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  });

  // Admin middleware - check if user is admin
  const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    next();
  };

  // Admin Routes
  // Get statistics
  app.get('/api/admin/statistics', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const hunts = await storage.getAllHunts();
      const users = await storage.getAllUsers();
      const allProgress = await storage.getAllUserProgress();
      const allPurchases = await storage.getAllPurchases();
      
      // Calculate statistics
      const totalHunts = hunts.length;
      const totalUsers = users.length;
      const activeUsers = new Set(allProgress.map(p => p.userId)).size;
      const completedHunts = allProgress.filter(p => p.completed).length;
      const totalRevenue = allPurchases
        .filter(p => p.paymentStatus === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
      
      // Calculate average completion rate
      const completionRate = allProgress.length > 0 
        ? (completedHunts / allProgress.length * 100).toFixed(1)
        : "0";
      
      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentPurchases = allPurchases.filter(p => 
        new Date(p.createdAt!) > sevenDaysAgo && p.paymentStatus === 'completed'
      ).length;
      
      const recentCompletions = allProgress.filter(p => 
        p.completedAt && new Date(p.completedAt) > sevenDaysAgo
      ).length;
      
      res.json({
        totalHunts,
        totalUsers,
        activeUsers,
        completedHunts,
        totalRevenue: totalRevenue.toFixed(2),
        completionRate,
        recentPurchases,
        recentCompletions,
        hunts: hunts.map(h => ({
          id: h.id,
          title: h.title,
          price: h.price,
          category: h.category,
          difficulty: h.difficulty
        }))
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Get all hunts (admin view)
  app.get('/api/admin/hunts', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const hunts = await storage.getAllHunts();
      res.json(hunts);
    } catch (error) {
      console.error('Error fetching admin hunts:', error);
      res.status(500).json({ message: 'Failed to fetch hunts' });
    }
  });

  // Get single hunt (admin view)
  app.get('/api/admin/hunts/:huntId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const hunt = await storage.getHunt(req.params.huntId);
      if (!hunt) {
        return res.status(404).json({ message: 'Hunt not found' });
      }
      res.json(hunt);
    } catch (error) {
      console.error('Error fetching hunt:', error);
      res.status(500).json({ message: 'Failed to fetch hunt' });
    }
  });

  // Create new hunt
  app.post('/api/admin/hunts', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { title, description, difficulty, price, coverImageUrl } = req.body;
      
      const hunt = await storage.createHunt({
        title,
        description,
        difficulty,
        price,
        coverImageUrl,
        durationMinutes: 60,
        category: 'Other',
      });
      
      res.status(201).json(hunt);
    } catch (error) {
      console.error('Error creating hunt:', error);
      res.status(500).json({ message: 'Failed to create hunt' });
    }
  });

  // Update hunt
  app.put('/api/admin/hunts/:huntId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { title, description, difficulty, price, coverImageUrl } = req.body;
      
      const hunt = await storage.updateHunt(req.params.huntId, {
        title,
        description,
        difficulty,
        price,
        coverImageUrl,
      });
      
      res.json(hunt);
    } catch (error) {
      console.error('Error updating hunt:', error);
      res.status(500).json({ message: 'Failed to update hunt' });
    }
  });

  // Delete hunt
  app.delete('/api/admin/hunts/:huntId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteHunt(req.params.huntId);
      res.json({ message: 'Hunt deleted successfully' });
    } catch (error) {
      console.error('Error deleting hunt:', error);
      res.status(500).json({ message: 'Failed to delete hunt' });
    }
  });

  // Save/update clues for a hunt
  app.post('/api/admin/hunts/:huntId/clues', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { clues } = req.body;
      const huntId = req.params.huntId;
      
      // Delete existing clues first
      await storage.deleteCluesByHuntId(huntId);
      
      // Create new clues
      for (const clue of clues) {
        await storage.createClue({
          huntId,
          order: clue.order,
          clueText: clue.clueText,
          answer: clue.answer,
          hint: clue.hint || null,
          locationHint: clue.locationHint,
          coordinates: clue.coordinates || null,
          points: clue.points,
          imageUrl: clue.imageUrl || null,
          narrative: clue.narrative || null,
        });
      }
      
      res.json({ message: 'Clues saved successfully' });
    } catch (error) {
      console.error('Error saving clues:', error);
      res.status(500).json({ message: 'Failed to save clues' });
    }
  });

  // Delete a specific clue
  app.delete('/api/admin/clues/:clueId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      await storage.deleteClue(req.params.clueId);
      res.json({ message: 'Clue deleted successfully' });
    } catch (error) {
      console.error('Error deleting clue:', error);
      res.status(500).json({ message: 'Failed to delete clue' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
