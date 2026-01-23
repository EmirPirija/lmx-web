"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { MdStorefront, MdArrowForward } from "react-icons/md";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import UpgradeMembershipCard from "@/components/PagesComponent/Membership/UpgradeMembershipCard";

// ✅ LMX avatar (pretpostavka: imaš ga negdje exportovanog)
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

// Icons
import {
  MdVerifiedUser,
  MdOutlineEmail,
  MdOutlinePerson,
  MdOutlineLocationOn,
  MdNotificationsNone,
  MdLockOutline,
  MdWarningAmber,
  MdCheckCircle,
  MdEdit,
  MdCameraAlt,
} from "react-icons/md";

// UI Components
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Button, buttonVariants } from "../ui/button";
import CustomLink from "@/components/Common/CustomLink";

// Redux & API
import { loadUpdateUserData, userSignUpData } from "@/redux/reducer/authSlice";
import { Fcmtoken, settingsData } from "@/redux/reducer/settingSlice";
import {
  getUserInfoApi,
  getVerificationStatusApi,
  updateProfileApi,
  sellerSettingsApi, // ✅ treba u utils/api export (kao u SellerSettings.jsx)
} from "@/utils/api";

/* ✅ Avatar fallback component:
   1) ako ima upload sliku (customAvatarUrl) -> prikazi nju
   2) ako nema -> LMX SVG avatar po avatarId
*/
function SellerAvatar({ customAvatarUrl, avatarId, className = "" }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  if (showImg) {
    // koristimo <img> jer: dataURL preview + remote URL + nema next/image domain problema
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
    <div className={`w-full h-full rounded-full bg-white flex items-center justify-center text-primary ${className}`}>
      <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-16 h-16" />
    </div>
  );
}

