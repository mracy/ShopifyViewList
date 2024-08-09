import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch data from Shopify API
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Fetch orders and draft orders
    const ordersResponse = await admin.graphql(`
      {
        orders(first: 250) {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                id
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `);

    const draftOrdersResponse = await admin.graphql(`
      {
        draftOrders(first: 250) {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                id
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
                    title
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    `);

    // Check if responses have errors
    if (!ordersResponse.ok || !draftOrdersResponse.ok) {
      throw new Error("Failed to fetch data from Shopify API");
    }

    // Parse and format the responses
    const ordersJson = await ordersResponse.json();
    const draftOrdersJson = await draftOrdersResponse.json();

    const orders = ordersJson.data.orders.edges || [];
    const draftOrders = draftOrdersJson.data.draftOrders.edges || [];

    // Sort orders by total price in descending order
    orders.sort((a, b) => {
      const priceA = parseFloat(a.node.totalPriceSet.shopMoney.amount);
      const priceB = parseFloat(b.node.totalPriceSet.shopMoney.amount);
      return priceB - priceA; // Descending order
    });

    // Sort draft orders by total price in descending order
    draftOrders.sort((a, b) => {
      const priceA = parseFloat(a.node.totalPriceSet.shopMoney.amount);
      const priceB = parseFloat(b.node.totalPriceSet.shopMoney.amount);
      return priceB - priceA; // Descending order
    });

    return json({ orders, draftOrders });
  } catch (error) {
    console.error(error);
    return json({ orders: [], draftOrders: [] }); // Return empty arrays on error
  }
};

// Orders component to display order data
export default function Orders() {
  const { orders, draftOrders } = useLoaderData();

  // Map order data to rows for DataTable
  const orderRows = orders.map(({ node: order }) => [
    order.id,
    new Date(order.createdAt).toLocaleDateString(), // Format the date
    order.totalPriceSet.shopMoney.amount + ' ' + order.totalPriceSet.shopMoney.currencyCode // Display total price
  ]);

  const draftOrderRows = draftOrders.map(({ node: draftOrder }) => [
    draftOrder.id,
    new Date(draftOrder.createdAt).toLocaleDateString(), // Format the date
    draftOrder.totalPriceSet.shopMoney.amount + ' ' + draftOrder.totalPriceSet.shopMoney.currencyCode // Display total price
  ]);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Orders List
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['ID', 'Created At', 'Total Price']}
                rows={orderRows}
              />
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Draft Orders List
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['ID', 'Created At', 'Total Price']}
                rows={draftOrderRows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
