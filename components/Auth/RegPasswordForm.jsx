import { FaRegEye, FaRegEyeSlash } from "@/components/Common/UnifiedIconPack";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const RegPasswordForm = ({
  username,
  setUsername,
  password,
  setPassword,
  IsPasswordVisible,
  setIsPasswordVisible,
  showLoader,
  Signin,
  t,
}) => {
  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-gradient-to-b from-card to-muted/30 p-4 shadow-sm sm:p-5"
      onSubmit={Signin}
    >
      <div className="rounded-xl border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
        Postavi korisničko ime i lozinku kako bi završio registraciju.
      </div>

      <div className="labelInputCont">
        <Label className="requiredInputLabel text-sm font-semibold text-foreground">
          {"Korisničko ime"}
        </Label>
        <Input
          type="text"
          placeholder={"Unesi korisničko ime"}
          name="username"
          required
          className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        />
      </div>

      <div className="labelInputCont">
        <Label className="requiredInputLabel text-sm font-semibold text-foreground">
          {"Lozinka"}
        </Label>
        <div className="flex items-center relative">
          <Input
            type={IsPasswordVisible ? "text" : "password"}
            placeholder={"Unesi lozinku"}
            id="password"
            name="password"
            className="h-11 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground ltr:pr-10 rtl:pl-10"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="absolute ltr:right-3 rtl:left-3 cursor-pointer text-muted-foreground hover:text-foreground"
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
          >
            {IsPasswordVisible ? (
              <FaRegEye size={20} />
            ) : (
              <FaRegEyeSlash size={20} />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={showLoader}
        className="h-11 rounded-xl text-sm font-semibold"
        size="lg"
      >
        {showLoader ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>{"Potvrdi e-mail adresu"}</span>
        )}
      </Button>
    </form>
  );
};

export default RegPasswordForm;
