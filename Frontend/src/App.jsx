import { BrowserRouter } from "react-router-dom";
import AppRouter from "./app/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { FiltersProvider } from "./context/FiltersContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FiltersProvider>
          <AppRouter />
        </FiltersProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
