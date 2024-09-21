import { Navigate, type RouteObject } from "react-router-dom";
import Listing from "./pages/listing";
import ManageCustomer from "./pages/manage-customer";
import RegisterCustomer from "./pages/register";

const routes: RouteObject[] = [
  {
    path: "/customers",
    element: <Listing />,
  },
  {
    path: "/customers/:id",
    element: <ManageCustomer />,
  },
  {
    path: "/customers/register",
    element: <RegisterCustomer />,
  },
  {
    path: "*",
    element: <Navigate to="/customers" />,
  },
];

export default routes;
