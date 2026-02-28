export const PHONE_NOT_REGISTERED_CODE = 104;
export const PHONE_ALREADY_REGISTERED_CODE = 108;

export const isPhoneNotRegisteredError = (errorLike) => {
  const apiCode = Number(
    errorLike?.apiCode ??
      errorLike?.response?.data?.code ??
      errorLike?.code ??
      0,
  );

  const reason = String(
    errorLike?.apiReason ??
      errorLike?.response?.data?.data?.reason ??
      errorLike?.data?.reason ??
      "",
  ).toLowerCase();

  const rawMessage = String(
    errorLike?.response?.data?.message ||
      errorLike?.message ||
      errorLike?.data?.message ||
      "",
  ).toLowerCase();

  return (
    apiCode === PHONE_NOT_REGISTERED_CODE ||
    reason === "phone_not_registered" ||
    rawMessage.includes("nije registrovan") ||
    rawMessage.includes("not registered")
  );
};

export const isPhoneAlreadyRegisteredError = (errorLike) => {
  const apiCode = Number(
    errorLike?.apiCode ??
      errorLike?.response?.data?.code ??
      errorLike?.code ??
      0,
  );

  const reason = String(
    errorLike?.apiReason ??
      errorLike?.response?.data?.data?.reason ??
      errorLike?.data?.reason ??
      "",
  ).toLowerCase();

  const rawMessage = String(
    errorLike?.response?.data?.message ||
      errorLike?.message ||
      errorLike?.data?.message ||
      "",
  ).toLowerCase();

  return (
    apiCode === PHONE_ALREADY_REGISTERED_CODE ||
    reason === "phone_already_registered" ||
    rawMessage.includes("već registrovan") ||
    rawMessage.includes("already registered")
  );
};
