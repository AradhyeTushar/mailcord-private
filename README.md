<div align="center">

# ⚡ MailCord (Nebula Mail Server)
### *Next-Generation Disposable Email & Forwarding System Integrated with Discord*

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Seamlessly bridge the gap between email and Discord.</b><br />
  Create disposable or persistent email addresses on custom domains, receive mail instantly in Discord channels or DMs, lock aliases for privacy, and manage everything through a sleek real-time web dashboard.
</p>

---

[Key Features](#-key-features) • [Architecture](#-architecture) • [Discord Bot Commands](#-discord-bot-commands) • [Web Dashboard](#-web-dashboard) • [Installation & Deployment](#-installation--deployment) • [Developer Controls](#-developer-controls)

---

</div>

## 🌟 Key Features

- 📬 **Instant Disposable & Custom Aliases:** Create custom aliases (`user@bot.devtushar.uk`) or generate random stealth emails with one command.
- 💬 **Discord-Native Mail Delivery:** Emails are parsed with full HTML/plain text support, attachments, and routed directly to dedicated Discord channels or personal DMs.
- 🔒 **Privacy & Alias Locking:** Users can lock aliases to prevent deletion or overwriting by other server members.
- 🚨 **Priority Keyword Alerts:** Tag emails containing `otp`, `urgent`, `bank`, or `verification` for instant high-priority notifications.
- 💳 **Billing & Automated Upgrades:** Native Razorpay integration supporting tiered plans (`Starter`, `Premium`, `Supreme`, `Enterprise`), automatic quota enforcement, and redeemable upgrade keys.
- 🔑 **Developer Key Generator:** Generate cryptographically secure license keys (`NEBULA-X-...`) directly from Discord with customizable plan tiers and validity durations.
- 🖥️ **Full-Stack Web Dashboard:** Built with React 19, Vite, Framer Motion, and Tailwind CSS. Includes an Interactive Command Builder, Account Settings, Live Analytics, and Inbox Explorer.
- ☁️ **Cloudflare Serverless Routing:** High-throughput email ingestion via Cloudflare Email Routing Workers with webhook forwarding.

---

## 🏗️ Architecture

```
                      ┌──────────────────────────────────────┐
                      │            Incoming Email            │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   Cloudflare Email Routing Worker    │
                      └──────────────────┬───────────────────┘
                                         │ (Encrypted Webhook)
                                         ▼
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                               MailCord Backend                                  │
 │                                                                                 │
 │   ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐   │
 │   │  Incoming Ingestion  │  │   NeDB / MongoDB     │  │   Razorpay Billing  │   │
 │   │   & Mail Parser      │  │     Data Store       │  │    Webhook Engine   │   │
 │   └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬──────────┘   │
 │              │                         │                         │              │
 └──────────────┼─────────────────────────┼─────────────────────────┼──────────────┘
                │                         │                         │
                ▼                         ▼                         ▼
   ┌────────────────────────┐┌────────────────────────┐┌────────────────────────┐
   │  Discord Gateway Bot   ││ React 19 Web Dashboard ││  Developer Diagnostics │
   │  • DM / Channel Alerts ││ • Live Mail Reader     ││  • Key Generation      │
   │  • Command Handlers    ││ • Account Settings     ││  • Quota Management    │
   └────────────────────────┘└────────────────────────┘└────────────────────────┘
```

---

## 🤖 Discord Bot Commands

MailCord supports both prefix (`!`) and slash (`/`) commands:

### 👤 User Commands
| Command | Alias | Description | Permission |
| :--- | :--- | :--- | :--- |
| `!alias create <name>` | `!create`, `!ac` | Create a custom email alias under your domain | Everyone |
| `!alias generate` | `!gen`, `!ag` | Generate a randomized secure disposable email alias | Everyone |
| `!alias list` | `!aliases`, `!al` | View all active aliases associated with your account | Everyone |
| `!alias delete <name>` | `!del`, `!ad` | Delete an alias and stop receiving forwarded mail | Everyone |
| `!alias lock <name>` | `!lock` | Lock an alias to prevent modifications by others | Everyone |
| `!alias unlock <name>` | `!unlock` | Unlock an alias to allow changes | Everyone |
| `!inbox history <alias>`| `!ih`, `!history` | Display recent incoming emails for an alias | Everyone |
| `!inbox search <query>` | `!is`, `!find` | Search through received messages by subject or sender | Everyone |
| `!test <alias>` | `!diag` | Send an automated diagnostic test email to verify routing | Everyone |
| `!redeem <code>` | `!claim` | Redeem an upgrade key to upgrade your account tier | Everyone |
| `!listc` | `!help`, `!cmds` | View comprehensive command reference directory | Everyone |

### 🛠️ Developer & Admin Commands
*Restricted strictly to `DEVELOPER_ID` in `.env`:*

| Command | Description | Access |
| :--- | :--- | :--- |
| `!devkey <plan> [days]` | Generate a redeemable license key (`premium`, `supreme`, `enterprise`) | Developer Only |
| `!listc dev` | View the hidden developer diagnostics commands directory | Developer Only |
| `!servers` | Inspect connected Discord servers, member counts, and health status | Developer Only |
| `!users` | View active user database metrics and quota utilization | Developer Only |
| `!reload` | Hot-reload bot modules and re-sync application slash commands | Developer Only |

---

## 🖥️ Web Dashboard

The MailCord Dashboard provides an intuitive web interface for managing your server and emails:

- **📊 Overview & Analytics:** Total aliases created, emails received, spam filtered, and storage metrics.
- **📬 Live Inbox:** View incoming emails with sender avatars, sanitized HTML preview, headers, and attachments.
- **⚙️ Account Settings (`/settings`):** Manage Discord DM notifications, toggle Strict Privacy Mode, configure priority keywords (`otp`, `bank`), and manage backup recovery emails.
- **📖 Interactive Command Directory (`/commands`):** Built-in command generator with copy-to-clipboard functionality and simulated Discord chat previews.
- **💳 Billing & Plans (`/checkout`):** Upgrade subscription tiers with Razorpay, track invoices, and redeem upgrade codes.

---

## 🚀 Installation & Deployment

### 1. Prerequisites
- Node.js `20.x` or higher
- MongoDB `6.x` or local NeDB / SQLite
- Cloudflare Domain with Email Routing enabled
- Discord Application & Bot Token

### 2. Clone & Install Dependencies
```bash
git clone git@github.com:AradhyeTushar/mailcord-private.git
cd mailcord-private
npm install
```

### 3. Configure Environment Variables
Copy the template and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```ini
# Discord Application Credentials
DISCORD_CLIENT_ID=1489402992393453678
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token

# Developer & Owner Snowflake ID
DEVELOPER_ID=560057266942902273

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
CLOUDFLARE_DOMAIN=bot.devtushar.uk

# Database & Authentication
JWT_SECRET=your_super_secret_jwt_key
MONGODB_URI=mongodb://127.0.0.1:27017/mailcord

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4. Run Locally
```bash
# Start development server with hot-reloading
npm run dev
```

### 5. Production Build
```bash
# Compile frontend bundle
npm run build

# Start production server
npm run start
```

---

## 🔒 Security & Privacy

- **Zero Plaintext Secrets:** Sensitive tokens and session keys are never exposed on client-side routes.
- **Strict Privacy Mode:** Allows users to route all incoming emails strictly to private Discord DMs, ensuring sensitive emails never leak into server channels.
- **Content Sanitization:** Email HTML bodies are sanitized to neutralize malicious scripts, tracking pixels, and unauthorized redirects.
- **Role-Based Command Filtering:** Developer diagnostics and administrative commands are locked strictly to the developer Snowflake ID.

---

## 📄 License & Intellectual Property

Copyright © 2026 Tushar Aradhye ([@AradhyeTushar](https://github.com/AradhyeTushar)). **All Rights Reserved.**

This software, source code, and documentation are **Strictly Proprietary and Confidential**.  
Unauthorized copying, modification, reverse-engineering, redistribution, public hosting, or commercial exploitation in any format is strictly prohibited without prior explicit written authorization from the copyright holder.

For complete terms and conditions, refer to the [LICENSE](LICENSE) file.
