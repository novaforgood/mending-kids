import { fetchInventory, fetchMissionInventoryIds } from "../../actions";
import AddItemsClient from "./AddItemsClient";

export default async function AddItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const missionId = Number(id);
  const [inventory, existingInventoryIds] = await Promise.all([
    fetchInventory(),
    fetchMissionInventoryIds(missionId),
  ]);
  return <AddItemsClient missionId={missionId} inventory={inventory} existingInventoryIds={existingInventoryIds} />;
}
