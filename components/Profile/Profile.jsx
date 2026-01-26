"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";

import {
  MdInfoOutline,
  MdCheckCircle,
  MdWarningAmber,
  MdVerifiedUser,
} from "react-icons/md";

import BiHLocationSelector from "@/components/Common/BiHLocationSelector";
import CustomLink from "@/components/Common/CustomLink";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";
import ProfileSettingsMenu from "./ProfileSettingsMenu";

import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Button, buttonVariants } from "../ui/button";

import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";

import {
  getUserInfoApi,
  getVerificationStatusApi,
  updateProfileApi,
  sellerSettingsApi,
} from "@/utils/api";

import { useUserLocation } from "@/hooks/useUserLocation";

/** Avatar renderer:
 *  - ako ima upload sliku → pokaži
 *  - ako nema → LMX SVG avatar po avatarId
 */
function SellerAvatar({ customAvatarUrl, avatarId, className = "" }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  if (showImg) {
    return (
      <img
        src={customAvatarUrl}
        alt="Avatar"
        className={`w-full h-full rounded-full object-cover ${className}`}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full rounded-full bg-white flex items-center justify-center text-primary ${className}`}
    >
      <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-16 h-16" />
    </div>
  );
}

const INFO_TEXT = {
  user: {
    title: "Za sigurnu i uspješnu kupoprodaju",
    body:
      "Važno je da su vaši podaci ažurirani. Provjerite e-mail i broj telefona koji koristite. " +
      "Preporučujemo jaču šifru i verifikaciju profila.",
  },
  location: {
    title: "Lokacija pomaže kupcima",
    body:
      "Tačna lokacija povećava povjerenje i olakšava dogovor oko preuzimanja. " +
      "Odaberite entitet, regiju i grad/općinu.",
  },
  privacy: {
    title: "Kontrola privatnosti",
    body:
      "Vi birate šta je javno. Ako isključite prikaz kontakta, kupci vas i dalje mogu kontaktirati porukom.",
  },
  notifications: {
    title: "Budite u toku",
    body:
      "Uključite obavijesti da ne propustite poruke, ponude i bitne promjene na računu.",
  },
  verification: {
    title: "Verifikacija povećava povjerenje",
    body:
      "Verifikovani profili imaju veću stopu uspješnih dogovora. Proces je brz i jasan.",
  },
  photo: {
    title: "Profilna slika",
    body:
      "Jasna slika (ili avatar) pomaže da profil izgleda ozbiljnije i pouzdanije.",
  },
  seller: {
    title: "Postavke prodavača",
    body:
      "Uredite opcije prodaje, prikaz profila i dodatne seller postavke na jednom mjestu.",
  },
};

export default function Profile() {
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  const [activeTab, setActiveTab] = useState("user");

  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01");

  const [isSaving, setIsSaving] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [VerificationStatus, setVerificationStatus] = useState("");
  const [RejectionReason, setRejectionReason] = useState("");

  // BiH lokacija (localStorage hook)
  const { userLocation, saveLocation } = useUserLocation();
  const [bihLocation, setBihLocation] = useState({
    entityId: null,
    regionId: null,
    municipalityId: null,
    address: "",
    formattedAddress: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notification: 1,
    show_personal_details: 0,
    region_code: "",
    country_code: "",
  });

  // keep a snapshot da možemo pametno gasiti/upaliti "Sačuvaj"
  const initialSnapshotRef = useRef(null);

  useEffect(() => {
    if (userLocation?.municipalityId) setBihLocation(userLocation);
  }, [userLocation]);

  const infoBox = INFO_TEXT[activeTab] || INFO_TEXT.user;

  const getVerificationProgress = async () => {
    try {
      const res = await getVerificationStatusApi.getVerificationStatus();
      if (res?.data?.error === true) {
        setVerificationStatus("not applied");
      } else {
        setVerificationStatus(res?.data?.data?.status);
        setRejectionReason(res?.data?.data?.rejection_reason);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getUserDetails = async () => {
    try {
      const res = await getUserInfoApi.getUserInfo();
      if (res?.data?.error === false) {
        const d = res?.data?.data;

        const region = (
          d?.region_code ||
          process.env.NEXT_PUBLIC_DEFAULT_COUNTRY ||
          "in"
        ).toLowerCase();

        const countryCode = d?.country_code?.replace("+", "") || "91";

        const nextForm = {
          name: d?.name || "",
          email: d?.email || "",
          phone: d?.mobile || "",
          address: d?.address || "",
          notification: d?.notification,
          show_personal_details: Number(d?.show_personal_details),
          region_code: region,
          country_code: countryCode,
        };

        setFormData(nextForm);
        setProfileImage(d?.profile || placeholder_image);

        // snapshot za isDirty
        initialSnapshotRef.current = {
          formData: nextForm,
          bihLocation: userLocation || null,
          hasFile: false,
        };
        setIsDirty(false);

        const currentFcmId = UserData?.fcm_id;
        if (!d?.fcm_id && currentFcmId) {
          loadUpdateUserData({ ...d, fcm_id: currentFcmId });
        } else {
          loadUpdateUserData(d);
        }
      } else {
        toast.error("Greška pri učitavanju podataka: " + res?.data?.message);
      }
    } catch (error) {
      console.log("Greška pri dohvatanju informacija:", error);
      toast.error("Nije moguće učitati podatke o korisniku.");
    }
  };

  const getSellerSettings = async () => {
    try {
      const res = await sellerSettingsApi.getSettings();
      if (res?.data?.error === false && res?.data?.data) {
        setSellerAvatarId(res.data.data.avatar_id || "lmx-01");
      }
    } catch (e) {
      // silent fallback
    }
  };

  useEffect(() => {
    if (!IsLoggedIn) return;
    const fetchData = async () => {
      setIsPending(true);
      await Promise.all([getVerificationProgress(), getUserDetails(), getSellerSettings()]);
      setIsPending(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- helpers ---
  const markDirty = () => setIsDirty(true);

  const handleChange = (e) => {
    markDirty();
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handlePhoneChange = (value, data) => {
    markDirty();
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";
    const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;
    setFormData((prev) => ({
      ...prev,
      phone: pureMobile,
      country_code: dial,
      region_code: iso2,
    }));
  };

  const handleSwitchChange = (id) => {
    markDirty();
    const newVal = formData[id] === 1 ? 0 : 1;
    setFormData((prev) => ({ ...prev, [id]: newVal }));

    if (id === "notification") {
      toast.info(newVal === 1 ? "Obavijesti su uključene." : "Obavijesti su isključene.");
    } else {
      toast.info(newVal === 1 ? "Kontakt podaci su sada vidljivi." : "Kontakt podaci su sada skriveni.");
    }
  };

  const fileInputId = useMemo(() => "profile_image_input", []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Slika je prevelika. Molimo odaberite sliku manju od 5MB.");
      return;
    }

    markDirty();
    setProfileFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result);
      toast.success("Slika profila je odabrana. Kliknite 'Sačuvaj' da primijenite izmjene.");
    };
    reader.readAsDataURL(file);
  };

  const renderVerificationBadge = () => {
    const badgeBase =
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border";
    switch (VerificationStatus) {
      case "approved":
        return (
          <div className={`${badgeBase} bg-green-50 text-green-700 border-green-200`}>
            <MdVerifiedUser size={14} /> <span>Verifikovan</span>
          </div>
        );
      case "not applied":
        return (
          <CustomLink
            href="/user-verification"
            className={`${buttonVariants({ variant: "outline", size: "sm" })} text-xs h-7`}
          >
            Verifikuj se
          </CustomLink>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-start gap-2">
            <div className={`${badgeBase} bg-red-50 text-red-700 border-red-200`}>
              <MdWarningAmber size={14} /> <span>Odbijen</span>
            </div>
            {RejectionReason && (
              <span className="text-xs text-red-600">{RejectionReason}</span>
            )}
            <CustomLink href="/user-verification" className="text-sm text-primary hover:underline">
              Pokušaj ponovo
            </CustomLink>
          </div>
        );
      case "pending":
      case "resubmitted":
        return (
          <div className={`${badgeBase} bg-amber-50 text-amber-700 border-amber-200`}>
            <MdWarningAmber size={14} /> <span>Na čekanju</span>
          </div>
        );
      default:
        return (
          <div className={`${badgeBase} bg-gray-50 text-gray-700 border-gray-200`}>
            <span>Nepoznato</span>
          </div>
        );
    }
  };

  const buildFormattedAddress = () => {
    const base = (bihLocation?.formattedAddress || "").trim();
    const street = (bihLocation?.address || "").trim();
    if (street && base) return `${street}, ${base}`;
    if (base) return base;
    if (street) return street;
    return (formData.address || "").trim();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!formData?.name.trim()) {
      toast.error("Ime je obavezno polje!");
      return;
    }

    if (!bihLocation?.municipalityId) {
      toast.error("Molimo odaberite vašu lokaciju!");
      return;
    }

    const mobileNumber = formData.phone || "";
    if (
      Boolean(mobileNumber) &&
      !isValidPhoneNumber(`+${formData.country_code}${mobileNumber}`)
    ) {
      toast.error("Uneseni broj telefona nije ispravan.");
      return;
    }

    setIsSaving(true);
    try {
      // snimi lokaciju lokalno (hook)
      saveLocation(bihLocation);

      const formattedAddress = buildFormattedAddress();

      const response = await updateProfileApi.updateProfile({
        name: formData.name,
        email: formData.email,
        mobile: mobileNumber,
        address: formattedAddress,
        profile: profileFile,
        fcm_id: fetchFCM || "",
        notification: formData.notification,
        country_code: formData.country_code,
        show_personal_details: formData.show_personal_details,
        region_code: (formData.region_code || "").toUpperCase(),
      });

      const data = response.data;
      if (data.error !== true) {
        const currentFcmId = UserData?.fcm_id;
        const newData = data?.data;

        if (!newData?.fcm_id && currentFcmId) {
          loadUpdateUserData({ ...newData, fcm_id: currentFcmId });
        } else {
          loadUpdateUserData(newData);
        }

        // reset dirty
        initialSnapshotRef.current = {
          formData,
          bihLocation,
          hasFile: false,
        };
        setProfileFile(null);
        setIsDirty(false);

        toast.success("Profil je uspješno ažuriran!");
      } else {
        toast.error(data.message || "Došlo je do greške prilikom ažuriranja.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška na serveru. Pokušajte kasnije.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!IsLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border rounded-xl p-6">
          <h1 className="text-xl font-semibold">Postavke</h1>
          <p className="text-gray-600 mt-2">
            Morate biti prijavljeni da biste uređivali profil.
          </p>
          <div className="mt-4">
            <CustomLink href="/login" className={buttonVariants({ variant: "default" })}>
              Prijavi se
            </CustomLink>
          </div>
        </div>
      </div>
    );
  }

  // --- UI: section renderer ---
  const SectionShell = ({ title, subtitle, children, rightSlot }) => (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <div className="bg-white border rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      <div className="lg:col-span-4">
        {rightSlot || (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <MdInfoOutline size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">{infoBox.title}</p>
                <p className="text-sm text-blue-900/80 mt-2 leading-relaxed">
                  {infoBox.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Postavke</h1>
          <p className="text-sm text-gray-600 mt-1">
            Sve bitno o vašem profilu na jednom mjestu — jasno i pregledno.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isSaving || !isDirty}
          >
            {isSaving ? "Spremam..." : "Sačuvaj izmjene"}
          </Button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <ProfileSettingsMenu
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />

          {/* Mini profil kartica */}
          <div className="hidden lg:block mt-6 bg-white border rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14">
                <SellerAvatar
                  customAvatarUrl={profileImage}
                  avatarId={sellerAvatarId}
                  className="ring-2 ring-primary/15"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {formData.name || "Korisnik"}
                </p>
                <p className="text-sm text-gray-600 truncate">{formData.email}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">Status</span>
              {renderVerificationBadge()}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          {/* Pending */}
          {isPending ? (
            <div className="bg-white border rounded-xl p-6">
              <p className="text-gray-600">Učitavam podatke...</p>
            </div>
          ) : (
            <>
              {activeTab === "user" && (
                <SectionShell
                  title="Korisničke informacije"
                  subtitle="Ažurirajte osnovne podatke računa."
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Ime i prezime</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Unesite ime i prezime"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Unesite e-mail"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label>Broj telefona</Label>
                      <div className="mt-2">
                        <PhoneInput
                          country={formData.region_code || "ba"}
                          value={`${formData.country_code || ""}${formData.phone || ""}`}
                          onChange={handlePhoneChange}
                          inputStyle={{
                            width: "100%",
                            height: "42px",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                          buttonStyle={{
                            borderRadius: "8px 0 0 8px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Ako ne želite prikaz broja javno, isključite ga u sekciji <b>Privatnost</b>.
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionShell>
              )}

              {activeTab === "photo" && (
                <SectionShell title="Profilna slika" subtitle="Dodajte sliku ili koristite avatar.">
                  <div className="flex items-start gap-5">
                    <div className="w-24 h-24 shrink-0">
                      <SellerAvatar
                        customAvatarUrl={profileImage}
                        avatarId={sellerAvatarId}
                        className="ring-2 ring-primary/15"
                      />
                    </div>

                    <div className="flex-1">
                      <input
                        id={fileInputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById(fileInputId)?.click()}
                      >
                        Odaberi sliku
                      </Button>

                      <p className="text-sm text-gray-600 mt-3">
                        Preporuka: jasna slika lica ili logotip. Maksimalno 5MB.
                      </p>
                    </div>
                  </div>
                </SectionShell>
              )}

              {activeTab === "location" && (
                <SectionShell title="Lokacija" subtitle="Odaberite gdje se nalazite.">
                  <div>
                    <BiHLocationSelector
                      value={bihLocation}
                      onChange={(newLoc) => {
                        markDirty();
                        setBihLocation(newLoc);
                      }}
                      showAddress={true}
                      label=""
                    />

                    <div className="mt-4 bg-gray-50 border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <MdCheckCircle className="text-green-600" size={18} />
                        <span className="font-medium">Pregled adrese</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {buildFormattedAddress() || "Nije odabrana adresa."}
                      </p>
                    </div>
                  </div>
                </SectionShell>
              )}

              {activeTab === "privacy" && (
                <SectionShell title="Privatnost" subtitle="Odaberite šta je javno vidljivo na profilu.">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium text-gray-900">Prikaži kontakt podatke</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Ako je uključeno, kupci mogu vidjeti vaš telefon/e-mail gdje je primjenjivo.
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_personal_details === 1}
                      onCheckedChange={() => handleSwitchChange("show_personal_details")}
                    />
                  </div>
                </SectionShell>
              )}

              {activeTab === "notifications" && (
                <SectionShell title="Notifikacije" subtitle="Upravljajte obavijestima.">
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium text-gray-900">Uključi obavijesti</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Poruke, ponude, statusi i važne informacije.
                      </p>
                    </div>
                    <Switch
                      checked={formData.notification === 1}
                      onCheckedChange={() => handleSwitchChange("notification")}
                    />
                  </div>
                </SectionShell>
              )}

              {activeTab === "verification" && (
                <SectionShell title="Verifikacija" subtitle="Provjerite i povećajte povjerenje profila.">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">Status verifikacije</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Verifikacija pomaže da kupci više vjeruju profilu.
                        </p>
                      </div>
                      {renderVerificationBadge()}
                    </div>

                    <div className="mt-4">
                      <CustomLink
                        href="/user-verification"
                        className={buttonVariants({ variant: "default" })}
                      >
                        Otvori verifikaciju
                      </CustomLink>
                    </div>
                  </div>
                </SectionShell>
              )}

              {activeTab === "seller" && (
                <SectionShell title="Postavke prodavača" subtitle="Uredite seller postavke.">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      Ovdje možete urediti dodatne prodajne postavke (npr. avatar, prikaz profila, opcije).
                    </p>
                    <div className="mt-4">
                      <CustomLink
                        href="/profile/seller-settings"
                        className={buttonVariants({ variant: "outline" })}
                      >
                        Otvori postavke prodavača
                      </CustomLink>
                    </div>
                  </div>
                </SectionShell>
              )}
            </>
          )}
        </main>
      </div>

      {/* Sticky save on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <Button
          className="w-full"
          type="button"
          onClick={handleSubmit}
          disabled={isPending || isSaving || !isDirty}
        >
          {isSaving ? "Spremam..." : "Sačuvaj izmjene"}
        </Button>
      </div>
    </div>
  );
}
