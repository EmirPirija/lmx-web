"use client";
import dynamic from "next/dynamic";
import Checkauth from "@/HOC/Checkauth";
import Layout from "@/components/Layout/Layout";
 
const MyPurchases = dynamic(
  () => import("@/components/PagesComponent/Purchases/MyPurchases"),
  { ssr: false }
);
 
const PurchasesPage = () => {
  return (
    <Layout>
      <MyPurchases />
    </Layout>
  );
};
 
export default Checkauth(PurchasesPage);
