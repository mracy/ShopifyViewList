import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch data from Shopify API
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
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
                presentmentMoney {
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

    // Check if the response has errors
    if (!response.ok) {
      throw new Error("Failed to fetch data from Shopify API");
    }

    // Parse and format the response
    const responseJson = await response.json();
    const orders = responseJson.data.orders.edges || [];

    // Sort orders by total price in descending order
    orders.sort((a, b) => {
      const priceA = parseFloat(a.node.totalPriceSet.shopMoney.amount);
      const priceB = parseFloat(b.node.totalPriceSet.shopMoney.amount);
      return priceB - priceA; // Descending order
    });

    return json({ edges: orders });
  } catch (error) {
    console.error(error);
    return json({ edges: [] }); // Return an empty array on error
  }
};

// Orders component to display order data
export default function Orders() {
  const data = useLoaderData();
  console.log(data); // Inspect the data structure

  // Check if orders and edges exist
  const orders = data.edges || [];

  // Map order data to rows for DataTable
  const rows = orders.map((order, index) => [
    index + 1, // Serial Number
    order.node.id,
    new Date(order.node.createdAt).toLocaleDateString(), // Format the date
    order.node.totalPriceSet.shopMoney.amount + ' ' + order.node.totalPriceSet.shopMoney.currencyCode // Display total price
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
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['S.N', 'ID', 'Created At', 'Total Price']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
