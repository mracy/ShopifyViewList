import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Card, DataTable, Frame, Layout, Page, Text } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query {
      customers(first: 250) {
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
      }
    }
  `);

  const responseJson = await response.json();
  const customers = responseJson.data.customers.edges;

  const customerList = customers.map(customer => ({
    id: customer.node.id,
    displayName: customer.node.displayName || 'N/A',
    email: customer.node.email || 'N/A',
    phone: customer.node.phone || 'N/A',
    addresses: customer.node.addresses.map(addr => addr.address1).join(', ') || 'N/A'
  }));

  // Sort customers alphabetically by displayName
  const sortedCustomers = customerList.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return json(sortedCustomers);
};

export default function Customers() {
  const customers = useLoaderData();

  const rows = customers.map((customer, index) => [
    index + 1, // Serial Number
    customer.id,
    customer.displayName,
    customer.email,
    customer.phone,
    customer.addresses
  ]);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                All Customers
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
                headings={['S.N', 'Customer ID', 'Name', 'Email', 'Phone', 'Addresses']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
