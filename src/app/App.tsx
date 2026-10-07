import { Layout } from "./components/Layout";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <Layout />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}