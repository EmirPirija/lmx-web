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
  const resolvedTitle = title || (normalizedName.toLowerCase().startsWith("nema ") ? normalizedName : `Nema ${normalizedName}`);

  return (
    <StateSurface
      variant="empty"
      title={resolvedTitle}
      description={
        description ||
        "Trenutno nema sadržaja za prikaz. Prilagodite filtere ili pokušajte ponovo kasnije."
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
