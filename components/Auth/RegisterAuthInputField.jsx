import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import useAutoFocus from "../Common/useAutoFocus";

const RegisterAuthInputField = ({
  type,
  label,
  placeholder,
  value,
  handleInputChange,
  setCountryCode,
  t,
}) => {
  const emailInputRef = useAutoFocus();
  const phoneInputRef = useAutoFocus();
  

  return (
    <div className="labelInputCont">
      <Label className="requiredInputLabel">
        {t(label)}
      </Label>
      {type === "phone" ? (
        <PhoneInput
          country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY}
          value={value}
          onChange={(phone, data) => handleInputChange(phone, data)}
          onCountryChange={(code) => setCountryCode(code)}
          inputProps={{
            name: "phone",
            required: true,
            ref: phoneInputRef,
          }}
          enableLongNumbers
        />
      ) : (
        <Input
          type={type}
          placeholder={t(placeholder)}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          required
          ref={emailInputRef}
        />
      )}
    </div>
  );
};

export default RegisterAuthInputField;
