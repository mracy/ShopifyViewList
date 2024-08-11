import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>

        <Link to="/app/createCustomer">Create Customer</Link>
        <Link to="/app/getAllCustomers">Get All Customer</Link>
        <Link to="/app/updateCustomer">Update Customer</Link>
        <Link to="/app/deleteCustomer">Delete Customer</Link>
        <Link to="/app/createProduct">Create Product</Link>
        <Link to="/app/createProductsVariants">Create Products Variants</Link>
        <Link to="/app/deleteProductAndVariants">Delete Products & Variants</Link>
        <Link to="/app/createOrder">Create Order</Link>
        <Link to="/app/products">Products</Link>
        <Link to="/app/customers">Customers</Link>
        <Link to="/app/orders">Orders</Link>
        <Link to="/app/getAllOrders">Get All Orders</Link>
        <Link to="/app/updateDraftOrder">Update Order</Link>
        <Link to="/app/deleteOrder">Delete Order</Link>
        <Link to="/app/setting">Setting</Link>

      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
