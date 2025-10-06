# SAKA - Scavenger Hunt App

## Overview

SAKA is a mobile-first scavenger hunt application that allows users to participate in location-based treasure hunts across African cities and heritage sites. The platform combines interactive clue-solving with real-world exploration, offering both free and premium hunt experiences. Users can register, purchase hunts, solve clues in sequence, and track their progress through gamified challenges.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Build Your Own Hunt Complete Implementation (October 5, 2025)
- **Feature**: Full "Build Your Own Hunt" system with all clue fields and sequential flow
- **Hunt Creation Flow**:
  - Step 1: Hunt Info (title, description, theme)
  - Step 2: Add Clues with full field support
  - Save Progress: Saves hunt as draft at any point
  - Create Hunt: Finalizes hunt without duplicates, navigates to Preview & Deploy
- **Clue Fields** (All Implemented):
  - Title, Clue Text, Narrative (optional), Challenge (optional)
  - Correct Answer (REQUIRED) - used for sequential unlocking
  - Location Hint (optional), Coordinates (optional)
- **Preview & Deploy Tab**:
  - Complete hunt preview showing all clue fields
  - Edit Hunt button to make changes before deployment
  - Sequential flow explanation for users
  - Deploy Hunt button (50 KES via Paystack)
- **Bug Fixes**:
  - Fixed duplicate hunt creation (Save Progress → Create Hunt now uses existing hunt)
  - Added missing correctAnswer field to database schema
  - Fixed Edit Hunt button functionality
- **Sequential Clue Logic**: Players solve clues one at a time, each unlocking after correct answer
- **Status**: Fully functional, all fields working, ready for production use

### Deployment Paywall Security Enhancements (October 5, 2025)
- **Feature**: Hardened hunt deployment payment security
- **Security Improvements**:
  - Server-side enforcement of 50 KES deployment fee (constant, cannot be overridden by client)
  - Pre-payment validation: hunt ownership, not-already-deployed status, minimum 1 clue requirement
  - Post-payment verification: re-validates all deployment preconditions before activating hunt
  - Payment amount verification: ensures Paystack transaction matches expected 50 KES fee
  - Frontend error handling for authentication and deployment initiation failures
- **Validation Points**:
  - Payment initialization: validates hunt exists, owned by user, has clues, not already deployed
  - Payment verification: re-validates all conditions plus payment amount before hunt activation
  - Client validation: checks clues exist before initiating payment, shows descriptive error toasts
- **Status**: Deployment paywall security fully implemented, ready for testing with live Paystack credentials

### Admin Backend Implementation (October 4, 2025)
- **Feature**: Complete admin backend for hunt and clue management
- **Components Added**:
  - Admin Dashboard (`client/src/pages/admin-dashboard.tsx`) - Landing page with quick actions
  - Hunt List Page (`client/src/pages/admin-hunts.tsx`) - View all hunts with edit/delete
  - Hunt Form (`client/src/pages/admin-hunt-form.tsx`) - Create/edit hunts with clue management
  - Admin API routes (`server/routes.ts`) - CRUD endpoints with security middleware
  - Storage methods (`server/storage.ts`) - Database operations for hunts/clues
- **Security**: 
  - `requireAdmin` middleware validates `isAdmin` flag on all admin routes
  - JWT authentication includes admin status verification
  - Admin navigation only visible to users with `isAdmin: true`
- **Features**:
  - Complete CRUD for hunts (create, read, update, delete)
  - Inline clue management (add, edit, delete, reorder)
  - Image preview for cover images
  - Form validation and error handling
  - Responsive design matching SAKA theme
- **Access**: Admin link appears in navigation for Janet0mwende@gmail.com
- **Status**: Fully functional admin system ready for hunt management

### Mobile App Synchronization Fix (August 17, 2025)
- **Issue**: Mobile app authentication and data loading failures
- **Root Cause**: Password hash mismatch, aggressive mobile browser caching, missing CORS headers
- **Solution**: 
  - Fixed authentication with correct password hash for Janet0mwende@gmail.com
  - Added comprehensive cache-busting headers (no-cache, no-store, must-revalidate)
  - Implemented CORS headers for mobile browser compatibility
  - Enhanced TanStack Query with staleTime: 0 for fresh data fetching
  - Added mobile debug tools and diagnostic endpoint
