# FR-Admin Deployment Guide

## Deploy to Render

### 1. Configure Environment Variable on Render

After creating your static site on Render, add the following environment variable:

**Key**: `VITE_API_URL`  
**Value**: `https://frenchdel-1.onrender.com` (your backend URL)

### 2. Build Settings

- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Root Directory**: `FR-admin`

### 3. Auto-Deploy

Enable auto-deploy from your GitHub branch for automatic updates.

## Local Development

1. Copy `.env.example` to `.env`
2. Update `VITE_API_URL` with your backend URL
3. Run `npm install`
4. Run `npm run dev`

## Important Notes

- The `.env` file is gitignored for security
- Always set environment variables in Render dashboard
- Backend must be running and accessible for the admin panel to work
