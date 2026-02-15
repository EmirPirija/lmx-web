"use client";

import Link from "next/link";
import { useSelector } from "react-redux";

import CustomImage from "../Common/CustomImage";
import CustomLink from "@/components/Common/CustomLink";
import { settingsData } from "@/redux/reducer/settingSlice";
import {
  BiPhoneCall,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaSquareXTwitter,
  RiMailSendFill,
  ShieldCheck,
  SlLocationPin,
  Video,
} from "@/components/Common/UnifiedIconPack";
import googleDownload from "../../public/assets/Google Download.png";
import appleDownload from "../../public/assets/iOS Download.png";

const FOOTER_PRIMARY_LINKS = [
  { href: "/about-us", label: "O nama" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact-us", label: "Kontakt" },
  { href: "/svi-korisnici", label: "Svi korisnici" },
];

const FOOTER_PLATFORM_LINKS = [
  { href: "/shop", label: "Pokreni LMX Shop" },
  { href: "/pro", label: "Postani PRO" },
  { href: "/my-ads", label: "Moji oglasi" },
  { href: "/ad-listing", label: "Objavi oglas" },
];

const FOOTER_SELLER_LINKS = [
  { href: "/my-ads", label: "Uredi aktivne oglase" },
  { href: "/profile/integrations", label: "Integracije (privremeno nedostupno)" },
  { href: "/profile/shop-ops", label: "Shop operacije" },
  { href: "/chat", label: "Poruke sa kupcima" },
];

const FOOTER_LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Politika privatnosti" },
  { href: "/data-deletion", label: "Brisanje podataka" },
  { href: "/terms-and-condition", label: "Uslovi korištenja" },
  { href: "/refund-policy", label: "Pravila povrata" },
];

