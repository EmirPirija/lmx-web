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
}) => (
  <StateSurface
    variant="empty"
    title={title || `Nema ${name}`}
    description={
      description ||
      "Trenutno nema sadržaja za prikaz. Prilagodi filtere ili pokušaj ponovo kasnije."
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

export default NoData;
