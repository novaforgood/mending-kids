import { fetchInventory } from "../../actions";
import AddItemsClient from "./AddItemsClient";

export default async function AddItemsPage({
  params,
}: {
  params: { id: string };
}) {
  const missionId = Number(params.id);
  const inventory = await fetchInventory();
  return <AddItemsClient missionId={missionId} inventory={inventory} />;
}
