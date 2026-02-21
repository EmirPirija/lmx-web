import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  LMX_PHONE_DEFAULT_COUNTRY,
  LMX_PHONE_INPUT_PROPS,
  resolveLmxPhoneDialCode,
} from "@/components/Common/phoneInputTheme";

const RegisterAuthInputField = ({
  type,
  label,
  placeholder,
  value,
  handleInputChange,
  setCountryCode,
}) => {
  return (
    <div className="labelInputCont">
      <Label className="requiredInputLabel text-sm font-semibold text-foreground">
        {label}
      </Label>
      {type === "phone" ? (
        <PhoneInput
          country={LMX_PHONE_DEFAULT_COUNTRY}
          value={value}
          onChange={(phone, data) => handleInputChange(phone, data)}
          onCountryChange={(countryData) =>
            setCountryCode(
              countryData?.dialCode
                ? `+${countryData.dialCode}`
                : `+${resolveLmxPhoneDialCode(
                    typeof countryData === "string" ? countryData : countryData?.countryCode
                  )}`
            )
          }
          inputProps={{
            name: "phone",
            required: true,
            autoFocus: true,
          }}
          {...LMX_PHONE_INPUT_PROPS}
        />
      ) : (
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
          onChange={(e) => handleInputChange(e.target.value)}
          required
          autoFocus
        />
      )}
    </div>
  );
};

export default RegisterAuthInputField;
