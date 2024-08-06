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
        orders(first: 10) {
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
              lineItems(first: 10) {
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
    console.log(responseJson.data.orders.edges);
    return json(responseJson.data.orders);
  } catch (error) {
    console.error(error);
    return json({ orders: [] }); // Return an empty array on error
  }
};

// Orders component to display order data
export default function Orders() {
  const { edges: orders } = useLoaderData();

  // Map order data to rows for DataTable
  const rows = orders.map(({ node: order }) => [
    order.id,
    new Date(order.createdAt).toLocaleDateString(), // Format the date
    order.totalPriceSet.shopMoney.amount + ' ' + order.totalPriceSet.shopMoney.currencyCode // Display total price
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
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
