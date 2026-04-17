// cực kỳ mỏng, chỉ làm nhiệm vụ lắp ghép
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginFeature } from "@/features/auth";

export const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginFeature />
    </AuthLayout>
  );
};