import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmail } from "./auth.api";
import { useAuthStore } from "./auth.store";

export const useLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const user = await loginWithEmail(email, password);
      setUser({ uid: user.uid, email: user.email });
      navigate("/");
    } catch (err) {
      setError("Sai email hoặc mật khẩu!");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    isLoading, error,
    handleLogin
  };
};