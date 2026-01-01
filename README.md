# 📄 PDF Toolkit - Free PDF & Image Tools

A completely **free**, **privacy-first** web application for PDF manipulation and image conversion. Built with Next.js 14 and deployed on Vercel. All processing happens **client-side** in your browser - no uploads, no servers, no tracking.

🌐 **[Live Demo](#)** | 📖 **[Documentation](#features)** | 🐛 **[Report Bug](https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools/issues)** | ✨ **[Request Feature](https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools/issues)**

---

## 🎯 Features

### PDF Tools
- ✅ **Merge PDF** - Combine multiple PDF files into one
- ✅ **Split PDF** - Extract specific pages or page ranges
- ✅ **Compress PDF** - Optimize PDF structure (note: limited compression for already-compressed PDFs)
- ✅ **Rotate PDF** - Rotate pages 90°, 180°, or 270°
- ✅ **Delete Pages** - Remove unwanted pages
- ✅ **Protect PDF** - Add password protection
- ✅ **Unlock PDF** - Remove password (with permission)
- ✅ **Add Watermark** - Text or image watermarks
- ✅ **Edit Metadata** - Update PDF properties

### Conversion Tools
- ✅ **PDF to Image** - Convert PDF pages to JPG/PNG
- ✅ **Image to PDF** - Create PDF from images
- ✅ **Image to ICO** - Convert images to Windows icon format (multi-resolution)
- ✅ **ICO to Image** - Extract all sizes from ICO files

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm, yarn, or pnpm

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools.git
cd PDF-Toolkit---Free-PDF-Image-Tools

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run development server
npm run dev

# Open http://localhost:3000
\`\`\`

### Environment Variables

Copy `.env.example` to `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

All environment variables are optional with sensible defaults:

\`\`\`env
# Max file size in MB (default: 50)
NEXT_PUBLIC_MAX_FILE_SIZE_MB=50

# Rate limit per hour (default: 100)
NEXT_PUBLIC_RATE_LIMIT_PER_HOUR=100

# Debug mode (default: false)
NEXT_PUBLIC_DEBUG=false
\`\`\`

---

## 📦 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Beautiful icons

### PDF Processing
- **pdf-lib** - PDF manipulation (merge, split, rotate, etc.)
- **pdfjs-dist** - PDF rendering and conversion

### Image Processing
- **Canvas API** - Image manipulation and ICO generation
- **Native browser APIs** - No server-side dependencies

### Additional Libraries
- **JSZip** - Create ZIP files for batch downloads
- **file-saver** - Simplified file downloads

---

## 🏗️ Project Structure

\`\`\`
pdf-toolkit/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── tools/               # Tool pages
│       ├── merge-pdf/       # Merge PDF tool
│       ├── split-pdf/       # Split PDF tool
│       ├── compress-pdf/    # Compress PDF tool
│       ├── image-to-ico/    # Image to ICO converter
│       ├── ico-to-image/    # ICO to Image converter
│       └── ...              # Other tools
├── components/              # Reusable React components
│   ├── FileUpload.tsx       # Drag-and-drop file upload
│   ├── ProgressBar.tsx      # Progress indicator
│   ├── DownloadButton.tsx   # Download with ZIP support
│   ├── ToolLayout.tsx       # Shared tool page layout
│   └── ToolsGrid.tsx        # Homepage tool grid
├── lib/                     # Utility functions
│   ├── pdf-utils.ts         # PDF processing functions
│   ├── image-utils.ts       # Image/ICO conversion
│   ├── tools.ts             # Tool configurations
│   └── utils.ts             # File handling, validation
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment config
└── package.json             # Dependencies
\`\`\`

---

## 🔒 Privacy & Security

### Client-Side Processing
All file processing happens in your browser using WebAssembly and JavaScript:
- ✅ Files **never leave your device**
- ✅ No server uploads or storage
- ✅ No tracking or analytics on files
- ✅ Works completely offline (after initial load)

### Security Features
- ✅ File size limits (default 50MB)
- ✅ File type validation
- ✅ Rate limiting (localStorage-based)
- ✅ Sanitized filenames
- ✅ Security headers (HTTPS, CSP, etc.)
- ✅ No third-party scripts

### Rate Limiting
To prevent abuse while maintaining privacy:
- 100 operations per hour per browser (default)
- Stored in localStorage (not tracked server-side)
- Resets automatically after 1 hour

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pdf-toolkit)

Or manually:

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
\`\`\`

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

### Static Export (Optional)

For hosting on static servers:

\`\`\`bash
# Add to next.config.js
output: 'export'

# Build static files
npm run build
# Output in 'out' directory
\`\`\`

---

## 🛠️ Development

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Type Checking

\`\`\`bash
npm run type-check
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Adding a New Tool

1. Create tool page in `app/tools/your-tool/page.tsx`
2. Add tool configuration to `lib/tools.ts`
3. Implement processing logic in `lib/pdf-utils.ts` or `lib/image-utils.ts`
4. Use shared components: `FileUpload`, `ProgressBar`, `DownloadButton`

Example structure:

\`\`\`tsx
'use client'
import ToolLayout from '@/components/ToolLayout'
import FileUpload from '@/components/FileUpload'

export default function YourToolPage() {
  return (
    <ToolLayout title="Your Tool" description="Tool description">
      <FileUpload accept={['.pdf']} onFilesSelected={handleFiles} />
      {/* Your tool logic */}
    </ToolLayout>
  )
}
\`\`\`

---

## 📚 API / Library Usage

### PDF Utilities

\`\`\`typescript
import { mergePDFs, splitPDF, compressPDF } from '@/lib/pdf-utils'

// Merge PDFs
const mergedBytes = await mergePDFs([file1, file2, file3])

// Split PDF
const splitBytes = await splitPDF(file, [
  { start: 1, end: 5 },
  { start: 6, end: 10 }
])

// Compress PDF
const compressed = await compressPDF(file, 'medium')
\`\`\`

### Image Utilities

\`\`\`typescript
import { imageToICO, icoToImages } from '@/lib/image-utils'

// Convert image to ICO
const icoBlob = await imageToICO(imageFile, [
  { width: 16, height: 16 },
  { width: 32, height: 32 },
  { width: 48, height: 48 }
])

// Extract images from ICO
const images = await icoToImages(icoFile)
// Returns: [{ blob, width, height }, ...]
\`\`\`

---

## 🎨 Customization

### Theming

Edit `tailwind.config.ts` to customize colors:

\`\`\`typescript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#fef2f2',
        // ... your colors
        900: '#7f1d1d',
      },
    },
  },
}
\`\`\`

### Adding Languages

The app is ready for i18n. To add translations:

1. Create translation files in `locales/`
2. Use Next.js i18n routing
3. Update text throughout the app

---

## 🐛 Known Limitations

### Browser Limitations
- **Large files**: Processing 100MB+ PDFs may slow down or crash browsers
- **Mobile**: Limited memory on mobile devices
- **Safari**: Some features may have reduced performance

### PDF-lib Limitations
- **Compression**: Client-side compression is basic (removes unused objects)
- **Encryption**: Limited password protection options
- **Forms**: Form field manipulation not fully supported

### Recommended Limits
- **File size**: 50MB per file (configurable)
- **Merge**: Up to 50 PDFs at once
- **Split**: Up to 1000 pages

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test all features before submitting
- Update documentation for new features

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering by Mozilla
- [Lucide](https://lucide.dev/) - Beautiful icon set
- [Vercel](https://vercel.com/) - Hosting platform
- Inspired by [iLovePDF](https://www.ilovepdf.com/)

**Crafted with ❤️ by SB**

---

## 📧 Support

- 📖 **Documentation**: [GitHub Wiki](https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools/wiki)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/SPIN0ZAi/PDF-Toolkit---Free-PDF-Image-Tools/discussions)
- 📧 **Contact**: Via GitHub

---

## ⭐ Show Your Support

If you found this project helpful, please consider:
- ⭐ Starring the repository
- 🐦 Sharing on social media
- 🤝 Contributing code or documentation
- ☕ Buying me a coffee

---

**Built with ❤️ for privacy and freedom. 100% free, forever. - SB**
