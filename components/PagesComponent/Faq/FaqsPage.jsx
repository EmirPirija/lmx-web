"use client";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { t } from "@/utils";
import { useEffect, useState } from "react";
import { getFaqApi } from "@/utils/api";
import FaqCard from "./FaqCard";
import Layout from "@/components/Layout/Layout";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import PageLoader from "@/components/Common/PageLoader";
import Link from "next/link";

const FALLBACK_FAQS = [
  {
    id: "faq-1",
    question: "Kako objaviti oglas na LMX-u?",
    answer:
      "Nakon prijave klikni na “Novi oglas”, odaberi kategoriju, dodaj kvalitetne fotografije i jasan opis. Kada potvrdiš unos, oglas ide na objavu prema pravilima platforme.",
  },
  {
    id: "faq-2",
    question: "Koliko često mogu obnoviti poziciju oglasa?",
    answer:
      "Poziciju oglasa možeš obnoviti svakih 15 dana. Kada je obnova dostupna, opcija će biti aktivna u “Moji oglasi”.",
  },
  {
    id: "faq-3",
    question: "Šta znači “Izdvoji oglas”?",
    answer:
      "Izdvojeni oglas dobija bolju vidljivost na kategoriji, naslovnoj stranici ili na oba mjesta, zavisno od odabranog paketa.",
  },
  {
    id: "faq-4",
    question: "Kako da povećam šansu za bržu prodaju?",
    answer:
      "Koristi realnu cijenu, dodaj više kvalitetnih slika, napiši detaljan opis i redovno odgovaraj na poruke. Aktivan i ažuran oglas ostvaruje više pregleda.",
  },
  {
    id: "faq-5",
    question: "Kako kontaktirati podršku?",
    answer:
      "Podršku možeš kontaktirati putem stranice “Kontaktirajte nas”. Upiši ime, e-mail i poruku, a tim će ti odgovoriti u najkraćem roku.",
  },
];

const FaqsPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const CurrentLanguage = useSelector(CurrentLanguageData);

  useEffect(() => {
    fetchFaqs();
  }, [CurrentLanguage?.id]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await getFaqApi.getFaq();
      const incoming = Array.isArray(res?.data?.data) ? res.data.data : [];
      setFaqs(incoming);
    } catch (error) {
      console.log("error", error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const hasCmsFaqs = Array.isArray(faqs) && faqs.length > 0;
  const faqItems = hasCmsFaqs ? faqs : FALLBACK_FAQS;

  return (
    <Layout>
      <BreadCrumb title2={t("faqs")} />
      {loading ? (
        <PageLoader />
      ) : (
        <div className="container">
          <div className="mt-8 flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{t("faqs")}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Najčešća pitanja o objavi oglasa, obnovi, izdvajanjima i podršci.
              </p>
              {!hasCmsFaqs ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Trenutno prikazujemo preporučena pitanja dok se CMS sadržaj ne ažurira.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-4 md:gap-5">
              {faqItems.map((faq) => {
                return <FaqCard faq={faq} key={faq?.id} />;
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Nisi pronašao odgovor? Kontaktiraj naš tim preko stranice{" "}
              <Link href="/contact-us" className="font-semibold text-primary underline-offset-2 hover:underline">
                Kontakt
              </Link>
              .
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FaqsPage;
