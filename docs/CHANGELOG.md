# Changelog (Consolidated from past updates)

This changelog captures the historical development updates, fixes, and features that were originally documented in individual markdown files across the repository.

## Admin & Setup
- **Admin Setup:** Initial setup completed with dummy data generation capabilities (`POST /api/admin/setup`) and a hardcoded admin access key for environment security.
- **Company Credentials:** Implemented a `CompanyCredential` model to handle dynamic company details (name, address, bank info, UPI info, tax details, logo upload). Supported Picbox and Echo brands natively.

## Authentication & Authorization
- **Auth Token Fix:** Resolved an issue where Bearer tokens from AsyncStorage were not being correctly formatted in Axios interceptors. Added re-login logic on 401 Unauthorized responses.

## UI & State Management
- **Dashboard Enhancements:** Fixed net profit calculations by explicitly filtering jobs to only include the "completed" status.
- **State Management & Pull-to-Refresh:** Implemented `useFocusEffect` and `RefreshControl` across Employees, Jobs, Products, and Invoices screens so that data (like pending salary) refreshes live without restarting the app.

## Invoice & PDF Generation
- **PDF Infrastructure:** Migrated from Cloudinary uploads to a direct-to-device download model (using `expo-file-system` and `expo-sharing`) to reduce cloud dependency. Added a local storage fallback mechanism.
- **PDF Generator Engine:** Adopted Puppeteer for rendering HTML templates to PDF. Installed Chromium on the production environment (Render) via a custom `build.sh` script.
- **PDF Layout & Styling:** 
  - Dynamic document titles ("ESTIMATE" vs "INVOICE").
  - Conditional display of payment info and UPI QR codes (only on estimates).
  - Supported dual-brand logic (Picbox vs Echo) with dynamic logos encoded in base64.
  - Adjusted CSS to fit 3-4 item invoices on a single page by reducing padding, margins, and font sizes.
- **Invoice API:** Fixed a critical Express routing bug where generic `/:id` caught requests intended for `/:id/generate-pdf`. Added a `GET` endpoint for PDF downloads to bypass `FileSystem.downloadAsync` constraints.

## Database & File System
- **Database Backups:** Added a backup endpoint utilizing `mongodump` to create local gzip archives in a `/backups` directory, protected by an Admin access key.
- **FileSystem Deprecation:** Handled `expo-file-system` deprecations for downloading files securely on devices.
