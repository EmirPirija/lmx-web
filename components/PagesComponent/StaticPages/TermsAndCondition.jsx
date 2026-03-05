"use client";
import { settingsData } from "@/redux/reducer/settingSlice";
import { useSelector } from "react-redux";
import parse from "html-react-parser";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { t } from "@/utils";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

const TermsAndCondition = () => {
  const settings = useSelector(settingsData);
  const termsAndCondition = settings?.terms_conditions;

  return (
    <Layout>
      <BreadCrumb title2={"Uslovi i odredbe"} />
      <div className="container">
        <div className="max-w-full prose lg:prose-lg py-7">
          {parse(sanitizeHtml(termsAndCondition || ""))}
        </div>
      </div>
    </Layout>
  );
};

export default TermsAndCondition;
