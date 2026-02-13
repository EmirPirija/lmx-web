"use client";
import CommonMembershipBadge from "@/components/Common/MembershipBadge";

const MembershipBadge = ({
  tier,
  size = "sm",
  showLabel = true,
  className = "",
  uppercase = false,
}) => (
  <CommonMembershipBadge
    tier={tier}
    size={size}
    showLabel={showLabel}
    uppercase={uppercase}
    className={className}
  />
);

export default MembershipBadge;
