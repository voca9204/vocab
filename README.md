# vocabulary

A new web-app project

A modern React application built with Vite, created by START2 User.

## Features

- ⚡ **Vite** - Lightning fast build tool
- ⚛️ **React 18** - Latest React with Hooks and Concurrent Features  
- 🎨 **Modern CSS** - Responsive design with CSS Grid and Flexbox
- 🔥 **Hot Module Replacement** - Instant updates during development
- 📱 **Responsive Design** - Works great on desktop and mobile
- 🛠️ **ESLint** - Code quality and consistency

## Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   ```
   http://localhost:3000
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
vocabulary/
├── public/           # Static assets
├── src/              # Source code
│   ├── components/   # React components
│   ├── assets/       # Images, icons, etc.
│   ├── App.jsx       # Main App component
│   ├── App.css       # App styles
│   ├── index.css     # Global styles
│   └── main.jsx      # Application entry point
├── index.html        # HTML template
├── package.json      # Dependencies and scripts
└── vite.config.js    # Vite configuration
```

## Development

### Adding Components

Create new components in the `src/components/` directory:

```jsx
// src/components/MyComponent.jsx
function MyComponent() {
  return <div>Hello from MyComponent!</div>
}

export default MyComponent
```

### Styling

The project uses CSS modules and regular CSS. You can:

- Add global styles in `src/index.css`
- Add component-specific styles in `src/App.css`
- Create new CSS files for components

### Assets

Place static assets in the `public/` directory or import them in your components:

```jsx
import logo from './assets/logo.svg'
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```
3. Run: `npm run build && npm run deploy`

## Learn More

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

## License

This project is licensed under the MIT License.

## Author

Created by **START2 User** using START2 Universal Project Launcher.

---

**Happy coding! 🚀**
