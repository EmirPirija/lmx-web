"use client";

import React from "react";
import {
  MdOutlinePerson,
  MdCameraAlt,
  MdOutlineLocationOn,
  MdLockOutline,
  MdNotificationsNone,
  MdVerifiedUser,
  MdStorefront,
} from "react-icons/md";

const TABS = [
  { id: "user", label: "Korisničke informacije", icon: MdOutlinePerson },
  { id: "photo", label: "Profilna slika", icon: MdCameraAlt },
  { id: "location", label: "Lokacija", icon: MdOutlineLocationOn },
  { id: "privacy", label: "Privatnost", icon: MdLockOutline },
  { id: "notifications", label: "Notifikacije", icon: MdNotificationsNone },
  { id: "verification", label: "Verifikacija", icon: MdVerifiedUser },
  { id: "seller", label: "Postavke prodavača", icon: MdStorefront },
];

export default function ProfileSettingsMenu({
  activeTab,
  onChange,
  className = "",
}) {
  return (
    <div className={className}>
      {/* Mobile: select */}
      <div className="lg:hidden mb-4">
        <label className="text-sm font-medium text-gray-700">
          Odaberite sekciju
        </label>
        <select
          value={activeTab}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full border rounded-lg px-3 py-2 bg-white"
        >
          {TABS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: menu */}
      <div className="hidden lg:block bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-4 border-b bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900">Postavke</h2>
          <p className="text-xs text-gray-500 mt-1">
            Brzo pronađite i uredite ono što vam treba.
          </p>
        </div>

        <nav className="p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                <Icon size={18} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
