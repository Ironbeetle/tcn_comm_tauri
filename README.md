# TCN Communications - Desktop App (Tauri)

This is the desktop version of TCN Communications built with [Tauri](https://tauri.app/).

## Architecture

This desktop app uses a **remote backend** architecture:
- **Frontend**: Static Next.js export running in Tauri webview
- **Backend**: Your deployed TCN Communications web server handles all API calls

## Prerequisites

### For Development (Linux)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install system dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### For Development (Windows)
1. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with C++ workload
2. Install [Rust](https://rustup.rs/)
3. WebView2 is usually pre-installed on Windows 10/11

### For Development (macOS)
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-deployed-backend.com
```

## Development

Run in development mode (opens desktop app with hot reload):
```bash
npm run tauri:dev
```

## Building

Build for production:
```bash
npm run tauri:build
```

Build artifacts will be in `src-tauri/target/release/bundle/`:
- **Linux**: `.deb`, `.AppImage`
- **Windows**: `.exe`, `.msi`
- **macOS**: `.dmg`, `.app`

## Configuration

- **Tauri config**: `src-tauri/tauri.conf.json`
- **Next.js config**: `next.config.ts`
- **API client**: `lib/api-client.ts`

## Important Notes

1. **API Routes**: The `/app/api/` folder is kept for reference, but API routes won't work in static export. All API calls must go to your deployed backend.

2. **Authentication**: NextAuth session cookies need to work with your deployed backend URL.

3. **CORS**: Your backend must allow requests from the Tauri app origin.

## Cross-Platform Building

To build for Windows from Linux, you'll need cross-compilation tools or use a Windows machine/VM.

For automated multi-platform builds, consider setting up CI/CD (GitHub Actions, etc.).
