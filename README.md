# 📝 TaskFlow

A modern, real-time task management application built with Next.js 15, Supabase, and N8N integration.

![TaskFlow Demo](https://via.placeholder.com/800x400?text=TaskFlow+Screenshot)

## ✨ Features

- ✅ **CRUD Operations** - Create, read, update, delete tasks
- 🔄 **Real-time Updates** - Auto-sync across all devices using Supabase Realtime
- 📱 **WhatsApp Integration** - Manage tasks via WhatsApp (N8N + Evolituon API)
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔐 **Secure API** - Protected webhook endpoints
- 📊 **Task Statistics** - Track pending/completed tasks
- 🎯 **Filters** - View all, pending, or completed tasks
- 💾 **Persistent Storage** - PostgreSQL via Supabase

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime (WebSockets)
- **API:** Next.js API Routes
- **Automation:** N8N
- **Chatbot:** WhatsApp Business API (Evolution API)
- **Deployment:** Vercel

## 🏗️ System Architecture

### High-Level Overview

+---------------------------+
|           USERS           |
+-------------+-------------+
              |
              v
+---------------------------+           +---------------------------+
| Web Browser               |           | WhatsApp                  |
+-------------+-------------+           +-------------+-------------+
              |                                       |
              v                                       v
+---------------------------+           +---------------------------+
| Next.js Frontend (Vercel) |           | Evolution API (Gateway)   |
+-------------+-------------+           +-------------+-------------+
              |                                       |
              |                                       v
              |                           +-------------------------+
              |                           | n8n Engine (Automation) |
              |                           +-----------+-------------+
              |                                       |
              v                                       v
+--------------------------------------------------------------+
|                 Next.js API Routes (Vercel)                  |
|  /api/tasks (GET, POST)                                      |
|  /api/tasks/:id (PATCH, DELETE)                              |
|  /api/webhook (POST)                                         |
+-------------------------------+------------------------------+
                                |
                                v
+--------------------------------------------------------------+
|                      Supabase Platform                       |
|  +--------------------------+   +--------------------------+ |
|  | PostgreSQL Database      |   | Realtime Engine          | |
|  | - profiles               |<->| (WebSockets)             | |
|  | - tasks                  |   | broadcasts DB changes    | |
|  +--------------------------+   +--------------------------+ |
+--------------------------------------------------------------+

### Data Flow Logic

#### 🔄 Real-time Sync Flow

### REAL-TIME SYNC FLOW (WEB)

+--------------------+
| Browser A (UI)      |
+---------+----------+
          |
          | POST /api/tasks
          v
+--------------------+
| Next.js API (Vercel)|
+---------+----------+
          |
          | INSERT tasks
          v
+--------------------+
| Supabase Postgres   |
+---------+----------+
          |
          | change event (CDC)
          v
+--------------------+
| Supabase Realtime   |
| (WebSockets)        |
+----+----------+----+
     |          |
     | WS       | WS
     v          v
+--------+   +--------+
|BrowserA|   |BrowserB|
|updates |   |updates |
+--------+   +--------+


### REAL-TIME SYNC FLOW (WHATSAPP)

+--------------------+
| WhatsApp User       |
+---------+----------+
          |
          | "/task add Buy milk"
          v
+--------------------+
| Evolution API       |
+---------+----------+
          |
          | webhook event
          v
+--------------------+
| n8n Workflow        |
+---------+----------+
          |
          | POST /api/webhook
          | (x-webhook-secret)
          v
+--------------------+
| Next.js API (Vercel)|
+---------+----------+
          |
          | INSERT tasks
          v
+--------------------+
| Supabase Postgres   |
+---------+----------+
          |
          | change event (CDC)
          v
+--------------------+
| Supabase Realtime   |
+----+----------+----+
     |          |
     v          v
+--------+   +--------+
|BrowserA|   |BrowserB|
|updates |   |updates |
+--------+   +--------+

## 📦 Project Structure

taskflow/
├── app/
│ ├── api/
│ │ ├── tasks/
│ │ │ ├── route.ts # GET, POST /api/tasks
│ │ │ └── [id]/
│ │ │ └── route.ts # PATCH, DELETE /api/tasks/:id
│ │ └── webhook/
│ │ └── route.ts # POST /api/webhook (N8N integration)
│ ├── dashboard/
│ │ └── page.tsx # Main dashboard
│ ├── layout.tsx
│ └── page.tsx # Landing page
├── components/
│ ├── TaskForm.tsx # Create/edit task form
│ ├── TaskList.tsx # Task list with real-time updates
│ ├── TaskItem.tsx # Individual task card
│ └── ConfirmModal.tsx # Delete confirmation modal
├── lib/
│ └── supabase.ts # Supabase client configuration
├── types.ts # TypeScript type definitions
├── .env.local # Environment variables
└── package.json

## 🚀 Getting Started

### 1. Clone Repository

git clone https://github.com/yourusername/taskflow.git
cd taskflow
npm install

text

### 2. Supabase Setup

Run the following SQL in your Supabase **SQL Editor**:

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles table
CREATE TABLE profiles (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
email TEXT UNIQUE NOT NULL,
name TEXT,
created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tasks table
CREATE TABLE tasks (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
title TEXT NOT NULL,
description TEXT,
is_completed BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(is_completed);

-- 5. Auto-update timestamp Function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

-- 6. Trigger
CREATE TRIGGER tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Enable Realtime
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- 8. Create Demo User
INSERT INTO profiles (email, name)
VALUES ('demo@taskflow.com', 'Demo User')
ON CONFLICT (email) DO NOTHING
RETURNING id, email;

text

> **⚠️ Important:** Copy the `id` (UUID) returned from step 8! You'll need it below.

### 3. Environment Variables

Create `.env.local` in your project root:

Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...

App Security
WEBHOOK_SECRET=your_secure_random_string_32_chars

### 4. Configuration

Update `app/dashboard/page.tsx`:

const USER_ID = 'paste-your-uuid-here';

### 5. Run

npm run dev

## 📡 API Documentation

### Webhook Endpoint
Target URL for N8N or other services.

- **URL:** `/api/webhook`
- **Method:** `POST`
- **Headers:** `x-webhook-secret: <your_secret>`

| Action | JSON Payload Example | Description |
| :--- | :--- | :--- |
| **Create** | `{ "action": "create", "user_email": "demo@taskflow.com", "task_title": "Buy milk" }` | Creates a new task |
| **List** | `{ "action": "list", "user_email": "demo@taskflow.com" }` | Returns array of tasks |
| **Complete** | `{ "action": "complete", "user_email": "demo@taskflow.com", "task_id": "uuid..." }` | Marks task as done |
| **Delete** | `{ "action": "delete", "user_email": "demo@taskflow.com", "task_id": "uuid..." }` | Removes task |


## 🤖 N8N Integration Guide

### Workflow Logic
`[Webhook] → [Parse Command] → [Call TaskFlow API] → [Format Response] → [Send WhatsApp]`

### N8N Code Node (Parse Command)
Use this JavaScript snippet in your N8N Function node to parse incoming WhatsApp messages:

const message = $input.item.json.body.message || '';
const phone = $input.item.json.body.from || '';
const parts = message.trim().split(' ');

// Get commands safely
const command = parts?.toLowerCase();
const taskText = parts.slice(2).join(' ');

let action = '';
let payload = { user_email: 'demo@taskflow.com' };

if (command === '/task') {
const subCommand = parts?.toLowerCase();

text
if (subCommand === 'add') {
    action = 'create';
    payload.task_title = taskText;
} else if (subCommand === 'list') {
    action = 'list';
} else if (subCommand === 'done') {
    action = 'complete';
    payload.task_id = parts;
} else if (subCommand === 'delete') {
    action = 'delete';
    payload.task_id = parts;
} else {
    action = 'help';
}
}

return { action, payload, phone };

### WhatsApp Commands

/task add Buy coffee # Create task
/task list # List all tasks
/task done [task_id] # Mark as completed
/task delete [task_id] # Delete task

## 🔐 Security Best Practices

1.  **Environment Variables:** Never commit `.env.local` or `.env` to GitHub.
2.  **Service Role:** The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. Use it only on the server-side (API Routes).
3.  **Webhook Secret:** Ensure your `WEBHOOK_SECRET` is at least 32 characters long and random.

## 📄 License

MIT License - Copyright (c) 2025 TaskFlow