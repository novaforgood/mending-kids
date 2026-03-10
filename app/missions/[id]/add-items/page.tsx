import { fetchInventory } from "../../actions";
import AddItemsClient from "./AddItemsClient";

export default async function AddItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const missionId = Number(id);
  const inventory = await fetchInventory();
  return <AddItemsClient missionId={missionId} inventory={inventory} />;
}
