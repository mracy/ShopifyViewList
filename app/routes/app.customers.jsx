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
              displayName
              email
              phone
              addresses {
                address1
              }
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
  const orders = responseJson.data.orders.edges;

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
        displayName: customer.displayName || 'N/A',
        email: customer.email || 'N/A',
        phone: customer.phone || 'N/A',
        addresses: customer.addresses.map(addr => addr.address1).join(', ') || 'N/A',
        totalSpent: 0
      };
    }

    order.node.lineItems.edges.forEach(lineItem => {
      const variant = lineItem.node.variant;
      if (!variant || !variant.price) {
        console.warn('Missing variant or price data:', lineItem);
        return;
      }

      const price = parseFloat(variant.price);
      const quantity = lineItem.node.quantity;

      if (!isNaN(price) && !isNaN(quantity)) {
        customerSpending[customerId].totalSpent += price * quantity;
      } else {
        console.warn(`Invalid price or quantity: Price - ${price}, Quantity - ${quantity}`);
      }
    });
  });

  const sortedCustomers = Object.values(customerSpending).sort((a, b) => b.totalSpent - a.totalSpent);

  return json(sortedCustomers);
};

export default function Customers() {
  const customers = useLoaderData();

  const rows = customers.map(customer => [
    customer.id,
    customer.displayName,
    customer.email,
    customer.phone,
    customer.addresses,
    `$${(customer.totalSpent || 0).toFixed(2)}`
  ]);

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
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['Customer ID', 'Name', 'Email', 'Phone', 'Addresses', 'Total Spent']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
