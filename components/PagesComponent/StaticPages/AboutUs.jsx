"use client";
import Layout from "@/components/Layout/Layout";
import { getAboutUs } from "@/redux/reducer/settingSlice";
import parse from "html-react-parser";
import { useSelector } from "react-redux";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { t } from "@/utils";

const FALLBACK_ABOUT_US_HTML = `
  <section>
    <h2>Ko smo mi</h2>
    <p>LMX je moderna platforma za kupovinu i prodaju oglasa u BiH, kreirana da poveže ljude brzo, sigurno i transparentno.</p>
  </section>
  <section>
    <h2>Naša misija</h2>
    <p>Želimo da svaki korisnik može jednostavno objaviti kvalitetan oglas, pronaći tačno ono što traži i ostvariti poštenu komunikaciju bez nepotrebnih prepreka.</p>
  </section>
  <section>
    <h2>Šta nudimo</h2>
    <ul>
      <li>Brzu objavu oglasa kroz jasan i jednostavan proces.</li>
      <li>Pametne alate za vidljivost, uključujući izdvajanje oglasa.</li>
      <li>Pregledan prikaz prodavača, statistike i sigurnije iskustvo kupovine.</li>
      <li>Podršku koja prati korisnika od prvog oglasa do uspješne prodaje.</li>
    </ul>
  </section>
  <section>
    <h2>Naše vrijednosti</h2>
    <p>Povjerenje, kvalitet sadržaja i stabilno korisničko iskustvo su osnova na kojoj gradimo LMX svakog dana.</p>
  </section>
`;

const AboutUs = () => {
  const aboutUs = useSelector(getAboutUs);
  const content = aboutUs && String(aboutUs).trim() ? aboutUs : FALLBACK_ABOUT_US_HTML;
  const isFallback = content === FALLBACK_ABOUT_US_HTML;

  return (
    <Layout>
      <BreadCrumb title2={"O nama"} />
      <div className="container">
        <div className="py-7">
          {isFallback ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              Trenutno je prikazan preporučeni sadržaj dok CMS “O nama” tekst ne bude ažuriran.
            </p>
          ) : null}
          <article className="prose max-w-none prose-slate lg:prose-lg dark:prose-invert">
            {parse(content)}
          </article>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
