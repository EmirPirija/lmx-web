import CustomLink from "@/components/Common/CustomLink";

const TermsAndPrivacyLinks = ({ t, settings, OnHide }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-center text-xs leading-relaxed text-slate-500">
      {t("agreeSignIn")}{" "}
      <span className="font-semibold text-slate-700">
        {settings?.company_name}
      </span>{" "}
      <CustomLink
        href="/terms-and-condition"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {t("termsService")}
      </CustomLink>{" "}
      {t("and")}{" "}
      <CustomLink
        href="/privacy-policy"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {t("privacyPolicy")}
      </CustomLink>{" "}
      {t("and")}{" "}
      <CustomLink
        href="/data-deletion"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {t("dataDeletionPolicy")}
      </CustomLink>
    </div>
  );
};

export default TermsAndPrivacyLinks;
