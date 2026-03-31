import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function RootIndex() {
  const { user } = useAuthStore();
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/onboarding" />;
}
