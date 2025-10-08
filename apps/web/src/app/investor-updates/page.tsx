'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import {
  Newspaper,
  Sparkles,
  Clipboard,
  Download,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SplitText from '@/components/SplitText';
import CountUp from '@/components/CountUp';
import { cn } from '@/lib/utils';
import MagicBento from '@/components/MagicBento';

// Mock data
const mockMetrics = {
  balance: 1000000,
  netCashFlow: 50000,
  burnRate: 100000,
  runway: 10,
  arr: 2500000,
  growthRate: 15,
};

const generateUpdateText = (metrics: typeof mockMetrics) => `
## Investor Update - ${new Date().toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
})}

Hi Team,

Here's a quick update on our progress and financial health.

### Key Metrics
- **ARR:** ${formatCurrency(metrics.arr)} (↑${metrics.growthRate}%)
- **Runway:** ${metrics.runway} months
- **Net Cash Flow (30d):** ${formatCurrency(metrics.netCashFlow)}
- **Monthly Burn:** ${formatCurrency(metrics.burnRate)}

### Highlights
- [Add a key highlight, e.g., "Landed our largest enterprise customer to date."]
- [Add another highlight, e.g., "Shipped version 2.0 of our main product."]

### Lowlights / Challenges
- [Add a challenge you're facing, e.g., "Hiring senior engineers has been slower than expected."]

### Asks
- [Add any asks for your investors, e.g., "Introductions to potential candidates for our Head of Sales role."]

Best,
[Your Name]
`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
  }).format(amount);

export default function InvestorUpdatesPage() {
  const [loading, setLoading] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setUpdateText(generateUpdateText(mockMetrics));
      setGenerating(false);
      toast.success('Investor update drafted!');
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(updateText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([updateText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investor-update-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const bentoItems = [
    {
      className: 'col-span-12',
      content: (
        <div className="p-6">
          <SplitText
            text="Investor Updates"
            tag="h1"
            className="text-3xl font-bold"
          />
          <p className="mt-1 text-muted-foreground">
            Auto-draft investor updates with your key metrics.
          </p>
        </div>
      ),
    },
    {
      className: 'col-span-12 lg:col-span-8',
      content: (
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              Draft Your Update
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="text-sm p-2 hover:bg-muted rounded-md flex items-center gap-1">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
                Copy
              </button>
               <button onClick={handleDownload} className="text-sm p-2 hover:bg-muted rounded-md flex items-center gap-1">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
          <textarea
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            rows={20}
            className="w-full h-full bg-transparent font-mono text-sm resize-none focus:outline-none"
            placeholder="Click 'Generate Update' to draft your investor update..."
          />
        </div>
      ),
    },
     {
      className: 'col-span-12 lg:col-span-4',
      content: (
        <div className="p-6">
          <button
              onClick={handleGenerate}
              disabled={generating}
              className={cn("w-full p-4 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2",
                "hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Update
                </>
              )}
            </button>
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">ARR</p>
                  <p className="font-bold text-lg">{formatCurrency(mockMetrics.arr)}</p>
                </div>
                 <div className="glass p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">Runway</p>
                  <p className="font-bold text-lg">{mockMetrics.runway} mo</p>
                </div>
                 <div className="glass p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                  <p className="font-bold text-lg">{formatCurrency(mockMetrics.netCashFlow)}</p>
                </div>
                 <div className="glass p-3 rounded-md">
                  <p className="text-xs text-muted-foreground">Burn Rate</p>
                  <p className="font-bold text-lg">{formatCurrency(mockMetrics.burnRate)}</p>
                </div>
              </div>
            </div>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <MagicBento />
      </MainLayout>
    </AuthGuard>
  );
}

