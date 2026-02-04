"use client";

import Chat from "@/components/PagesComponent/Chat/Chat";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";

function ChatPageContent() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Chat />
      </div>
    </Layout>
  );
}

const AuthenticatedChat = Checkauth(ChatPageContent);

export default function ChatPage() {
  return <AuthenticatedChat />;
}
