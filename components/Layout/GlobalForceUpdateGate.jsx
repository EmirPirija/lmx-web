"use client";

import { settingsData, getIsForceUpdateMode } from "@/redux/reducer/settingSlice";
import { useSelector } from "react-redux";

export default function GlobalForceUpdateGate() {
  const settings = useSelector(settingsData);
  const forceUpdate = useSelector(getIsForceUpdateMode);

  if (!forceUpdate) return null;

  const companyName = settings?.company_name || "LMX";
  const appStoreLink = settings?.app_store_link || "";
  const playStoreLink = settings?.play_store_link || "";
  const link = appStoreLink || playStoreLink;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-[#08101fcc]/95 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[#0e1830] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <h2 className="text-2xl font-semibold tracking-tight">Aplikacija zahtijeva ažuriranje</h2>
        <p className="mt-3 text-sm text-[#d2dbef]">
          Admin je aktivirao obavezni update. Nastavak korištenja je moguć tek nakon ažuriranja aplikacije.
        </p>
        {link ? (
          <a
            href={link}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#20c9c2] px-4 py-3 text-sm font-semibold text-[#05252a] transition hover:bg-[#29d8d1]"
          >
            Preuzmi najnoviju verziju {companyName} aplikacije
          </a>
        ) : (
          <p className="mt-5 rounded-xl border border-white/20 px-4 py-3 text-sm text-[#d2dbef]">
            Link za ažuriranje trenutno nije konfigurisan u admin panelu.
          </p>
        )}
      </div>
    </div>
  );
}
