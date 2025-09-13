# 🎉 PartyHaus - Event Management Platform

[![Deploy to Netlify](https://github.com/Thundastormgod/PartyHaus/actions/workflows/deploy.yml/badge.svg)](https://github.com/Thundastormgod/PartyHaus/actions/workflows/deploy.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-site-id/deploy-status.svg)](https://app.netlify.com/sites/your-netlify-site-name/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, secure event management platform built with React, TypeScript, and Supabase. Create, manage, and attend events with real-time updates and comprehensive security features.

## 🚀 Live Demo

**Production**: [Your Netlify URL will appear here after deployment]

## 📋 Features

- 🎪 **Event Creation & Management**: Create and manage events with detailed information
- 👥 **Guest Management**: Track attendees, RSVPs, and guest lists
- 🔐 **Secure Authentication**: Protected routes with Supabase authentication
- 📱 **Responsive Design**: Mobile-first design with Tailwind CSS
- ⚡ **Real-time Updates**: Live data synchronization across all users
- 🛡️ **Security Hardened**: Comprehensive input validation and sanitization
- 🧪 **Fully Tested**: Unit and integration tests with Vitest
- 🚀 **CI/CD Pipeline**: Automated deployment with GitHub Actions

## Project info

**URL**: https://lovable.dev/projects/5999e35a-31b8-458a-9360-dcab07544e34

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5999e35a-31b8-458a-9360-dcab07544e34) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Thundastormgod/PartyHaus.git
cd PartyHaus

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Environment Setup

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=your_resend_api_key
VITE_APP_ENV=development
```

## 🚀 Deployment

This project uses GitHub Actions for automated CI/CD deployment to Netlify.

### Automatic Deployment
- **Production**: Push to `main` branch triggers production deployment
- **Preview**: Pull requests automatically create preview deployments
- **Manual**: Use GitHub Actions workflow dispatch for manual deployments

### Setup Deployment

1. **Fork this repository**
2. **Set up Netlify account** and create a new site
3. **Configure GitHub Secrets** in your repository settings:
   ```
   NETLIFY_AUTH_TOKEN=your_netlify_token
   NETLIFY_SITE_ID=your_netlify_site_id
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_RESEND_API_KEY=your_resend_key
   ```
4. **Push to main branch** to trigger first deployment

For detailed setup instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:dev

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📁 Project Structure

```
src/
├── api/           # API layer and external services
├── components/    # React components
│   └── ui/        # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions and configurations
├── store/         # State management (Zustand)
└── test/          # Test files and utilities
```

## 🔒 Security Features

- **Input Validation**: Comprehensive Zod schemas
- **Sanitization**: DOMPurify for HTML content
- **Authentication**: Supabase Auth with protected routes
- **Error Boundaries**: Graceful error handling
- **Security Headers**: CSP, HSTS, and more via Netlify
- **Dependency Auditing**: Automated security scans

## 🤝 Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** and write tests
3. **Run tests**: `npm run test`
4. **Create pull request** for code review
5. **Preview deployment** automatically created
6. **Merge to main** for production deployment

## 🛠️ Technologies

This project is built with:

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Database, Auth, Real-time)
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest, Testing Library
- **Deployment**: Netlify with GitHub Actions CI/CD
- **Package Manager**: Bun (fast JavaScript runtime)

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Local Development

## 📝 Alternative Development Methods

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5999e35a-31b8-458a-9360-dcab07544e34) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete CI/CD setup instructions
- [API Documentation](./docs/api.md) - API endpoints and usage
- [Component Library](./docs/components.md) - UI component documentation
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute to this project

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. **Check existing issues**: [GitHub Issues](https://github.com/Thundastormgod/PartyHaus/issues)
2. **Create new issue**: Use the issue templates for bugs or feature requests
3. **Join discussions**: [GitHub Discussions](https://github.com/Thundastormgod/PartyHaus/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev) - AI-powered development platform
- [Supabase](https://supabase.com) - Backend as a Service
- [Netlify](https://netlify.com) - Deployment and hosting
- [shadcn/ui](https://ui.shadcn.com) - UI component library

---

**Made with ❤️ using Lovable and modern web technologies**
