import {
  isSellerVerified,
  resolveSellerVerificationModel,
} from "@/lib/seller-verification";

const toLowerTrimmed = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
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
  return isSellerVerified(userData);
};

export const resolveVerificationState = ({
  verificationResponse,
  userData,
  previousStatus = "",
}) => {
  const apiStatus = getVerificationStatusFromApiResponse(verificationResponse);
  const previous = normalizeVerificationStatus(previousStatus);
  const verificationModel = resolveSellerVerificationModel(userData);
  const userMarkedVerified = verificationModel.isVerified;

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

  return {
    verificationStatus,
    isVerified,
    source: verificationModel.reason || "unknown",
    confidence: verificationModel.confidence || "low",
  };
};
