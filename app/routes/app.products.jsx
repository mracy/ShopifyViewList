import { Card, DataTable, Frame, Layout, Page, Text, Thumbnail } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch data from Shopify API
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            status
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }
    }
  `);

  // Parse and format the response
  const responseJson = await response.json();
  console.log(responseJson.data.products.edges);
  return json(responseJson.data.products);
};

// Products component to display product data
export default function Products() {
  const { edges: products } = useLoaderData();

  const rows = products.map(({ node: product }) => [
    <Thumbnail
      source={product.images.edges[0]?.node.url || 'https://via.placeholder.com/150'}
      alt={product.images.edges[0]?.node.altText || 'Product Image'}
    />,
    product.title,
    product.status,
    `$${product.variants.edges[0]?.node.price || '0.00'}`, // Ensure price is formatted correctly
  ]);

  return (
    <Frame>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Products List
              </Text>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['Image', 'Title', 'Status', 'Price']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
