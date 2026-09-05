import Layout from '../components/Layout';

export default function Cookie() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-neutral-400">Last updated: April 6, 2026</p>
        </div>

        <div className="prose prose-invert prose-indigo max-w-none">
          <p className="text-lg text-neutral-300 mb-8">
            This Cookie Policy explains how MailCord uses cookies and similar technologies to recognize you when you visit our website and use our web dashboard.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">1. What are cookies?</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">2. How we use cookies</h2>
          <p className="text-neutral-400 mb-4 leading-relaxed">We use cookies for the following purposes:</p>
          <ul className="list-disc pl-6 text-neutral-400 mb-6 space-y-2">
            <li><strong>Authentication:</strong> We use cookies to identify you when you visit our website and as you navigate our dashboard. Specifically, we use an HTTP-only, secure cookie to store your JWT (JSON Web Token) after you log in via Discord.</li>
            <li><strong>Security:</strong> We use cookies as an element of the security measures used to protect user accounts, including preventing fraudulent use of login credentials.</li>
            <li><strong>Preferences:</strong> We may use cookies to remember your preferences and settings.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">3. Types of cookies we use</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            <strong>Essential Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the website, you cannot refuse them without impacting how our site functions.
          </p>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            We currently <strong>do not</strong> use third-party tracking, advertising, or analytics cookies.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4 text-white">4. How can I control cookies?</h2>
          <p className="text-neutral-400 mb-6 leading-relaxed">
            You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website (like the Dashboard) will be restricted.
          </p>
        </div>
      </div>
    </Layout>
  );
}
