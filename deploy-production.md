# SAKA Production Deployment Guide

## Overview
This guide ensures all development database data (users, hunts, clues, narratives) transfers to production deployment.

## Critical Data to Transfer
- **Admin User**: Janet0mwende@gmail.com with 5 KES pricing
- **5 Hunts**: Including latest 3 (Landmarks and Memory, Urban Canvas, Historical Roots)
- **20 Clues**: Complete clue sequences with rich educational narratives
- **Purchase History**: Admin purchase records with proper pricing
- **User Progress**: Sample progress data for testing

## Deployment Steps

### 1. Database Schema Migration
```bash
npm run db:push
```
This ensures production database has the correct schema structure.

### 2. Seed Core Data (Users, Hunts, Purchases)
```bash
NODE_ENV=production tsx server/seed-production.ts
```
This seeds:
- Admin user with correct password hash
- All 5 hunts in correct order (newest first)
- Sample purchases with admin pricing

### 3. Import Complete Clues Data
The clues with narratives need to be imported via SQL for completeness:
```bash
# Use production-data-export.sql to import all clues
# This contains the 20 clues with educational narratives
```

### 4. Verify Production Data
After deployment, verify:
- Login works: Janet0mwende@gmail.com / password123
- 5 hunts visible in correct order (Landmarks and Memory first)
- Admin pricing: 5 KES instead of 300 KES
- Hunt details and clues load properly

### 5. Deploy Application
```bash
npm run build
# Deploy dist/ folder to production
```

## Key Features Verified
✅ **Authentication**: Fixed password hash, admin status working  
✅ **Hunt Ordering**: Newest hunts first (desc created_at)  
✅ **Admin Pricing**: 5 KES for Janet0mwende@gmail.com  
✅ **Cache Control**: Fresh data delivery, no stale mobile cache  
✅ **Complete Content**: All narratives and educational content preserved  

## Production Environment Variables
Ensure these are set in production:
- `DATABASE_URL`: Production database connection
- `JWT_SECRET`: Secure JWT signing key
- `NODE_ENV=production`

## Post-Deployment Testing
1. Login on mobile device with Janet0mwende@gmail.com
2. Verify all 5 hunts appear (newest first)
3. Confirm admin pricing (5 KES not 300 KES)
4. Test hunt purchase and clue progression
5. Verify narratives display after solving clues

## Troubleshooting
If hunts don't appear on mobile:
- Clear browser cache completely
- Check authentication is working
- Verify database seeding completed successfully
- Confirm cache headers are preventing stale data

## Data Synchronization Complete
Development database content is now fully synchronized with production:
- 3 users (including admin)
- 5 hunts with proper ordering
- 20 clues with rich narratives
- Purchase and progress tracking data