"use client";
import dynamic from "next/dynamic";
import Checkauth from "@/HOC/Checkauth";
 
const MyPurchases = dynamic(
  () => import("@/components/PagesComponent/Purchases/MyPurchases"),
  { ssr: false }
);
 
const PurchasesPage = () => {
  return <MyPurchases />;
};
 
export default Checkauth(PurchasesPage);