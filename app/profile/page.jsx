import dynamic from "next/dynamic";
import PageLoadingShell from "@/components/Common/PageLoadingShell";

const Profile = dynamic(() => import("@/components/Profile/Profile"), {
  loading: () => <PageLoadingShell title="Učitavanje profila" />,
});

const ProfilePage = () => {
  return <Profile />;
};

export default ProfilePage;
