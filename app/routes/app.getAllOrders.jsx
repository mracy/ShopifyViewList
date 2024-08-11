import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch data from Shopify API
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Fetch orders and draft orders with total price, customer details, and line items
    const ordersResponse = await admin.graphql(`
      {
        orders(first: 250) {
          edges {
            node {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                firstName
                lastName
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
                    variant {
                      id
                    }
                    product {
                      id
                      title
                    }
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
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                firstName
                lastName
              }
              lineItems(first: 250) {
                edges {
                  node {
                    id
                    variant {
                      id
                    }
                    product {
                      id
                      title
                    }
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

    // Return data
    return json({ orders, draftOrders });
  } catch (error) {
    console.error(error);
    return json({ orders: [], draftOrders: [] }); // Return empty arrays on error
  }
};

// Function to format line items into a serial-numbered list with line breaks
const formatLineItems = (lineItems) => {
  return lineItems.map((item, index) => (
    <p key={item.variantId}>
      {`${index + 1}. Product Title: ${item.productTitle}, Product ID: ${item.productId}, Variant ID: ${item.variantId}`}
    </p>
  ));
};

// Orders component to display order data
export default function Orders() {
  const { orders, draftOrders } = useLoaderData();

  // Map order data to rows for DataTable with Serial Number
  const orderRows = orders.map((order, index) => {
    // Get product and variant IDs from line items
    const lineItems = order.node.lineItems.edges.map(lineItem => {
      return {
        variantId: lineItem.node.variant.id,
        productId: lineItem.node.product.id,
        productTitle: lineItem.node.product.title // Include product title
      };
    });

    return [
      index + 1, // Serial Number
      order.node.id,
      order.node.name,
      order.node.customer ? `${order.node.customer.firstName} ${order.node.customer.lastName}` : 'N/A', // Customer Name
      order.node.totalPriceSet.shopMoney.amount + ' ' + order.node.totalPriceSet.shopMoney.currencyCode, // Display total price
      formatLineItems(lineItems) // Product and Variant IDs with line breaks
    ];
  });

  const draftOrderRows = draftOrders.map((draftOrder, index) => {
    // Get product and variant IDs from line items
    const lineItems = draftOrder.node.lineItems.edges.map(lineItem => {
      return {
        variantId: lineItem.node.variant.id,
        productId: lineItem.node.product.id,
        productTitle: lineItem.node.product.title // Include product title
      };
    });

    return [
      index + 1, // Serial Number
      draftOrder.node.id,
      draftOrder.node.name,
      draftOrder.node.customer ? `${draftOrder.node.customer.firstName} ${draftOrder.node.customer.lastName}` : 'N/A', // Customer Name
      draftOrder.node.totalPriceSet.shopMoney.amount + ' ' + draftOrder.node.totalPriceSet.shopMoney.currencyCode, // Display total price
      formatLineItems(lineItems) // Product and Variant IDs with line breaks
    ];
  });

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
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['S.N', 'ID', 'Name', 'Customer Name', 'Total Price', 'Products & Variants']}
                rows={orderRows}
                // Allows HTML content in cells
                rowMarkup={(row) => row.map((cell, i) => (
                  <td key={i} dangerouslySetInnerHTML={{ __html: cell }} />
                ))}
              />
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Draft Orders List
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['S.N', 'ID', 'Name', 'Customer Name', 'Total Price', 'Products & Variants']}
                rows={draftOrderRows}
                // Allows HTML content in cells
                rowMarkup={(row) => row.map((cell, i) => (
                  <td key={i} dangerouslySetInnerHTML={{ __html: cell }} />
                ))}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