- **Status**: Authentication working, cache invalidation implemented, hunt ordering fixed to show newest first

### Deployment Fix (August 17, 2025)
- **Issue**: Mobile domain not showing latest 3 hunts, debug button visible, admin pricing broken
- **Solution**: 
  - Removed debug button and mobile-test route for clean deployment
  - Fixed hunt ordering to show newest hunts first (desc order)
  - Confirmed admin pricing maintains 5 KES for Janet0mwende@gmail.com
  - Enhanced cache headers with dynamic ETags for deployment freshness
- **Status**: Ready for deployment with all 5 hunts visible in correct order

### Production Database Synchronization (August 17, 2025)
- **Issue**: Development database data not transferring to production deployment
- **Solution**:
  - Created comprehensive production seeding script (server/seed-production.ts)
  - Generated complete data export SQL (production-data-export.sql) 
  - Added deployment guide (deploy-production.md) for full data transfer
  - Verified admin user, all 5 hunts, clues, and narratives ready for production
- **Status**: Database synchronization complete, ready for production deployment

## System Architecture

### Frontend Architecture
- **React SPA with Vite**: Modern build tool for fast development and optimized production builds
- **TypeScript**: Provides type safety across the entire frontend codebase
- **Wouter**: Lightweight client-side routing library for navigation between hunt library, clue screens, and profile pages
- **TanStack Query**: State management for server state, caching API responses, and handling authentication states
- **Shadcn/UI with Radix**: Component library built on Radix primitives for accessible, customizable UI components
- **Tailwind CSS**: Utility-first styling with custom SAKA brand colors (orange, red, gold, green theme)

### Backend Architecture
- **Express.js**: RESTful API server handling authentication, hunt management, and user progress tracking
- **JWT Authentication**: Token-based authentication with localStorage persistence
- **Middleware Pattern**: Request logging, error handling, and authentication middleware for protected routes
- **Session-based Architecture**: No complex state management on server-side, relies on stateless JWT tokens

### Database Design
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Database Schema**:
  - Users: Authentication and profile management with admin status
  - Hunts: Hunt metadata, pricing, difficulty levels, and cover images
  - Clues: Sequential clue system with combined clue text and challenges, proper location hints, Google Maps coordinates
  - Purchases: Payment tracking for premium hunts
  - UserProgress: Real-time progress tracking, completion status, and scoring

### Authentication & Authorization
- **bcrypt**: Password hashing for secure user credential storage
- **JWT Tokens**: Stateless authentication with configurable expiration, includes admin status
- **Route Protection**: Middleware-based authentication for all hunt-related endpoints
- **Admin System**: Special pricing for Janet0mwende@gmail.com (5 KES for all hunts instead of 300 KES)
- **Client-side Auth**: Persistent login state with automatic token refresh handling

### Mobile-First Design Patterns
- **Responsive Layout**: Tailwind breakpoints optimized for mobile screens first
- **Touch-Optimized**: Large tap targets, swipe gestures, and mobile-friendly interactions
- **Progressive Enhancement**: Works on basic mobile browsers with enhanced features on modern devices

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration management and schema synchronization

### UI & Styling
- **Radix UI**: Accessible component primitives for dialogs, forms, navigation, and interactive elements
- **Lucide Icons**: Consistent icon system for UI elements and navigation
- **Google Fonts**: Typography including DM Sans, Architects Daughter, Fira Code, and Geist Mono

### Development & Build Tools
- **Vite**: Development server with HMR and production build optimization
- **ESBuild**: Fast TypeScript compilation for server-side code
- **PostCSS**: CSS processing pipeline for Tailwind CSS

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing and verification

### Form & Validation
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Runtime type validation for API requests and form data
- **Hookform/Resolvers**: Integration between React Hook Form and Zod validation

### Payment Integration
- **Modular Payment System**: Architecture supports multiple payment methods (M-Pesa, card payments) through configurable payment method selection

### Image & Asset Management
- **Unsplash Integration**: African cities and heritage site imagery for hunt covers and backgrounds
- **Asset Pipeline**: Vite-managed asset optimization and serving

### Development Experience
- **Replit Integration**: Development environment integration with runtime error handling and cartographer plugin for debugging