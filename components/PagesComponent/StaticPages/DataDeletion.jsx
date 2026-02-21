"use client";

import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Layout from "@/components/Layout/Layout";
import { settingsData } from "@/redux/reducer/settingSlice";
import { t } from "@/utils";
import { useSelector } from "react-redux";

const DataDeletion = () => {
  const settings = useSelector(settingsData);
  const supportEmail = settings?.company_email || "";

  return (
    <Layout>
      <BreadCrumb title2={"Brisanje podataka"} />
      <div className="container">
        <article className="max-w-full py-7 prose lg:prose-lg">
          <h2>Brisanje podataka</h2>
          <p>
            Korisnik ima pravo zatražiti brisanje svojih ličnih podataka i
            korisničkog naloga u bilo kojem trenutku.
          </p>

          <h3>Kako podnijeti zahtjev</h3>
          <ul>
            <li>
              Kroz opciju <strong>Obriši nalog</strong> unutar korisničkog
              profila.
            </li>
            <li>
              Putem stranice <a href="/contact-us">Kontakt</a>.
            </li>
            {supportEmail ? (
              <li>
                Slanjem e-maila na{" "}
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
              </li>
            ) : null}
          </ul>

          <h3>Rokovi obrade</h3>
          <p>
            Nakon potvrde zahtjeva, podaci naloga se brišu ili anonimiziraju u
            razumnom roku, najkasnije do 30 dana, osim gdje je zakonom
            propisano drugačije.
          </p>

          <h3>Izuzeci</h3>
          <p>
            Određeni podaci, poput evidencije transakcija, sigurnosnih logova i
            podataka nužnih za ispunjavanje pravnih obaveza, mogu se čuvati
            duže isključivo u skladu sa zakonskim propisima.
          </p>

          <h3>Šta se dešava nakon brisanja</h3>
          <p>
            Nakon brisanja naloga, pristup korisničkom profilu se ukida, a javno
            prikazani sadržaj se uklanja ili anonimizira prema tehničkim i
            pravnim mogućnostima sistema.
          </p>
        </article>
      </div>
    </Layout>
  );
};

export default DataDeletion;
