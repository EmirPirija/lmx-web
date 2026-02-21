"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsData } from "@/redux/reducer/settingSlice";
import { t } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import { useState } from "react";
import {
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaPinterest,
} from "@/components/Common/UnifiedIconPack";
import { GrLocation } from "@/components/Common/UnifiedIconPack";
import { RiMailSendLine } from "@/components/Common/UnifiedIconPack";
import { useSelector } from "react-redux";
import { TbPhoneCall } from "@/components/Common/UnifiedIconPack";
import { FaSquareXTwitter } from "@/components/Common/UnifiedIconPack";
import { contactUsApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import parse from "html-react-parser";

const FALLBACK_CONTACT_HTML = `
  <p>Imate pitanje, prijedlog ili trebate pomoć? Naš tim je tu za vas.</p>
  <p>Pošaljite poruku kroz formu i odgovorit ćemo vam u najkraćem mogućem roku.</p>
`;

const getApiErrorMessage = (payload, fallback) => {
  if (!payload || typeof payload !== "object") return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const errors = payload.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string" && first.trim()) return first;
    if (first && typeof first.message === "string" && first.message.trim()) {
      return first.message;
    }
  }

  if (errors && typeof errors === "object") {
    const firstKey = Object.keys(errors)[0];
    const firstValue = firstKey ? errors[firstKey] : null;
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue;
    }
  }

  return fallback;
};

const ContactUs = () => {
  const settings = useSelector(settingsData);
  const [IsLoading, setIsLoading] = useState(false);
  const contactUs = settings?.contact_us;
  const phoneNumbers = [settings?.company_tel1, settings?.company_tel2].filter(Boolean);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    // Name validation
    if (!trimmedData.name) {
      newErrors.name = "Ime je obavezno";
      isValid = false;
    }

    // Email validation
    if (!trimmedData.email) {
      newErrors.email = "E-mail je obavezan";
      isValid = false;
    } else if (!validateEmail(trimmedData.email)) {
      newErrors.email = "Neispravan e-mail.";
      isValid = false;
    }

    // Subject validation
    if (!trimmedData.subject) {
      newErrors.subject = "Naslov je obavezan";
      isValid = false;
    }

    // Message validation
    if (!trimmedData.message) {
      newErrors.message = "Poruka je obavezna";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setIsLoading(true);
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        };
        const res = await contactUsApi.contactUs(payload);
        if (res?.data?.error === false) {
          toast.success("Hvala na poruci! Javit ćemo se uskoro.");
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
          });
        } else {
          toast.error(getApiErrorMessage(res?.data, "Došlo je do greške."));
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error?.response?.data, "Došlo je do greške."));
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Layout>
      <BreadCrumb title2={"Kontakt"} />
      <div className="container">
        <h1 className="sectionTitle mt-8">{"Kontakt"}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 mt-6 border rounded-lg">
          {/* Contact Form */}
          <div className="lg:col-span-2 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-medium mb-2">
              {"Pošalji poruku"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              {"Javi nam se za pitanja ili prijedloge."}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="labelInputCont">
                    <Label htmlFor="name" className="requiredInputLabel">
                      {"Ime"}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={"Unesi ime"}
                      value={formData.name}
                      onChange={handleChange}
                      className={
                        errors.name
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {errors.name && (
                      <span className="text-red-500 text-sm">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  <div className="labelInputCont">
                    <Label htmlFor="email" className="requiredInputLabel">
                      {"E-mail"}
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="text"
                      placeholder={"Unesi e-mail"}
                      value={formData.email}
                      onChange={handleChange}
                      className={
                        errors.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {errors.email && (
                      <span className="text-red-500 text-sm">
                        {errors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="labelInputCont">
                  <Label htmlFor="subject" className="requiredInputLabel">
                    {"Naslov"}
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder={"Unesi naslov"}
                    value={formData.subject}
                    onChange={handleChange}
                    className={
                      errors.subject
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors.subject && (
                    <span className="text-red-500 text-sm">
                      {errors.subject}
                    </span>
                  )}
                </div>

                <div className="labelInputCont">
                  <Label htmlFor="message" className="requiredInputLabel">
                    {"Poruka"}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={"Unesi poruku"}
                    value={formData.message}
                    onChange={handleChange}
                    className={
                      errors.message
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors.message && (
                    <span className="text-red-500 text-sm">
                      {errors.message}
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={IsLoading}>
                    {IsLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {"Šaljem..."}
                      </>
                    ) : (
                      "Pošalji"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-[#1a1a1a] text-white p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-medium mb-6">
              {"Kontakt"}
            </h2>
            <div className="space-y-6">
              <div className="max-w-full prose lg:prose-lg prose-invert">
                {parse(contactUs || FALLBACK_CONTACT_HTML)}
              </div>

              {settings?.company_address && (
                <div className="flex items-center gap-4">
                  <div className="footerSocialLinks">
                    <GrLocation size={24} />
                  </div>
                  <p className="text-sm text-white/65 hover:text-primary">
                    {settings?.company_address}
                  </p>
                </div>
              )}

              {settings?.company_email && (
                <div className="flex items-center gap-4">
                  <div className="footerSocialLinks">
                    <RiMailSendLine size={24} />
                  </div>
                  <CustomLink
                    href={`mailto:${settings?.company_email}`}
                    className="text-sm text-white/65 hover:text-primary"
                  >
                    {settings?.company_email}
                  </CustomLink>
                </div>
              )}

              {phoneNumbers.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="footerSocialLinks">
                    <TbPhoneCall size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    {phoneNumbers.map((number) => (
                      <CustomLink
                        key={number}
                        href={`tel:${number}`}
                        className="text-sm text-white/65 hover:text-primary"
                      >
                        {number}
                      </CustomLink>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg sm:text-xl font-medium mb-6">
                  {"Društvene mreže"}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {settings?.facebook_link && (
                    <CustomLink
                      href={settings?.facebook_link}
                      className="footerSocialLinks"
                    >
                      <FaFacebook size={24} />
                    </CustomLink>
                  )}
                  {settings?.instagram_link && (
                    <CustomLink
                      href={settings?.instagram_link}
                      className="footerSocialLinks"
                    >
                      <FaInstagram size={22} />
                    </CustomLink>
                  )}

                  {settings?.x_link && (
                    <CustomLink
                      href={settings?.x_link}
                      className="footerSocialLinks"
                    >
                      <FaSquareXTwitter size={22} />
                    </CustomLink>
                  )}
                  {settings?.linkedin_link && (
                    <CustomLink
                      href={settings?.linkedin_link}
                      className="footerSocialLinks"
                    >
                      <FaLinkedin size={24} />
                    </CustomLink>
                  )}
                  {settings?.pinterest_link && (
                    <CustomLink
                      href={settings?.pinterest_link}
                      className="footerSocialLinks"
                    >
                      <FaPinterest size={24} />
                    </CustomLink>
                  )}
                </div>
              </div>

              {settings?.google_map_iframe_link && (
                <iframe
                  src={settings?.google_map_iframe_link}
                  width="100%"
                  height="200"
                  className="aspect-[432/189] w-full rounded mt-6"
                  title="Lokacija kompanije"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
