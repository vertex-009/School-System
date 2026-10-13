import { ProfileForm } from "./form";
import { getContext } from "@/lib/session";

export default async function ProfilePage() {
  const { supabase, profile } = await getContext();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email || "";
  return (
    <ProfileForm
      role={profile.role}
      name={profile.name}
      phone={profile.phone || ""}
      email={email}
      photoUrl={profile.photo_url}
    />
  );
}
