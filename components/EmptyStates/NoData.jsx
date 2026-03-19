"use client";

import StateSurface from "@/components/Common/StateSurface";

const NoData = ({
  name = "rezultata",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  contentClassName,
  iconClassName,
  titleClassName,
  descriptionClassName,
  actionsClassName,
  primaryActionClassName,
  secondaryActionClassName,
  compact = false,
}) => {
  const normalizedName = String(name || "").trim();
  const lowerName = normalizedName.toLowerCase();
  const shouldPrefixNoData =
    Boolean(normalizedName) &&
    !lowerName.startsWith("nema ") &&
    !lowerName.startsWith("ovaj ") &&
    !lowerName.startsWith("ova ") &&
    !lowerName.startsWith("trenutno ");
  const resolvedTitle =
    title ||
    (normalizedName
      ? shouldPrefixNoData
        ? `Nema ${normalizedName}`
        : normalizedName
      : "Nema rezultata");

  return (
    <StateSurface
      variant="empty"
      title={resolvedTitle}
      description={
        description ||
        "Trenutno nema dostupnog sadržaja za ovaj prikaz. Prilagodite filtere ili pokušajte ponovo kasnije."
      }
      actionLabel={actionLabel}
      onAction={onAction}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={onSecondaryAction}
      className={className}
      contentClassName={contentClassName}
      iconClassName={iconClassName}
      titleClassName={titleClassName}
      descriptionClassName={descriptionClassName}
      actionsClassName={actionsClassName}
      primaryActionClassName={primaryActionClassName}
      secondaryActionClassName={secondaryActionClassName}
      compact={compact}
    />
  );
};

export default NoData;
