import { ProfileView } from "@/components/profile/profile-view";

export const metadata = { title: "Profile", robots: { index: false, follow: false } };

export default function ProfilePage() {
  return (
    <main className="flex flex-1 justify-center px-4 pt-6 pb-20 md:px-10">
      <ProfileView />
    </main>
  );
}
