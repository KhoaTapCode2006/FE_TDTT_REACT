import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLogin } from "../auth.hook"; // Import Hook

export const LoginFeature = () => {
  // Lấy data và action từ Hook
  const { email, setEmail, password, setPassword, isLoading, error, handleLogin } = useLogin();

  return (
    <form onSubmit={handleLogin}>
      <h2 className="text-2xl font-bold text-center mb-6">Đăng Nhập</h2>
      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
      
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      
      <Button type="submit" isLoading={isLoading}>Đăng Nhập</Button>
    </form>
  );
};