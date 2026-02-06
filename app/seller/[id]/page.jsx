"use client";

import Seller from "@/components/PagesComponent/Seller/Seller";
import { useSearchParams } from "next/navigation";

export default function SellerPage({ params }) {
  const searchParams = useSearchParams();
  
  // Convert searchParams to plain object for the component
  const searchParamsObj = {};
  searchParams.forEach((value, key) => {
    searchParamsObj[key] = value;
  });

  return <Seller id={params.id} searchParams={searchParamsObj} />;
}