import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query {
      orders(first: 250) {
        edges {
          node {
            id
            customer {
              id
            }
            lineItems(first: 250) {
              edges {
                node {
                  product {
                    id
                    title
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                  quantity
                  variant {
                    price
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const responseJson = await response.json();
  console.log('Response JSON:', responseJson);

  const orders = responseJson.data.orders.edges;

  // Aggregate spending by customer
  const customerSpending = {};

  orders.forEach(order => {
    const customer = order.node.customer;
    if (!customer) {
      console.warn('Missing customer data:', order);
      return;
    }

    const customerId = customer.id;
    if (!customerSpending[customerId]) {
      customerSpending[customerId] = {
        id: customerId,
        totalSpent: 0
      };
    }

    console.log('Processing order for customer:', customerId);

    order.node.lineItems.edges.forEach(lineItem => {
      const variant = lineItem.node.variant;
      if (!variant || !variant.price) {
        console.warn('Missing variant or price data:', lineItem);
        return;
      }

      // Directly parse the price field
      const price = parseFloat(variant.price);
      const quantity = lineItem.node.quantity;

      console.log(`Price: ${price}, Quantity: ${quantity}`);

      if (!isNaN(price) && !isNaN(quantity)) {
        customerSpending[customerId].totalSpent += price * quantity;
      } else {
        console.warn(`Invalid price or quantity: Price - ${price}, Quantity - ${quantity}`);
      }
    });
  });

  // Convert to array and sort
  const sortedCustomers = Object.values(customerSpending).sort((a, b) => b.totalSpent - a.totalSpent);

  return json(sortedCustomers);
};

export default function Customers() {
  const customers = useLoaderData();

  // Ensure rows include customer ID and formatted totalSpent
  const rows = customers.map(customer => [
    customer.id, // Add customer ID
    `$${(customer.totalSpent || 0).toFixed(2)}`
  ]);

  console.log('Rows data:', rows);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Most Valuable Customers
              </Text>
              <DataTable
                columnContentTypes={['text', 'text']}
                headings={['Customer ID', 'Total Spent']} // Add headings for clarity
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
