const toNumber = (value) => Number(value) || 0;

export const getBosnianCountForm = (value, one, few, many) => {
  const n = Math.abs(toNumber(value));
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const capitalizeFirst = (value = "") => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatRelativeTimeBs = (
  dateInput,
  {
    prefix = "prije",
    nowLabel = "upravo sada",
    capitalize = false,
  } = {}
) => {
  if (!dateInput) return "";

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffInSeconds < 60) {
    return capitalize ? capitalizeFirst(nowLabel) : nowLabel;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    const value = `${prefix} ${diffInMinutes} ${getBosnianCountForm(diffInMinutes, "minutu", "minute", "minuta")}`;
    return capitalize ? capitalizeFirst(value) : value;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    const value = `${prefix} ${diffInHours} ${getBosnianCountForm(diffInHours, "sat", "sata", "sati")}`;
    return capitalize ? capitalizeFirst(value) : value;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    const value = `${prefix} ${diffInDays} ${getBosnianCountForm(diffInDays, "dan", "dana", "dana")}`;
    return capitalize ? capitalizeFirst(value) : value;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    const value = `${prefix} ${diffInMonths} ${getBosnianCountForm(diffInMonths, "mjesec", "mjeseca", "mjeseci")}`;
    return capitalize ? capitalizeFirst(value) : value;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  const value = `${prefix} ${diffInYears} ${getBosnianCountForm(diffInYears, "godinu", "godine", "godina")}`;
  return capitalize ? capitalizeFirst(value) : value;
};
