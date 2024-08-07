import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Card, DataTable, Frame, Layout, Page, Text, Thumbnail } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";

// Loader function to fetch and process product data
export const loader = async ({ request }) => {
  try {
    // Authenticate and fetch orders
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(`
      query {
        orders(first: 250) {
          edges {
            node {
              id
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

    // Aggregate quantities
    const productQuantities = {};

    orders.forEach(order => {
      order.node.lineItems.edges.forEach(lineItem => {
        const productId = lineItem.node.product.id;
        const quantity = lineItem.node.quantity;

        if (!productQuantities[productId]) {
          productQuantities[productId] = {
            id: productId,
            title: lineItem.node.product.title,
            totalQuantity: 0,
            imageUrl: lineItem.node.product.images.edges[0]?.node.url || 'https://via.placeholder.com/150',
            imageAlt: lineItem.node.product.images.edges[0]?.node.altText || 'Product Image',
          };
        }
        productQuantities[productId].totalQuantity += quantity;
      });
    });

    // Convert to array and sort
    const sortedProducts = Object.values(productQuantities).sort((a, b) => b.totalQuantity - a.totalQuantity);

    return json(sortedProducts);
  } catch (error) {
    console.error('Error fetching or processing product data:', error);
    return json([]);
  }
};

// Products component for rendering the product list
export default function Products() {
  const products = useLoaderData();

  // Ensure the products data is properly formatted
  const rows = products.map(product => [
    <Thumbnail
      key={product.id} // Added key for list rendering
      source={product.imageUrl}
      alt={product.imageAlt}
    />,
    product.title,
    product.totalQuantity
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
                columnContentTypes={['text', 'text', 'text']}
                headings={['Image', 'Title', 'Total Quantity Sold']}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
