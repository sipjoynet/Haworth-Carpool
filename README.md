# Haworth Carpool App

A privacy-focused carpool coordination app for closed communities.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

The app will open automatically at http://localhost:3000

### 3. Login

**Demo Accounts:**
- Admin: `admin@haworth.com` / `admin123`
- Parent: `sarah@email.com` / `pass123`

## Features

- ✅ User authentication with admin approval
- ✅ Multiple group membership
- ✅ Child management with optional phone numbers
- ✅ Ride requests (today/tomorrow only)
- ✅ Group-scoped feeds
- ✅ Privacy-enforcing contact visibility
- ✅ Ride acceptance and completion workflow
- ✅ Admin panel for user/group/location management

## Privacy Rules

- Parent phone/address visible only to group members
- Child phone numbers hidden until ride accepted
- Child phone only visible to requester and accepter
- No global user directory

## Project Structure

```
carpool-project/
├── src/
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Tech Stack

- **Frontend:** React 18
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Storage:** Browser localStorage

## Development

The app uses localStorage for data persistence. Data is initialized with sample users, groups, and locations on first run.

To reset the database, open browser DevTools Console and run:
```javascript
localStorage.removeItem('carpool_db')
```

Then refresh the page.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```
