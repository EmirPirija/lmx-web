"use client";

import SellerSettings from "@/components/Profile/SellerSettings";
import SellerAreaTabs from "@/components/Profile/SellerAreaTabs";

export default function SellerSettingsPage() {
  return (
    <div className="space-y-6">
      <SellerAreaTabs />
      <SellerSettings />
    </div>
  );
}