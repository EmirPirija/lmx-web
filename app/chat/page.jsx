"use client";

import Chat from "@/components/PagesComponent/Chat/Chat";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";

function ChatPageContent() {
  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1720px] px-3 py-5 sm:px-4 sm:py-6 lg:px-6">
        <Chat />
      </div>
    </Layout>
  );
}

const AuthenticatedChat = Checkauth(ChatPageContent);

export default function ChatPage() {
  return <AuthenticatedChat />;
}
