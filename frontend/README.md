# Frontend - Notes-Do App

A modern React application built with Vite, featuring authentication with Clerk, data fetching with TanStack Query, and styled with Tailwind CSS.

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Create `.env.local` file:

   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Key Dependencies

- **React 19** - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Clerk** - Authentication and user management
- **TanStack Query** - Data fetching and caching
- **React Router** - Client-side routing
- **shadcn/ui** - UI component library

## Project Structure

- `src/components/` - Reusable UI components organized by feature
- `src/pages/` - Page components
- `src/_root/` - Main application pages
- `src/_auth/` - Authentication-related pages
- `src/lib/` - Library configurations and utilities
- `src/services/` - API services and data fetching
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions

## Development Notes

- JSX files use `.jsx` extension for proper syntax highlighting
- Tailwind CSS for styling with utility classes
- Prettier for consistent code formatting
- ESLint for code quality and best practices
- Environment variables prefixed with `VITE_` are exposed to the client
- shadcn/ui components can be added with `npx shadcn@latest add <component>`

## Authentication

This app uses Clerk for authentication. Make sure to:

1. Create a Clerk application
2. Add your publishable key to `.env.local`
3. Configure your Clerk dashboard with appropriate settings

For more detailed information, see the main README in the root directory.
