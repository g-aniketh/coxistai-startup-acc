'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const UpgradeCard = () => {
  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-[#B7B3E6] text-white p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-xl font-semibold">AI CFO Pro</h3>
        </div>
        <p className="text-sm opacity-80 mt-1">
          Advanced AI insights, forecasting & investor updates
        </p>
      </div>
      <Button 
        className="bg-white text-[#6D28D9] font-bold hover:bg-gray-100 w-full mt-4"
      >
        Upgrade Now
      </Button>
    </Card>
  );
};

export default UpgradeCard;
