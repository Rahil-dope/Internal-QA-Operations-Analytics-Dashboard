# Deployment Guide: OpsAnalytics Dashboard

This guide provides step-by-step instructions to compile and deploy the OpsAnalytics QA & Operations Dashboard to production.

---

## 1. Prerequisites

Ensure your system meets the following requirements:
- **Node.js**: `v18.x` or higher (recommended: `v20.x`)
- **NPM**: `v9.x` or higher
- **Browser Compatibility**: Google Chrome, Microsoft Edge, Safari, Firefox (recent versions)

---

## 2. Local Compilation & Verification

Before initiating deployment, verify that the project builds correctly in a clean state:

```bash
# 1. Install dependencies
npm install

# 2. Build the production application
npm run build

# 3. Preview the production bundle locally
npm run preview
```

Open `http://localhost:4173` to test the compiled app. Verify that:
1. The app redirects to `/upload` automatically since no data is loaded.
2. Uploading a valid Excel workbook populates all dashboards instantly.
3. Dark and light themes toggle correctly.

---

## 3. Deploying to Vercel

OpsAnalytics is a client-only single-page application (SPA). It can be deployed to Vercel instantly without server-side resources.

### Option A: Using the Vercel Web Dashboard (Recommended)

1. Push the project repository to GitHub, GitLab, or Bitbucket.
2. Log in to [vercel.com](https://vercel.com).
3. Click **Add New** → **Project**.
4. Import your OpsAnalytics repository.
5. In the **Project Settings**:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build Command**: `npm run build` (or `tsc -b && vite build`)
   - **Output Directory**: `dist`
6. Click **Deploy**.
7. Vercel will build the project and provide a secure live URL.

### Option B: Using the Vercel CLI

If you prefer deploying directly from your terminal:

```bash
# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Log in to your Vercel account
vercel login

# 3. Run the deployment setup from the project root
vercel
```

Follow the prompts to link the project. For production release, execute:

```bash
vercel --prod
```

---

## 4. Single Page Application (SPA) Routing Redirects

Vercel hosts static files by default. To support client-side routing on page refresh (e.g. reloading `/dsat` or `/shrinkage` directly), the project includes a `vercel.json` configuration file in the root.

This file defines rewrite rules to route all sub-paths back to the index container:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

If you deploy to another cloud provider (Netlify, AWS S3, Cloudflare Pages), consult the **Troubleshooting** section below.

---

## 5. Security Headers

Our `vercel.json` configures the following basic security headers for production protection:
- `X-Content-Type-Options: nosniff` (Prevents MIME type sniffing)
- `Referrer-Policy: strict-origin-when-cross-origin` (Protects referrer data)
- `X-Frame-Options: DENY` (Mitigates clickjacking)

---

## 6. Troubleshooting Common Issues

### Direct Refresh yields "404 Not Found"
- **Cause**: The server is trying to look for a physical folder/file named `/dsat` or `/aht` instead of delegating routing to React Router.
- **Solution**: Verify that `vercel.json` exists in the root directory and contains the `"rewrites"` block. For Netlify, ensure a `_redirects` file is in the public directory with `/* /index.html 200`. For S3, configure the Error Document index to `index.html`.

### Build Fails due to TypeScript Strict Rules
- **Cause**: Unused parameters, variables, or invalid value-only type imports.
- **Solution**: Clean up imports and verify type safety. The production pass has resolved all warnings and verified the build via `tsc -b`.

---

## 7. Production Verification Checklist

Go through this checklist on the live deployment to guarantee absolute parity:

- [ ] **Data Parsing**: Visit `/upload`, upload a custom Excel workbook, and confirm the metrics update immediately.
- [ ] **IndexedDB Persistence**: Refresh the browser after custom upload. Confirm the uploaded data is retrieved and shown instead of returning to the empty state.
- [ ] **Reset Action**: Click "Clear Data" in the header or uploader and verify the app returns to the empty state and redirects to `/upload`.
- [ ] **Date and Agent Filters**: Change the date slider and verify that cards and tables re-calculate.
- [ ] **Chart Fullscreen**: Click the Maximize icon on the trend charts and verify the modal overlays show correctly.
- [ ] **Theme Persistence**: Switch to dark mode and refresh the page. Confirm the dark theme is retained.
- [ ] **Table Sorting & Pagination**: Click column headers to sort table rows.