const Profile = () => {
  // --- REDUX & STATE ---
  const UserData = useSelector(userSignUpData);
  const IsLoggedIn = UserData !== undefined && UserData !== null;
  const settings = useSelector(settingsData);
  const fetchFCM = useSelector(Fcmtoken);
  const placeholder_image = settings?.placeholder_image;

  const [profileImage, setProfileImage] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [sellerAvatarId, setSellerAvatarId] = useState("lmx-01"); // ✅ fallback avatar id
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [VerificationStatus, setVerificationStatus] = useState("");
  const [RejectionReason, setRejectionReason] = useState("");

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

  // --- API FETCHING ---
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
        const region = (d?.region_code || process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "in").toLowerCase();
        const countryCode = d?.country_code?.replace("+", "") || "91";

        setFormData({
          name: d?.name || "",
          email: d?.email || "",
          phone: d?.mobile || "",
          address: d?.address || "",
          notification: d?.notification,
          show_personal_details: Number(d?.show_personal_details),
          region_code: region,
          country_code: countryCode,
        });

        // ✅ upload slika (ako je placeholder, tretiramo kao "nema")
        setProfileImage(d?.profile || placeholder_image);

        // Sync Redux
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

  // ✅ seller settings fetch (da dobijes avatar_id)
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
    if (IsLoggedIn) {
      const fetchData = async () => {
        setIsPending(true);
        await Promise.all([getVerificationProgress(), getUserDetails(), getSellerSettings()]);
        setIsPending(false);
      };
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- HANDLERS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handlePhoneChange = (value, data) => {
    const dial = data?.dialCode || "";
    const iso2 = data?.countryCode || "";
    const pureMobile = value.startsWith(dial) ? value.slice(dial.length) : value;
    setFormData((prev) => ({ ...prev, phone: pureMobile, country_code: dial, region_code: iso2 }));
  };

  const handleSwitchChange = (id) => {
    const newVal = formData[id] === 1 ? 0 : 1;
    setFormData((prev) => ({ ...prev, [id]: newVal }));

    if (id === "notification") {
      toast.info(newVal === 1 ? "Obavijesti su uključene." : "Obavijesti su isključene.");
    } else {
      toast.info(newVal === 1 ? "Kontakt podaci su sada vidljivi." : "Kontakt podaci su sada skriveni.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Slika je prevelika. Molimo odaberite sliku manju od 5MB.");
        return;
      }

      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result);
        toast.success("Slika profila je odabrana. Kliknite 'Sačuvaj' da primijenite izmjene.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData?.name.trim() || !formData?.address.trim()) {
      toast.error("Ime i Adresa su obavezna polja!");
      return;
    }
    const mobileNumber = formData.phone || "";
    if (Boolean(mobileNumber) && !isValidPhoneNumber(`+${formData.country_code}${mobileNumber}`)) {
      toast.error("Uneseni broj telefona nije ispravan.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateProfileApi.updateProfile({
        name: formData.name,
        email: formData.email,
        mobile: mobileNumber,
        address: formData.address,
        profile: profileFile,
        fcm_id: fetchFCM || "",
        notification: formData.notification,
        country_code: formData.country_code,
        show_personal_details: formData?.show_personal_details,
        region_code: formData.region_code.toUpperCase(),
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
        toast.success("Profil je uspješno ažuriran!");
      } else {
        toast.error(data.message || "Došlo je do greške prilikom ažuriranja.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Greška na serveru. Pokušajte kasnije.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderVerificationBadge = () => {
    const badgeBase = "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border";
    switch (VerificationStatus) {
      case "approved":
        return (
          <div className={`${badgeBase} bg-green-50 text-green-700 border-green-200`}>
            <MdVerifiedUser size={14} /> <span>Verifikovan</span>
          </div>
        );
      case "not applied":
        return (
          <CustomLink href="/user-verification" className={`${buttonVariants({ variant: "outline", size: "sm" })} text-xs h-7`}>
            Verifikuj se
          </CustomLink>
        );
      case "rejected":
        return (
          <div className="flex flex-col items-center gap-2">
            <div className={`${badgeBase} bg-red-50 text-red-700 border-red-200`}>
              <MdWarningAmber size={14} /> <span>Odbijen</span>
            </div>
            {RejectionReason && <span className="text-[10px] text-red-500 max-w-[150px] text-center">{RejectionReason}</span>}
            <CustomLink href="/user-verification" className="text-xs text-primary hover:underline">
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
        return null;
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ✅ Ako je profilna placeholder, tretiraj kao da nema custom slike
  const customAvatarUrl = profileImage && profileImage !== placeholder_image ? profileImage : "";

  return (
    <>
      {/* INJECTED CSS FOR REACT-PHONE-INPUT-2 */}
      <style jsx global>{`
        .react-tel-input .form-control {
          width: 100% !important;
          height: 2.5rem !important;
          border-radius: 0.375rem !important;
          border: 1px solid #e2e8f0 !important;
          background-color: transparent !important;
          padding-left: 3rem !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
          transition: all 0.2s;
        }
        .react-tel-input .form-control:focus {
          border-color: #000 !important;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1) !important;
          outline: none !important;
        }
        .react-tel-input .flag-dropdown {
          border-color: #e2e8f0 !important;
          background-color: transparent !important;
          border-right: none !important;
          border-top-left-radius: 0.375rem !important;
          border-bottom-left-radius: 0.375rem !important;
        }
        .react-tel-input .selected-flag:hover,
        .react-tel-input .selected-flag:focus {
          background-color: #f1f5f9 !important;
        }
        .react-tel-input .country-list {
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #e2e8f0 !important;
          margin-top: 4px !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Postavke Profila</h1>
            <p className="text-gray-500 mt-1 text-sm">Uredite vaše lične podatke i postavke računa.</p>
          </div>
          <div className="hidden md:block">
            <Button disabled={isLoading} onClick={handleSubmit} className="px-6 shadow-sm">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Čuvanje...
                </span>
              ) : (
                "Sačuvaj Promjene"
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR: PROFILE CARD */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
              {/* Cover Background */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 pattern-dots" />
              </div>

              <div className="px-6 pb-8 text-center relative">
                {/* Avatar Upload */}
                <div className="relative -mt-16 mx-auto w-32 h-32">
                  <div className="w-full h-full rounded-full border-[5px] border-white shadow-lg overflow-hidden relative bg-gray-100">
                    {/* ✅ Fallback: custom upload -> LMX avatar */}
                    <SellerAvatar customAvatarUrl={customAvatarUrl} avatarId={sellerAvatarId} />
                  </div>

                  <label
                    htmlFor="profileImageUpload"
                    title="Promijeni sliku"
                    className="absolute bottom-1 right-1 p-2.5 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md border-2 border-white flex items-center justify-center hover:scale-110 active:scale-95 duration-200"
                  >
                    <MdCameraAlt size={16} />
                    <input type="file" id="profileImageUpload" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="mt-4 space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">{UserData?.name}</h2>
                  <p className="text-sm text-gray-500 font-medium">{UserData?.email}</p>
                </div>

                <div className="mt-6 flex justify-center">{renderVerificationBadge()}</div>
              </div>
            </div>

            {/* MEMBERSHIP UPGRADE CARD */}
            <UpgradeMembershipCard />

            {/* QUICK STATS / INFO */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 hidden lg:block">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <MdVerifiedUser size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Zašto se verifikovati?</h4>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    Verifikovani korisnici dobijaju 20% veću vidljivost i povjerenje drugih članova zajednice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: FORMS */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. PERSONAL INFO CARD */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                  <MdOutlinePerson size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lični Podaci</h3>
                  <p className="text-xs text-gray-500">Vaše osnovne identifikacione informacije.</p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Ime i Prezime <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Unesite vaše ime"
                      className="pl-10 transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                    <MdEdit className="absolute left-3 top-3 text-gray-400 group-hover:text-blue-500 transition-colors" size={16} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Email Adresa <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={UserData?.type === "email" || UserData?.type === "google"}
                        className={`pl-10 ${UserData?.type !== "phone" ? "bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200" : ""}`}
                      />
                      <MdOutlineEmail className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Broj Telefona
                    </Label>
                    <div className="relative w-full">
                      <PhoneInput
                        country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
                        value={`${formData.country_code}${formData.phone}`}
                        onChange={(phone, data) => handlePhoneChange(phone, data)}
                        inputProps={{ name: "phone" }}
                        enableLongNumbers
                        disabled={UserData?.type === "phone"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ADDRESS CARD */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                  <MdOutlineLocationOn size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Adresa</h3>
                  <p className="text-xs text-gray-500">Vaša lokacija za dostavu i naplatu.</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Adresa Stanovanja <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="min-h-[100px] resize-y focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Unesite vašu punu adresu"
                />
              </div>
            </div>

            {/* 3. SETTINGS CARD */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                  <MdCheckCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Postavke</h3>
                  <p className="text-xs text-gray-500">Upravljajte privatnošću i obavijestima.</p>
                </div>
              </div>

              {/* 4. SELLER SETTINGS CARD */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <MdStorefront size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Postavke prodavača</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Prilagodite kontakte, radno vrijeme, auto-reply i još mnogo toga</p>
                    </div>
                  </div>
                  <CustomLink
                    href="/profile/seller-settings"
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <span>Otvori</span>
                    <MdArrowForward />
                  </CustomLink>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">WhatsApp</div>
                    <div className="text-xs text-gray-500 mt-1">Kontakt opcija</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">Viber</div>
                    <div className="text-xs text-gray-500 mt-1">Kontakt opcija</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">Auto-reply</div>
                    <div className="text-xs text-gray-500 mt-1">Automatski odgovor</div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">Vacation</div>
                    <div className="text-xs text-gray-500 mt-1">Način odmora</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 mt-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MdNotificationsNone className="text-gray-400" />
                      <Label htmlFor="notification-mode" className="text-base font-medium text-gray-900 cursor-pointer">
                        Obavijesti
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">Primajte dnevne novosti i upozorenja.</p>
                  </div>
                  <Switch id="notification-mode" checked={Number(formData.notification) === 1} onCheckedChange={() => handleSwitchChange("notification")} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <MdLockOutline className="text-gray-400" />
                      <Label htmlFor="showPersonal-mode" className="text-base font-medium text-gray-900 cursor-pointer">
                        Prikaži kontakt informacije
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">Dozvoli drugima da vide tvoje kontakt detalje.</p>
                  </div>
                  <Switch
                    id="showPersonal-mode"
                    checked={Number(formData.show_personal_details) === 1}
                    onCheckedChange={() => handleSwitchChange("show_personal_details")}
                  />
                </div>
              </div>
            </div>

            {/* Mobile Sticky Button */}
            <div className="md:hidden sticky bottom-4 z-10">
              <Button disabled={isLoading} onClick={handleSubmit} className="w-full h-12 shadow-xl text-lg font-medium">
                {isLoading ? "Čuvanje..." : "Sačuvaj Promjene"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Profile;
