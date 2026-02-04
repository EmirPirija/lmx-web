"use client";

import SellerDashboard from "@/components/Profile/SellerDashboard";
import SellerAreaTabs from "@/components/Profile/SellerAreaTabs";

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6">
      <SellerAreaTabs />
      <SellerDashboard />
    </div>
  );
}
