import { Navigate, type RouteObject } from 'react-router-dom';
import Listing from './pages/listing';
import UpdateCustomer from './pages/update-customer';
import RegisterCustomer from './pages/register';

const routes: RouteObject[] = [
  {
    path: "/customers",
    element: <Listing />,
  },
  {
    path: "/customers/:id/edit",
    element: <UpdateCustomer />,
  },
  {
    path: "/customers/new",
    element: <RegisterCustomer />,
  },
  {
    path: "*",
    element: <Navigate to="/customers" />,
  }
]

export default routes;