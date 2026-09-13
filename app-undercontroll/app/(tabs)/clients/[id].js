import { useLocalSearchParams } from "expo-router";
import ClientForm from "../../../components/ClientForm";

export default function EditClientScreen() {
  const { id } = useLocalSearchParams();
  return <ClientForm clientId={id} edit />;
}