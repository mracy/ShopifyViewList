import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());

  const productInput = {
    title: formData.get('title') || 'Default Title', // Example field
    // Add other fields for product creation as needed
  };

  try {
    // Step 1: Create a Product
    const productResponse = await admin.graphql(`
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { input: productInput }
    });

    const productResponseJson = await productResponse.json();

    if (productResponseJson.userErrors && productResponseJson.userErrors.length > 0) {
      return json({ errors: productResponseJson.userErrors }, { status: 400 });
    }

    const productId = productResponseJson.data.productCreate.product.id;

    const variantsInput = {
      variants: [
        {
          option: formData.get('option1'), // Update to `option` if required
          price: formData.get('price'),
          sku: formData.get('sku'),
          inventoryQuantity: parseInt(formData.get('inventoryQuantity'), 10),
          // Update fields according to the correct type
        }
      ]
    };

    // Step 2: Create Product Variants
    const variantsResponse = await admin.graphql(`
      mutation productVariantCreate($productId: ID!, $input: [ProductVariantInput!]!) {
        productVariantCreate(productId: $productId, input: $input) {
          product {
            id
          }
          productVariants {
            id
            metafields(first: 1) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { productId, input: variantsInput.variants }
    });

    const variantsResponseJson = await variantsResponse.json();

    if (variantsResponseJson.userErrors && variantsResponseJson.userErrors.length > 0) {
      return json({ errors: variantsResponseJson.userErrors }, { status: 400 });
    }

    return json(variantsResponseJson.data.productVariantCreate);
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};


export default function CreateProductPage() {
  const [title, setTitle] = useState(''); // Add state for the product title
  const [option1, setOption1] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState('');
  const [toast, setToast] = useState({ active: false, message: '' });
  const actionData = useActionData();
  const submit = useSubmit();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await submit(new URLSearchParams({
      title, // Include title in the form data
      option1,
      price,
      sku,
      inventoryQuantity
    }), { method: 'post' });

    if (response.ok) {
      setToast({ active: true, message: 'Product variants created successfully!' });
    } else {
      setToast({ active: true, message: 'Product creation failed.' });
    }
  };

  const handleToastDismiss = () => setToast({ ...toast, active: false });

  return (
    <Page title="Create Product Variants">
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              <TextField
                label="Product Title"
                value={title}
                onChange={(value) => setTitle(value)}
                required
              />
              <TextField
                label="Option 1"
                value={option1}
                onChange={(value) => setOption1(value)}
                required
              />
              <TextField
                label="Price"
                value={price}
                onChange={(value) => setPrice(value)}
                type="number"
                required
              />
              <TextField
                label="SKU"
                value={sku}
                onChange={(value) => setSku(value)}
                required
              />
              <TextField
                label="Inventory Quantity"
                value={inventoryQuantity}
                onChange={(value) => setInventoryQuantity(value)}
                type="number"
                required
              />
              <Button submit>Create Product Variants</Button>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
      {toast.active && (
        <Toast content={toast.message} onDismiss={handleToastDismiss} />
      )}
    </Page>
  );
}

