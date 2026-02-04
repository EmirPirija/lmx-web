"use client";

import Layout from "@/components/Layout/Layout";
import ProfileLayout from "@/components/Profile/ProfileLayout";
import Checkauth from "@/HOC/Checkauth";

function ProfilePageLayout({ children }) {
  return (
    <Layout>
      <ProfileLayout>{children}</ProfileLayout>
    </Layout>
  );
}

// Wrap with authentication check
const AuthenticatedProfileLayout = Checkauth(ProfilePageLayout);

export default function ProfileRootLayout({ children }) {
  return <AuthenticatedProfileLayout>{children}</AuthenticatedProfileLayout>;
}