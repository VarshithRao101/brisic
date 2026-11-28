import { homeParties } from "@/lib/party";
import { FeaturedParties } from "@/components/admin-clients";

export default async function AdminPartiesPage() {
  const { featured } = await homeParties();
  return <FeaturedParties rooms={featured} />;
}
