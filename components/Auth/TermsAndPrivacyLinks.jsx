import CustomLink from "@/components/Common/CustomLink";

const TermsAndPrivacyLinks = ({ settings, OnHide }) => {
  return (
    <div className="rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-center text-xs leading-relaxed text-muted-foreground">
      {"Nastavkom pristaješ na"}{" "}
      <span className="font-semibold text-foreground">
        {settings?.company_name}
      </span>{" "}
      <CustomLink
        href="/terms-and-condition"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {"Uslove korištenja"}
      </CustomLink>{" "}
      {"i"}{" "}
      <CustomLink
        href="/privacy-policy"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {"Politiku privatnosti"}
      </CustomLink>{" "}
      {"i"}{" "}
      <CustomLink
        href="/data-deletion"
        className="text-primary underline font-semibold"
        onClick={OnHide}
      >
        {"Brisanje podataka"}
      </CustomLink>
    </div>
  );
};

export default TermsAndPrivacyLinks;
