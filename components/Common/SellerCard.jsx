import { cn } from "@/lib/utils";
import { MdVerified } from "react-icons/md";

const SellerCard = ({
  avatarNode,
  name,
  isVerified,
  badgeNodes,
  isPro,
  isShop,
  joinDate,
  responseTimeText,
  showBusinessHours,
  todayHoursText,
  currentlyOpen,
  vacationMode,
  vacationMessage,
  actions,
  contacts,
  profileLink,
  shareNode,
}) => {
  const hasBadges = Array.isArray(badgeNodes) && badgeNodes.length > 0;
  const showActions = Array.isArray(actions) ? actions.length > 0 : Boolean(actions);
  const showContacts = Array.isArray(contacts) ? contacts.length > 0 : Boolean(contacts);

  return (
    <div
      data-seller-card
      className={cn(
        "bg-white/95 dark:bg-slate-900 rounded-2xl border border-slate-100/80 dark:border-slate-800 shadow-sm overflow-hidden relative",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg"
      )}
    >
      <div className="h-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 w-full absolute top-0 left-0 z-0 border-b border-slate-100/80 dark:border-slate-800" />

      {shareNode && <div className="absolute top-3 right-3 z-10">{shareNode}</div>}

      <div className="relative z-10 px-5 pt-6 pb-5">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative mb-3">
            <div className="p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
              {avatarNode}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{name || "Prodavač"}</h3>
            {Boolean(isVerified) && <MdVerified className="text-primary text-xl" title="Verificiran" />}
          </div>

          {(isPro || isShop) && (
            <div className="mt-2 flex items-center gap-2">
              {isShop ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/20">
                  Shop
                </span>
              ) : null}
              {isPro ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                  Pro
                </span>
              ) : null}
            </div>
          )}

          {hasBadges && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {badgeNodes.map((badgeNode, index) => (
                <div
                  key={`badge-${index}`}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-1"
                >
                  {badgeNode}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-left">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                <span className="text-xs font-semibold">Član od</span>
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{joinDate || "—"}</div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-left">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                <span className="text-xs font-semibold">Vrijeme odgovora</span>
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{responseTimeText || "—"}</div>
            </div>
          </div>

          {showBusinessHours && (
            <div className="mt-2 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="text-sm font-bold">Radno vrijeme</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{todayHoursText || "—"}</div>
                </div>
                {currentlyOpen !== null && (
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      currentlyOpen
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    )}
                  >
                    {currentlyOpen ? "Otvoreno" : "Zatvoreno"}
                  </span>
                )}
              </div>
            </div>
          )}

          {vacationMode && (
            <div className="mt-3 w-full rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-left">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <span className="text-sm font-bold">Na odmoru</span>
              </div>
              <div className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">{vacationMessage}</div>
            </div>
          )}

          {showActions && <div className="mt-4 w-full grid grid-cols-1 gap-2">{actions}</div>}

          {showContacts && <div className="mt-4 flex items-center justify-center gap-2">{contacts}</div>}

          {profileLink && <div className="mt-4">{profileLink}</div>}
        </div>
      </div>
    </div>
  );
};

export default SellerCard;
