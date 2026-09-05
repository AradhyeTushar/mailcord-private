/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Commands from './pages/Commands';
import AccountSettings from './pages/AccountSettings';
import About from './pages/About';
import Pricing from './pages/Pricing';
import Changelog from './pages/Changelog';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import DocsLayout from './pages/docs/DocsLayout';
import Introduction from './pages/docs/Introduction';
import HowItWorks from './pages/docs/HowItWorks';
import QuickSetup from './pages/docs/QuickSetup';
import AliasSystem from './pages/docs/AliasSystem';
import MessagingFlow from './pages/docs/MessagingFlow';
import InboxSystem from './pages/docs/Inbox';
import UserGuide from './pages/docs/UserGuide';
import AdminGuide from './pages/docs/AdminGuide';
import UseCases from './pages/docs/UseCases';
import BotWorkflows from './pages/docs/BotWorkflows';
import ApiReference from './pages/docs/ApiReference';
import WebhooksDocs from './pages/docs/Webhooks';
import ConfigDocs from './pages/docs/ConfigDocs';
import SecurityDocs from './pages/docs/Security';
import ScalingDocs from './pages/docs/Scaling';
import Faq from './pages/docs/Faq';
import Api from './pages/Api';
import Status from './pages/Status';
import Community from './pages/Community';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookie from './pages/Cookie';
import Security from './pages/Security';

const DocsIndexRedirect = () => {
  const lastVisited = localStorage.getItem('docs-last-visited') || '/docs/introduction';
  return <Navigate to={lastVisited} replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/billing/checkout" element={<Checkout />} />
        <Route path="/commands" element={<Commands />} />
        <Route path="/settings" element={<AccountSettings />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/contact" element={<Contact />} />
        
        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<DocsIndexRedirect />} />
          <Route path="introduction" element={<Introduction />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="setup" element={<QuickSetup />} />
          <Route path="alias-system" element={<AliasSystem />} />
          <Route path="messaging-flow" element={<MessagingFlow />} />
          <Route path="inbox" element={<InboxSystem />} />
          <Route path="user-guide" element={<UserGuide />} />
          <Route path="admin-guide" element={<AdminGuide />} />
          <Route path="use-cases" element={<UseCases />} />
          <Route path="bot-workflows" element={<BotWorkflows />} />
          <Route path="api" element={<ApiReference />} />
          <Route path="webhooks" element={<WebhooksDocs />} />
          <Route path="config" element={<ConfigDocs />} />
          <Route path="security" element={<SecurityDocs />} />
          <Route path="billing" element={<ScalingDocs />} />
          <Route path="faq" element={<Faq />} />
        </Route>

        <Route path="/api" element={<Api />} />
        <Route path="/status" element={<Status />} />
        <Route path="/community" element={<Community />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookie" element={<Cookie />} />
        <Route path="/security" element={<Security />} />
      </Routes>
    </Router>
  );
}
