# PICBOX — Inventory & Invoicing Management System

A full-stack inventory, staff wage tracking, and invoicing system built for a local event management company that rents out sound and lighting equipment.

**Status:** In production use — actively used by company staff to manage day-to-day inventory, jobs, and invoicing.

**Tech Stack:** React Native (Expo) · Node.js · Express.js · MongoDB · JWT Auth · Cloudinary

---

## Overview

Picbox replaces manual, spreadsheet-based tracking for a sound/light rental business with a mobile-first system covering:

- **Inventory management** — track equipment (speakers, LED walls, DJ gear) with purchase records
- **Job & event tracking** — assign equipment and staff to rental jobs, track expenses per job
- **Staff wage tracking** — automatic wage accrual per job, payment recording, and balance history
- **Invoicing** — generate and export invoices as PDFs, with multi-brand support
- **Dashboard** — real-time revenue, expenses, and profit summaries
- **Secure credential storage** — encrypted (AES-256) storage for sensitive account/banking details

## Architecture

- **Backend:** Node.js + Express REST API with 40+ endpoints, JWT authentication, and MongoDB (Mongoose ODM). Wage calculations use MongoDB transactions to keep job creation, payments, and deletions consistent.
- **Frontend:** React Native (Expo) mobile app with TypeScript, Zustand for state management, and a tablet-optimized UI for on-site use.
- **Deployment:** Backend hosted on Render; file uploads (product images, invoice PDFs) handled via Cloudinary.

## Key Technical Details

- Atomic wage tracking — job creation increments pending staff wages, payment recording decrements them, and job deletion reverses the change, all within MongoDB transactions to prevent inconsistent state
- JWT-based auth with role-based access
- Encrypted storage for banking/account credentials (AES-256-CBC)
- PDF invoice generation with Cloudinary-backed storage

## Usage

Currently deployed and used by staff of the client company to manage rental inventory, staff payments, and client invoicing on a daily basis.

---

*Built and maintained as a freelance engagement for a local event management business.*
