
# ⚽ Football Club Human Resource Management (FCHRM)

A web-based Football Club Human Resource Management System designed to manage football club personnel, contracts, payroll, documents, events, and achievements in one centralized platform.

## 📌 About the Project

Football Club Human Resource Management (FCHRM) is a web application developed to simplify the management of football club operations, particularly in personnel administration.

The application provides a centralized platform for managing player and staff information, monitoring employment contracts, organizing payroll records, storing important documents, and maintaining club activities and achievements.

FCHRM is built using React for the frontend, Node.js and Express.js for the backend, and Supabase for database management, authentication, and file storage.

## ✨ Features

### 1. Dashboard
- Centralized overview of club management information.
- Quick access to important management modules.
- Summary of club administration data.

### 2. Players Management
- Manage player information and biodata.
- View and update player records.
- Manage player-related information and photographs.

### 3. Staff Management
- Manage coaching staff and other club personnel.
- Store staff biodata and employment information.
- Update and maintain personnel records.

### 4. Contract Management
- Create, update, and delete contracts.
- Manage contract statuses:
  - Draft
  - Pending
  - Active
  - Expired
  - Terminated
- Renew existing contracts.
- View contract history.
- Search and filter contracts by status.

### 5. Payroll Management
- Manage club personnel payroll records.
- Monitor payroll information and payment statuses.
- Update payroll records.

### 6. Document Management
- Manage and organize club-related documents.
- Store important administrative records.

### 7. Club Hub

#### Events
- Create, update, and delete club events.
- Manage event dates, locations, and descriptions.
- Track event statuses, including Scheduled and Completed.
- Search and filter events.
- Sort events by date in ascending or descending order.
- Filter events by date range.
- Export filtered event data to Excel.

#### Achievements
- Record individual, team, and club achievements.
- Associate achievements with club personnel.
- Manage achievement dates and descriptions.
- Search and filter achievement records.
- Filter achievements by type.
- Sort achievements by date.
- Filter achievements by date range.
- Export filtered achievement data to Excel.

### 8. Account Profile
- View personal account information.
- Update profile details.
- Upload and change profile photographs.
- Manage personal information associated with the authenticated account.

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React
- TanStack React Query
- SheetJS (xlsx)

### Backend
- Node.js
- Express.js
- Supabase JavaScript Client
- REST API

### Database & Services
- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage

### Development Tools
- Visual Studio Code
- Git & GitHub
- npm
- Postman

## 📂 Project Structure

```text
Football_management_system/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── ...
│   ├── .env
│   └── package.json
│
└── README.md
```

*Note: The structure above is a general representation. Actual directory names may vary depending on the project implementation.*

## ⚙️ Requirements

Before running the application, make sure you have installed:

- Node.js (LTS recommended)
- npm
- Git
- A Supabase account

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Football_management_system.git
```

Navigate to the project directory:

```bash
cd Football_management_system
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the backend directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Replace the placeholder values with your Supabase project credentials.

Start the backend server:

```bash
npm run dev
```

Backend server:

```text
http://localhost:4000
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_API_URL=http://localhost:4000/api
```

Start the frontend development server:

```bash
npm run dev
```

Frontend application:

```text
http://localhost:5173
```

### 4. Supabase Configuration

FCHRM uses Supabase for authentication, database management, and file storage.

To configure Supabase:

1. Create a new project in Supabase.
2. Configure the required PostgreSQL tables and relationships.
3. Configure Supabase Authentication.
4. Create the required Storage bucket for personnel photographs.
5. Configure the appropriate Row Level Security (RLS) policies.
6. Add your Supabase credentials to the frontend and backend environment files.

**Important:** Never expose your Supabase Service Role Key in frontend code or commit secret credentials to GitHub.

## ▶️ Running the Application

FCHRM requires both frontend and backend servers to run.

**Terminal 1 – Backend**

```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend**

```bash
cd frontend
npm run dev
```

Open the application in your browser:

```text
http://localhost:5173
```

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service role key |
| `FRONTEND_URL` | Frontend application URL |
| `NODE_ENV` | Application environment |
| `VITE_SUPABASE_URL` | Supabase URL for frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key for frontend |
| `VITE_API_URL` | Backend API base URL |

Do not upload `.env` files or expose private credentials in the repository.

## 🎨 UI Design

FCHRM uses a clean administrative interface with a navy and gold color palette.

| Color | Hex Code | Usage |
|---|---|---|
| Navy | `#14213D` | Primary interface and navigation |
| Gold | `#D4AF37` | Highlights and primary actions |
| Light Background | `#F3F5F9` | Main application background |

The interface is designed to provide a consistent experience across different management modules.

## 🔮 Future Improvements

Potential improvements for future development include:

- Advanced dashboard analytics.
- More comprehensive payroll reporting.
- Enhanced document preview and management.
- Additional personnel performance tracking.
- Improved role-based access management.
- Production deployment and optimization.