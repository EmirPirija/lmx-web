const toLowerTrimmed = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const toBool = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  const normalized = toLowerTrimmed(value);
  return normalized === "true" || normalized === "yes";
};

export const normalizeVerificationStatus = (value) => {
  const status = toLowerTrimmed(value);

  if (!status) return "not-applied";
  if (status === "not applied" || status === "not_applied" || status === "none") {
    return "not-applied";
  }
  if (status === "submitted" || status === "resubmitted") {
    return "pending";
  }

  return status;
};

export const getVerificationStatusFromApiResponse = (response) => {
  const status =
    response?.data?.data?.status ??
    response?.data?.status ??
    response?.verification_status ??
    response?.verificationStatus;

  return normalizeVerificationStatus(status);
};

export const isUserMarkedVerified = (userData) => {
  if (!userData) return false;

  const candidateStatuses = [
    userData?.verification_status,
    userData?.verificationStatus,
    userData?.status,
  ].map(normalizeVerificationStatus);

  if (candidateStatuses.includes("approved")) return true;

  return (
    toBool(userData?.is_verified) ||
    toBool(userData?.verified) ||
    toBool(userData?.is_verified_status) ||
    toBool(userData?.isVerified)
  );
};

export const resolveVerificationState = ({ verificationResponse, userData, previousStatus = "" }) => {
  const apiStatus = getVerificationStatusFromApiResponse(verificationResponse);
  const previous = normalizeVerificationStatus(previousStatus);
  const userMarkedVerified = isUserMarkedVerified(userData);

  const hasApiResponse =
    verificationResponse !== undefined &&
    verificationResponse !== null &&
    apiStatus !== "not-applied";

  const verificationStatus = hasApiResponse
    ? apiStatus
    : userMarkedVerified
    ? "approved"
    : previous || "not-applied";

  const isVerified = hasApiResponse
    ? verificationStatus === "approved"
    : verificationStatus === "approved" || userMarkedVerified;

  return { verificationStatus, isVerified };
};
