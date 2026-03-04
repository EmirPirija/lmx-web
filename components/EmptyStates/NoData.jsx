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
    compact={compact}
  />
);

export default NoData;
