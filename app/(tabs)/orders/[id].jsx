import { useLocalSearchParams } from "expo-router";
import OrderForm from "../../../components/OrderForm";

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams();
  return <OrderForm edit orderId={id} />;
}
