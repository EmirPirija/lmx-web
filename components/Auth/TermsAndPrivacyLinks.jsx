import CustomLink from "@/components/Common/CustomLink";

const TermsAndPrivacyLinks = ({ t, settings, OnHide }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
      {t("agreeSignIn")} {settings?.company_name} <br />
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
      </CustomLink>
    </div>
  );
};

export default TermsAndPrivacyLinks;
