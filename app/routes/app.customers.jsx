import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";

// Helper function to fetch all customers
const fetchAllCustomers = async (admin) => {
  let allCustomers = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const response = await admin.graphql(`
      query {
        customers(first: 250${cursor ? `, after: "${cursor}"` : ''}) {
          edges {
            node {
              id
              displayName
              email
              phone
              addresses {
                address1
              }
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `);
    const jsonResponse = await response.json();
    const data = jsonResponse.data.customers.edges;
    allCustomers = [...allCustomers, ...data];
    hasNextPage = jsonResponse.data.customers.pageInfo.hasNextPage;
    cursor = data.length ? data[data.length - 1].cursor : null;
  }

  return allCustomers;
};

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch orders
  const ordersResponse = await admin.graphql(`
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
                  variant {
                    price
                  }
                  quantity
                }
              }
            }
          }
        }
      }
    }
  `);
  const ordersJson = await ordersResponse.json();
  const orders = ordersJson.data.orders.edges;

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

  // Fetch all customers
  const allCustomersResponse = await fetchAllCustomers(admin);
  const allCustomerData = allCustomersResponse.map(cust => ({
    id: cust.node.id,
    displayName: cust.node.displayName || 'N/A',
    email: cust.node.email || 'N/A',
    phone: cust.node.phone || 'N/A',
    addresses: cust.node.addresses.map(addr => addr.address1).join(', ') || 'N/A',
    totalSpent: 0 // Initialize with 0, will be updated if found in orders
  }));

  // Combine customer spending data with all customers
  allCustomerData.forEach(customer => {
    if (customerSpending[customer.id]) {
      customer.totalSpent = customerSpending[customer.id].totalSpent;
    }
  });

  // Sort customers by total spending in descending order
  const sortedCustomers = allCustomerData.sort((a, b) => b.totalSpent - a.totalSpent);

  return json(sortedCustomers);
};

export default function Customers() {
  const customers = useLoaderData();

  // Prepare rows with serial numbers
  const rows = customers.map((customer, index) => [
    index + 1, // Serial Number
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
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
                headings={['S.N.', 'Customer ID', 'Name', 'Email', 'Phone', 'Addresses', 'Total Spent']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
