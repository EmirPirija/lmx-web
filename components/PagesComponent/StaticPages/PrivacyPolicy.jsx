"use client";

import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Layout from "@/components/Layout/Layout";
import { settingsData } from "@/redux/reducer/settingSlice";
import { t } from "@/utils";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

const PrivacyPolicy = () => {
  const settings = useSelector(settingsData);
  const privacy = settings?.privacy_policy;

  return (
    <Layout>
      <BreadCrumb title2={t("privacyPolicy")} />
      <div className="container">
        <div className="max-w-full py-7 prose lg:prose-lg">
          {parse(privacy || "")}
          <hr />
          <h2>Brisanje podataka</h2>
          <p>
            Korisnik ima pravo zatražiti brisanje svojih ličnih podataka i
            korisničkog naloga u bilo kojem trenutku.
          </p>
          <ul>
            <li>
              Zahtjev za brisanje možeš poslati kroz opciju <strong>Obriši
              nalog</strong> u profilu ili putem stranice{" "}
              <a href="/contact-us">Kontaktirajte nas</a>.
            </li>
            <li>
              Nakon potvrde zahtjeva, podaci naloga se brišu ili anonimiziraju u
              razumnom roku, najkasnije do 30 dana, osim gdje je zakonom
              propisano drugačije.
            </li>
            <li>
              Određeni podaci (npr. zapisi o transakcijama, sigurnosni logovi i
              podaci potrebni radi pravnih obaveza) mogu se čuvati duže, isključivo
              u skladu sa zakonskim propisima.
            </li>
            <li>
              Nakon brisanja naloga, pristup korisničkom profilu se ukida, a
              javno prikazani sadržaj se uklanja ili anonimizira prema tehničkim
              i pravnim mogućnostima sistema.
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
