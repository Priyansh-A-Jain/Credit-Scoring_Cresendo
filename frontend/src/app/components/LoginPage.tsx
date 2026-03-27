import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { authService } from "../services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState<"user" | "admin">("user");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otpFor, setOtpFor] = useState<"login" | "signup-email">("login");
  const [signupStep, setSignupStep] = useState<"form" | "email-otp">("form"); // Track signup progress
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (userType === "admin") {
      setIsSignUp(false);
    }
  }, [userType]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResendOtp) {
      setCanResendOtp(true);
    }
  }, [resendCountdown, canResendOtp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (userType === "admin") {
        if (!email || !password) {
          setError("Email ID and password are required");
          setLoading(false);
          return;
        }

        const response = await authService.login({
          email,
          password,
        });

        if (response.accessToken && response.refreshToken && response.user) {
          authService.setTokens(response.accessToken, response.refreshToken);
          localStorage.setItem("userType", "admin");
          localStorage.setItem("userData", JSON.stringify(response.user));
          login(response.user, "admin");
          navigate("/admin");
        } else {
          setError("Invalid admin credentials");
        }
      } else {
        // User login - call backend API
        if (!mobile || !password) {
          setError("Phone number and password are required");
          setLoading(false);
          return;
        }

        await authService.login({
          phone: mobile,
          password,
        });

        // OTP sent successfully, show OTP input
        setShowOtp(true);
        setOtpFor("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!fullName || !mobile || !email || !password) {
        setError("All fields are required");
        setLoading(false);
        return;
      }

      await authService.signup({
        fullName,
        email,
        phone: mobile,
        password,
      });

      // OTP sent to email, show email OTP input
      setShowOtp(true);
      setOtpFor("signup-email");
      setSignupStep("email-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!otp) {
        setError("OTP is required");
        setLoading(false);
        return;
      }

      let response;

      if (signupStep === "email-otp") {
        // SIGNUP FLOW: Verify email OTP and create user
        console.log('📧 Verifying email OTP and creating user...');
        response = await authService.verifyEmailOtp({
          phone: mobile,
          email: email,
          otp,
        });
      } else {
        // Verify login OTP
        response = await authService.verifyLoginOtp({
          phone: mobile,
          otp,
        });
      }

      // Store tokens and user info
      authService.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem("userType", "user");
      localStorage.setItem("userData", JSON.stringify(response.user));
      login(response.user, "user");

      navigate("/apply-loan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (canResendOtp) {
      setError("");
      setLoading(true);

      try {
        if (signupStep === "email-otp") {
          // Resend email OTP during signup - only email verification, no phone verification required
          await authService.resendEmailOtp({
            phone: mobile,
            email,
          });
        } else {
          // Resend login OTP
          await authService.login({
            phone: mobile,
            password,
          });
        }

        setOtp("");
        setCanResendOtp(false);
        setResendCountdown(30);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to resend OTP");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[900px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-[#00000040] min-h-[550px]">

        {/* Left Side */}
        <div className="md:w-1/2 p-8 sm:p-12 pl-16 flex flex-col items-center justify-center text-center bg-white">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/download.png" alt="Barclays Logo" className="w-[120px] h-[120px] object-contain" />
            </div>

            <h1 className="text-[2.75rem] font-serif font-bold text-blue-600 mb-1 tracking-wide uppercase">
              BARCLAYS
            </h1>
            <h2 className="text-[2rem] font-serif font-bold text-blue-600 mb-6 tracking-wide uppercase">
              CREDIT
            </h2>
            <p className="text-[13px] text-slate-700 font-bold max-w-xs mx-auto leading-relaxed mt-2 tracking-wide">
              Empowering everyone with accurate credit<br />scores through advanced analytics. Access<br />secure and reliable financial insights.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="md:w-1/2 p-8 sm:p-12 pr-16 bg-blue-600 flex flex-col">

          <div className="flex-1 flex flex-col pt-4">
            {/* User/Admin Toggle - only for user type selection */}ī
            {!showOtp && (
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className="text-white text-sm font-semibold tracking-wide">USER</span>
                <div
                  className="relative w-12 h-6 bg-blue-400 rounded-full cursor-pointer flex items-center px-1"
                  onClick={() => setUserType(userType === "user" ? "admin" : "user")}
                >
                  <div
                    className={`w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm ${userType === "admin" ? "translate-x-6" : "translate-x-0"
                      }`}
                  />
                </div>
                <span className="text-white text-sm font-semibold tracking-wide">ADMIN</span>
              </div>
            )}

            <h3 className="text-[18px] font-semibold text-white mb-6 text-center tracking-wide">
              {isSignUp ? "Create a new Account" : "Login to your Account"}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-500 text-white text-sm rounded">
                {error}
              </div>
            )}

            {!showOtp && (
              <form className="space-y-4 mb-8">
                {isSignUp && (
                  <>
                    <div>
                      <Label htmlFor="fullName" className="text-white mb-1.5 block text-xs font-semibold tracking-wide">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-8 bg-white border-0 text-black rounded shadow-none focus-visible:ring-1 focus-visible:ring-blue-300"
                      />
                    </div>
                  </>
                )}

                {userType === "user" ? (
                  <div>
                    <Label htmlFor="mobile" className="text-white mb-1.5 block text-xs font-semibold tracking-wide">
                      {isSignUp ? "Mobile Number" : "Phone Number"}
                    </Label>
                    <Input
                      id="mobile"
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder={isSignUp ? "e.g. +91 98765 43210" : "e.g. 9870000001"}
                      className="h-8 bg-white border-0 text-black rounded shadow-none focus-visible:ring-1 focus-visible:ring-blue-300"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="email" className="text-white mb-1.5 block text-xs font-semibold tracking-wide">
                      Email ID
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@barclays.com"
                      className="h-8 bg-white border-0 text-black rounded shadow-none focus-visible:ring-1 focus-visible:ring-blue-300"
                    />
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <Label htmlFor="email" className="text-white mb-1.5 block text-xs font-semibold tracking-wide">
                      Email ID
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={false}
                      readOnly={false}
                      className="h-8 bg-white border-0 text-black rounded shadow-none focus-visible:ring-1 focus-visible:ring-blue-300"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="password" className="text-white mb-1.5 block text-xs font-semibold tracking-wide">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={false}
                    readOnly={false}
                    className="h-8 bg-white border-0 text-black rounded shadow-none focus-visible:ring-1 focus-visible:ring-blue-300"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={isSignUp ? handleSignUp : handleLogin}
                    disabled={loading}
                    className="w-full h-8 bg-white hover:bg-gray-100 text-[#4e4d7a] font-bold text-sm rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : (isSignUp ? "Proceed to OTP Verification" : "Login with credentials")}
                  </Button>
                </div>

                {userType === "user" && (
                  <p className="text-white text-xs text-center mt-2">
                    {isSignUp ? "Already have an account? " : "New to Barclays? "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setOtp("");
                        setShowOtp(false);
                        setError("");
                        setSignupStep("form");
                      }}
                      className="underline font-bold hover:text-gray-200"
                    >
                      {isSignUp ? "Login" : "Create Account"}
                    </button>
                  </p>
                )}
              </form>
            )}

            {showOtp && (
              <form onSubmit={handleOtpSubmit} className="space-y-4 mt-6 border-t border-blue-400 pt-6">
                <div>
                  <Label className="text-white mb-2 block text-xs font-semibold tracking-wide">
                    Enter OTP
                  </Label>
                  <div className="flex justify-start">
                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                      <InputOTPGroup className="gap-2 sm:gap-4">
                        <InputOTPSlot index={0} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                        <InputOTPSlot index={1} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                        <InputOTPSlot index={2} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                        <InputOTPSlot index={3} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                        <InputOTPSlot index={4} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                        <InputOTPSlot index={5} className="w-10 h-10 bg-white border-0 text-[#4e4d7a] text-lg rounded-[8px]" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-white text-[10px] mt-3 font-medium tracking-wide">
                    An OTP has been sent to your email
                  </p>
                </div>

                <div className="flex flex-col items-center mt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-[120px] h-7 bg-white hover:bg-gray-100 text-[#4e4d7a] font-extrabold text-sm rounded-[4px] border-b-2 border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying..." : "SUBMIT"}
                  </Button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp || loading}
                    className={`text-[11px] font-bold mt-2.5 ${canResendOtp && !loading
                        ? "text-white hover:text-gray-200 cursor-pointer"
                        : "text-gray-300 cursor-not-allowed"
                      }`}
                  >
                    {canResendOtp ? "Resend OTP" : `Resend OTP in ${resendCountdown}s`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtp(false);
                      setOtp("");
                      setError("");
                    }}
                    disabled={loading}
                    className="text-white hover:text-gray-200 text-[11px] font-bold mt-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}