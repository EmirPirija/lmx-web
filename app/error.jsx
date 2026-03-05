"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/components/Common/useNavigate";

export default function Error({ error }) {
  const { navigate } = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.error(error);
    setMounted(true);
  }, [error]);

  const navigateHome = () => {
    navigate("/");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Background doodle pattern matching LMX style */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2337b5aa' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M20 12 L26 6 L32 12'/%3E%3Crect x='70' y='6' width='12' height='16' rx='2'/%3E%3Ccircle cx='115' cy='14' r='7'/%3E%3Cpath d='M12 65 L18 52 L24 65'/%3E%3Cpath d='M62 58 L74 58 M68 52 L68 64'/%3E%3Crect x='102' y='56' width='16' height='12' rx='2'/%3E%3Cpath d='M18 110 Q24 98 30 110'/%3E%3Ccircle cx='72' cy='112' r='6'/%3E%3Cpath d='M108 106 L114 118 L120 106'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center gap-6 px-6 py-16 max-w-sm w-full transition-all duration-500 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Icon in circle — matches LMX category icon style */}
        <div
          className={`transition-all duration-500 delay-100 ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <div className="w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100">
            <div className="w-[68px] h-[68px] rounded-full bg-[#eef9f8] flex items-center justify-center">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="#37b5aa"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  fill="#eef9f8"
                />
                <path
                  d="M12 9.5V13.5"
                  stroke="#37b5aa"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="17" r="1" fill="#37b5aa" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <div
          className={`text-center space-y-2 transition-all duration-500 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <h3 className="text-[20px] font-bold text-gray-800">
            Ups, desila se greška
          </h3>
          <p className="text-[14px] text-gray-500 leading-relaxed">
            Nešto nije kako treba, ali radimo na tome.
            <br />
            Probaj ponovo ili se vrati na početnu stranicu.
          </p>
        </div>

        {/* Buttons — LMX rounded pill style */}
        <div
          className={`flex flex-col gap-2.5 w-full max-w-[260px] transition-all duration-500 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <button
            onClick={navigateHome}
            className="w-full h-[44px] rounded-full text-[14px] font-semibold text-white bg-[#37b5aa] transition-all duration-200 hover:bg-[#2ea89d] hover:shadow-md active:scale-[0.98]"
          >
            ← Nazad na početnu
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-[44px] rounded-full text-[14px] font-semibold text-gray-600 bg-white border border-gray-200 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
          >
            Učitaj ponovo
          </button>
        </div>

        {/* Support link */}
        <p
          className={`text-[12px] text-gray-400 transition-all duration-500 [transition-delay:400ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          Greška se ponavlja?{" "}
          <a
            href="mailto:podrska@lmx.ba"
            className="text-[#37b5aa] hover:underline underline-offset-2"
          >
            Javi nam se
          </a>
        </p>
      </div>
    </div>
  );
}
