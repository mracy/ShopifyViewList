import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';

// Server-Side Logic for Product and Variant Creation
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const productInput = {
    title: formData.get('title'),
    vendor: formData.get('vendor'),
    productType: formData.get('productType'),
    tags: formData.get('tags').split(','), // Split tags by comma
  };

  const variantInput = {
    option1: formData.get('option1'),
    price: formData.get('price'),
    sku: formData.get('sku'),
    inventoryQuantity: parseInt(formData.get('inventoryQuantity'), 10),
    weight: formData.get('weight'),
    weightUnit: formData.get('weightUnit'),
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

    // Step 2: Create Product Variant
    const variantsResponse = await admin.graphql(`
      mutation productVariantCreate($input: ProductVariantInput!) {
        productVariantCreate(input: $input) {
          product {
            id
            title
          }
          productVariant {
            createdAt
            displayName
            id
            inventoryItem {
              unitCost {
                amount
              }
              tracked
            }
            inventoryPolicy
            inventoryQuantity
            price
            product {
              id
            }
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { input: { ...variantInput, productId } }
    });

    const variantsResponseJson = await variantsResponse.json();

    if (variantsResponseJson.userErrors && variantsResponseJson.userErrors.length > 0) {
      return json({ errors: variantsResponseJson.userErrors }, { status: 400 });
    }

    return json({ message: "Product and variant created successfully." });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

// Client-Side Component for Product and Variant Form
export default function CreateProductPage() {
  const [formData, setFormData] = useState({
    title: '', vendor: '', productType: '', tags: '',
    option1: '', price: '', sku: '', inventoryQuantity: '', weight: '', weightUnit: '',
  });
  const [toast, setToast] = useState({ active: false, message: '' });
  const actionData = useActionData();
  const submit = useSubmit();

  const handleChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData();

    Object.keys(formData).forEach(key => form.append(key, formData[key]));

    const response = await submit(form, { method: 'post' });

    if (response.ok) {
      setToast({ active: true, message: 'Product and variant created successfully!' });
    } else {
      setToast({ active: true, message: 'Product creation failed.' });
    }
  };

  const handleToastDismiss = () => setToast({ ...toast, active: false });

  return (
    <Page title="Create Product and Variant">
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              {/* Product Fields */}
              <TextField label="Title" value={formData.title} onChange={handleChange('title')} required />
              <TextField label="Vendor" value={formData.vendor} onChange={handleChange('vendor')} required />
              <TextField label="Product Type" value={formData.productType} onChange={handleChange('productType')} required />
              <TextField label="Tags (comma-separated)" value={formData.tags} onChange={handleChange('tags')} required />

              {/* Variant Fields */}
              <TextField label="Option 1" value={formData.option1} onChange={handleChange('option1')} required />
              <TextField label="Price" value={formData.price} onChange={handleChange('price')} type="number" step="0.01" required />
              <TextField label="SKU" value={formData.sku} onChange={handleChange('sku')} required />
              <TextField label="Inventory Quantity" value={formData.inventoryQuantity} onChange={handleChange('inventoryQuantity')} type="number" required />
              <TextField label="Weight" value={formData.weight} onChange={handleChange('weight')} required />
              <TextField label="Weight Unit" value={formData.weightUnit} onChange={handleChange('weightUnit')} required />

              {/* Submit Button */}
              <Button submit>Submit</Button>
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
