import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Initializing secure checkout...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const plan = searchParams.get('plan');
    const uid = searchParams.get('uid');
    const gid = searchParams.get('gid');

    if (!plan) {
      setError('Invalid checkout link. Missing plan parameter.');
      return;
    }

    const type = gid ? 'guild' : 'user';
    const targetId = gid || uid;

    const processCheckout = async () => {
      try {
        setStatus('Verifying authentication...');
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          // Store the current URL to redirect back after login
          sessionStorage.setItem('postLoginRedirect', window.location.pathname + window.location.search);
          window.location.href = '/api/auth/discord/url';
          return;
        }

        setStatus('Generating secure payment link...');
        const planId = type === 'user' ? `user_${plan}` : `guild_${plan}`;
        
        const res = await fetch('/api/billing/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            plan_id: planId, 
            target_type: type, 
            target_id: targetId 
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to initiate gateway.');
        }

        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        if (data.checkoutUrl) {
          setStatus('Redirecting to Razorpay...');
          window.location.href = data.checkoutUrl;
          return;
        }

        // Fallback to modal if short_url is missing
        // @ts-ignore
        const isRazorpayAvailable = typeof window !== 'undefined' && !!window.Razorpay;
        if (!isRazorpayAvailable) {
          throw new Error('Razorpay gateway is blocked by your browser. Please disable your ad-blocker.');
        }

        setStatus('Opening payment gateway...');
        const options = {
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: 'MailCord',
          description: `Upgrade to ${plan} plan`,
          handler: async function (response: any) {
            setStatus('Verifying payment...');
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                type,
                targetId
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              navigate('/dashboard?tab=billing');
            } else {
              setError('Verification failed: ' + (verifyData.error || 'Unknown error'));
            }
          },
          theme: { color: '#4f46e5' }
        };
        
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any){
          setError(`Payment Failed: ${response.error.description}`);
        });
        rzp.open();

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred during checkout.');
      }
    };

    processCheckout();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-6">MailCord Secure Checkout</h1>
        
        {error ? (
          <div className="text-red-400 bg-red-400/10 p-4 rounded-lg border border-red-400/20 mb-6">
            <p className="font-medium">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
