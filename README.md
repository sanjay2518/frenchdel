# French Learning Platform

A comprehensive French learning platform with user dashboard, admin panel, and backend API.

## Project Structure

- **FR/** - Main user application (React)
- **FR-admin/** - Admin panel (React)  
- **backend/** - Backend API (Flask + Supabase)

## Features

### User Application (FR/)
- User authentication and profiles
- Speaking and writing practice modules
- Real-time feedback system
- Subscription management
- Progress tracking

### Admin Panel (FR-admin/)
- View user submissions
- Upload prompts and tasks
- Add written feedback
- Manage users and subscriptions
- Learning materials management

### Backend (backend/)
- User authentication
- File upload handling
- Email notifications
- Subscription management
- Admin APIs

## Setup Instructions

### Frontend (FR/)
```bash
cd FR
npm install
npm run dev
```

### Admin Panel (FR-admin/)
```bash
cd FR-admin
npm install
npm run dev
```

### Backend (backend/)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Environment Variables

Create `.env` files in the backend directory with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your_email
SENDER_PASSWORD=your_app_password
```

## Technologies Used

- **Frontend**: React, Vite, Lucide Icons
- **Backend**: Flask, Supabase, Python
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Local file system
- **Email**: SMTP