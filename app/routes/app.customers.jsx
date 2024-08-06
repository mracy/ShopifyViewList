import { Card, DataTable, Frame, Layout, Page, Text, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch data from Shopify API
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
      customers(first: 10) {
        edges {
          node {
            id
            createdAt
            tags
          }
        }
      }
    }
  `);

  // Parse and format the response
  const responseJson = await response.json();
  console.log(responseJson.data.customers.edges);
  return json(responseJson.data.customers);
};

// Customers component to display customer data
export default function Customers() {
  const { edges: customers } = useLoaderData();

  // Map customer data to rows for DataTable
  const rows = customers.map(({ node: customer }) => [
    customer.id,
    new Date(customer.createdAt).toLocaleDateString(), // Format the date
    customer.tags.join(', ') // Join tags with a comma
  ]);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Customers List
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['ID', 'Created At', 'Tags']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