export default function Footer() {
  const settings = useSelector(settingsData);
  const currentYear = new Date().getFullYear();

  const companyName = settings?.company_name || "LMX";
  const logoSrc = settings?.footer_logo || settings?.header_logo;
  const companyDescription =
    "LMX je marketplace za sigurnu, brzu i jednostavnu kupoprodaju. Objavite oglas, povežite se sa pravim kupcem i završite dogovor bez komplikacija.";

  const showGetInTouchSection =
    settings?.company_address ||
    settings?.company_email ||
    settings?.company_tel1 ||
    settings?.company_tel2;

  const showDownloadLinks = settings?.play_store_link && settings?.app_store_link;

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-gradient-to-b from-slate-50 via-white to-white text-slate-700 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-200">
      <div className="container py-10 md:py-12">
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 md:p-5">
          <div className="grid gap-2.5 md:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-200">
              <ShieldCheck size={15} className="text-emerald-500 dark:text-emerald-300" />
              Svi planovi su trenutno dostupni besplatno.
            </div>
            <CustomLink
              href="/ad-listing"
              className="flex items-center gap-2 rounded-xl border border-cyan-200/80 bg-cyan-50/80 px-3 py-2.5 text-xs font-medium text-cyan-800 transition-colors hover:bg-cyan-100/70 dark:border-cyan-700/60 dark:bg-cyan-900/20 dark:text-cyan-200 dark:hover:bg-cyan-900/30"
            >
              <Video size={15} className="text-cyan-500 dark:text-cyan-300" />
              Objavite oglas i pokrenite prodaju odmah.
            </CustomLink>
            <div className="flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/80 px-3 py-2.5 text-xs font-medium text-violet-800 dark:border-violet-700/60 dark:bg-violet-900/20 dark:text-violet-200">
              <ShieldCheck size={15} className="text-violet-500 dark:text-violet-300" />
              Bez obaveza i bez unosa kartice.
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/65 lg:col-span-5">
            <CustomLink href="/" className="inline-block">
              <CustomImage
                src={logoSrc}
                alt={companyName}
                width={195}
                height={52}
                className="h-[42px] w-auto object-contain"
              />
            </CustomLink>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {companyDescription}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                Kupac i prodavač dogovaraju uslove direktno, uz jasnu komunikaciju i dogovor.
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                LMX je platforma koja povezuje strane i pomaže transparentan proces kupoprodaje.
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {settings?.facebook_link && (
                <CustomLink
                  href={settings?.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <FaFacebook size={18} />
                </CustomLink>
              )}
              {settings?.instagram_link && (
                <CustomLink
                  href={settings?.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <FaInstagram size={18} />
                </CustomLink>
              )}
              {settings?.x_link && (
                <CustomLink
                  href={settings?.x_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <FaSquareXTwitter size={18} />
                </CustomLink>
              )}
              {settings?.linkedin_link && (
                <CustomLink
                  href={settings?.linkedin_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <FaLinkedin size={18} />
                </CustomLink>
              )}
              {settings?.pinterest_link && (
                <CustomLink
                  href={settings?.pinterest_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600"
                >
                  <FaPinterest size={18} />
                </CustomLink>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/65 lg:col-span-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              Navigacija
            </h3>
            <nav className="mt-3 space-y-2.5">
              {FOOTER_PRIMARY_LINKS.map((link) => (
                <CustomLink
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                >
                  {link.label}
                </CustomLink>
              ))}
            </nav>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              Platforma
            </h3>
            <nav className="mt-3 space-y-2.5">
              {FOOTER_PLATFORM_LINKS.map((link) => (
                <CustomLink
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                >
                  {link.label}
                </CustomLink>
              ))}
            </nav>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/65 lg:col-span-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              Za prodavače
            </h3>
            <nav className="mt-3 space-y-2.5">
              {FOOTER_SELLER_LINKS.map((link) => (
                <CustomLink
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                >
                  {link.label}
                </CustomLink>
              ))}
            </nav>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.1em] text-slate-900 dark:text-slate-100">
              Kontakt i podrška
            </h3>

            {showGetInTouchSection ? (
              <div className="mt-3 space-y-3.5">
                {settings?.company_address && (
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <SlLocationPin size={16} />
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {settings?.company_address}
                    </p>
                  </div>
                )}

                {settings?.company_email && (
                  <div className="flex items-start gap-2.5 items-center">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <RiMailSendFill size={16} />
                    </span>
                    <CustomLink
                      href={`mailto:${settings?.company_email}`}
                      className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                    >
                      {settings?.company_email}
                    </CustomLink>
                  </div>
                )}

                {/* {(settings?.company_tel1 || settings?.company_tel2) && (
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <BiPhoneCall size={16} />
                    </span>
                    <div className="flex flex-col gap-1">
                      {settings?.company_tel1 && (
                        <CustomLink
                          href={`tel:${settings?.company_tel1}`}
                          className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                        >
                          {settings?.company_tel1}
                        </CustomLink>
                      )}
                      {settings?.company_tel2 && (
                        <CustomLink
                          href={`tel:${settings?.company_tel2}`}
                          className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                        >
                          {settings?.company_tel2}
                        </CustomLink>
                      )}
                    </div>
                  </div>
                )} */}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Kontakt podaci će uskoro biti dostupni. Za podršku koristite stranicu Kontakt.
              </p>
            )}

            {showDownloadLinks && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Mobilna aplikacija
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={settings?.play_store_link} target="_blank" rel="noopener noreferrer">
                    <CustomImage
                      src={googleDownload}
                      alt="Google Play"
                      width={160}
                      height={56}
                      className="h-10 w-auto sm:h-11"
                    />
                  </Link>
                  <Link href={settings?.app_store_link} target="_blank" rel="noopener noreferrer">
                    <CustomImage
                      src={appleDownload}
                      alt="App Store"
                      width={160}
                      height={56}
                      className="h-10 w-auto sm:h-11"
                    />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {companyName} {currentYear}. Sva prava zadržana.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {FOOTER_LEGAL_LINKS.map((item) => (
                <CustomLink
                  key={item.href}
                  href={item.href}
                  className="text-xs text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
                >
                  {item.label}
                </CustomLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
