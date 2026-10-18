import { useLocalSearchParams } from "expo-router";
import StockItemForm from "../../../components/StockItemForm";

export default function EditStockItemScreen() {
  const { id } = useLocalSearchParams();
  return <StockItemForm componentId={id} edit />;
}
