import { 
  Rocket, 
  Settings, 
  Shield, 
  MessageSquare, 
  Inbox, 
  User, 
  Lock, 
  CreditCard, 
  Code, 
  HelpCircle,
  Eye,
  Activity,
  Workflow,
  Webhook,
  Key
} from 'lucide-react';

export type Role = 'user' | 'admin' | 'developer';

export interface NavItem {
  id: string;
  path: string;
  label: string;
  roles: Role[];
  keywords?: string[];
  icon?: any;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  icon?: any;
}

export const DOCS_NAV: NavSection[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { id: "introduction", path: "/docs/introduction", label: "Introduction", roles: ['user', 'admin', 'developer'], keywords: ['start', 'welcome', 'overview'], icon: HelpCircle },
      { id: "how-it-works", path: "/docs/how-it-works", label: "How it Works", roles: ['user', 'admin', 'developer'], keywords: ['visual', 'flow', 'logic'], icon: Eye },
      { id: "setup", path: "/docs/setup", label: "Quick Start", roles: ['admin', 'developer'], keywords: ['install', 'invite', 'bot', 'start'], icon: Settings },
    ]
  },
  {
    title: "Core Features",
    icon: Shield,
    items: [
      { id: "alias-system", path: "/docs/alias-system", label: "Alias System", roles: ['user', 'admin', 'developer'], keywords: ['anonymous', 'identity', 'create alias'], icon: User },
      { id: "messaging-flow", path: "/docs/messaging-flow", label: "Messaging Flow", roles: ['user', 'admin', 'developer'], keywords: ['send', 'receive', 'reply', 'dm'], icon: MessageSquare },
      { id: "inbox", path: "/docs/inbox", label: "Inbox System", roles: ['user', 'admin', 'developer'], keywords: ['messages', 'read', 'manage'], icon: Inbox }
    ]
  },
  {
    title: "Guides",
    icon: Workflow,
    items: [
      { id: "user-guide", path: "/docs/user-guide", label: "User Guide", roles: ['user', 'admin', 'developer'], keywords: ['commands', 'how to'], icon: User },
      { id: "admin-guide", path: "/docs/admin-guide", label: "Admin Guide", roles: ['admin', 'developer'], keywords: ['moderation', 'logs', 'spam', 'config'], icon: Shield },
      { id: "use-cases", path: "/docs/use-cases", label: "Real Use Cases", roles: ['user', 'admin', 'developer'], keywords: ['examples', 'scenarios', 'business'], icon: Activity },
      { id: "bot-workflows", path: "/docs/bot-workflows", label: "Bot Workflows", roles: ['user', 'admin', 'developer'], keywords: ['examples', 'scenarios'], icon: Workflow },
    ]
  },
  {
    title: "Developers",
    icon: Code,
    items: [
      { id: "api", path: "/docs/api", label: "API Reference", roles: ['developer'], keywords: ['endpoints', 'rest', 'json', 'requests'], icon: Code },
      { id: "webhooks", path: "/docs/webhooks", label: "Webhooks", roles: ['developer'], keywords: ['events', 'callbacks', 'realtime'], icon: Webhook },
    ]
  },
  {
    title: "Advanced",
    icon: Lock,
    items: [
      { id: "config", path: "/docs/config", label: "Configuration", roles: ['admin', 'developer'], keywords: ['settings', 'advanced', 'customization'], icon: Settings },
      { id: "security", path: "/docs/security", label: "Security", roles: ['admin', 'developer'], keywords: ['privacy', 'encryption', 'aes-256'], icon: Shield },
      { id: "billing", path: "/docs/billing", label: "Scaling & Plans", roles: ['user', 'admin', 'developer'], keywords: ['payment', 'razorpay', 'pricing', 'upgrade', 'cancel'], icon: CreditCard },
      { id: "faq", path: "/docs/faq", label: "FAQ", roles: ['user', 'admin', 'developer'], keywords: ['questions', 'help', 'support'], icon: HelpCircle }
    ]
  }
];

export const getAllNavItems = () => DOCS_NAV.flatMap(section => section.items);
