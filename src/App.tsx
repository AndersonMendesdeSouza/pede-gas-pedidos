import { useEffect } from "react";
import AppProvider from "./contexts/AppProvider";
import { useApp } from "./contexts/AppContext";
import { useRoute } from "./services/navigation";
import Layout from "./components/Layout";
import Onboarding from "./components/Onboarding";
import { Empty, Loading } from "./components/ui";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Addresses from "./pages/Addresses";
import Coupons from "./pages/Coupons";
import Orders, { OrderTrack } from "./pages/Orders";
import Profile, { EditProfile } from "./pages/Profile";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import "./App.css";

function Router() {
  const route = useRoute();
  const [path, id] = route.split("?")[0].split("/");
  const { user, authLoading } = useApp();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${path === "inicio" ? "Gás e água na sua porta" : path === "pedido" ? "Acompanhar pedido" : path.charAt(0).toUpperCase() + path.slice(1)} | Pede Gás`;
  }, [route, path]);
  let page;
  if (authLoading) page = <Loading />;
  else if (path === "inicio")
    page = user?.role === "admin" ? <Admin /> : <Home />;
  else if (path === "entrar" || path === "cadastro" || path === "recuperar")
    page = <Auth key={path} mode={path} />;
  else if (path === "carrinho") page = <Cart />;
  else if (path === "enderecos") page = <Addresses />;
  else if (path === "cupons") page = <Coupons />;
  else if (path === "pedidos") page = <Orders />;
  else if (path === "pedido" && id) page = <OrderTrack key={id} id={id} />;
  else if (path === "perfil") page = <Profile />;
  else if (path === "editar-perfil") page = <EditProfile key={user?.id} />;
  else if (path === "notificacoes") page = <Notifications />;
  else if (path === "historico" && user?.role === "admin")
    page = <Admin history />;
  else
    page = (
      <Empty title="Página não encontrada">
        <a className="button" href="#/inicio">
          Voltar para o início
        </a>
      </Empty>
    );
  return (
    <Layout>
      {page}
      {!authLoading && path === "inicio" && !user && <Onboarding />}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
