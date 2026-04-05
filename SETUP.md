# Frontend Setup Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

## Database Setup

**Important:** Before using the app for the first time, you must set up the database tables.

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema-setup.sql` to create the required tables for both beekeeper and landowner features
4. This includes tables for apiaries, hives, inspections, harvests, finances, notifications, and landowner plots/contracts

## Project Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── beekeeper/       # Beekeeper role components
│   │   ├── landowner/       # Landowner role components
│   │   └── shared/          # Shared components
│   ├── services/            # API services
│   │   ├── landownerPlotsService.ts    # Landowner plots CRUD
│   │   ├── landownerMarketplace.ts     # Marketplace operations
│   │   ├── supabaseClient.ts           # Supabase connection
│   │   └── ...              # Other services
│   ├── styles/              # CSS/Tailwind styles
│   ├── constants/           # Configuration constants
│   ├── i18n.ts              # Multi-language support
│   └── App.tsx              # Main app component
├── main.tsx                 # Entry point
└── index.css               # Global styles
```

## Key Features

### Beekeeper Role
- Manage apiaries and hives
- Track inspections and treatments
- Record harvests and expenses
- Service clients with contracts
- View planning dashboard

### Landowner Role
- Register land plots
- Create marketplace listings
- Receive and manage bids
- Manage active contracts with beekeepers

## Multi-Language Support

The app supports:
- English (en)
- Sinhala (si)  
- Tamil (ta)

Language preferences are automatically saved.

## Technologies Used

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Environment

The app is designed for:
- **Mobile-first experience** - Optimized for mobile browsers
- **Desktop support** - Also works on desktop browsers
- **Responsive design** - Adapts to all screen sizes

## Notes

- The app uses Supabase authentication for user management
- All data is stored in PostgreSQL via Supabase
- Images are stored as base64 data URLs (can be upgraded to cloud storage)
- The app features Row-Level Security (RLS) for data privacy

## Troubleshooting

**Issues with data not saving?**
- Check that the database tables exist (run the SQL migration)
- Verify you're logged in with the correct role
- Check browser console for error messages

**Login not working?**
- Ensure Supabase credentials are correct
- Check that your Supabase project is active
- Verify you've created a user account

**Missing components or errors?**
- Run `npm install` again to ensure all dependencies are installed
- Clear browser cache and restart dev server
- Check that all service files exist in `src/app/services/`
