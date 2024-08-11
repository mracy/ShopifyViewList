import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';

// Server-Side Logic for Product Variant Creation
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const variantInput = {
    productId: formData.get('productId'),
    inventoryItem: {
      cost: parseFloat(formData.get('cost')),
      tracked: formData.get('tracked') === 'true',
    },
    inventoryPolicy: formData.get('inventoryPolicy'),
    inventoryQuantities: {
      availableQuantity: parseInt(formData.get('availableQuantity'), 10),
      locationId: formData.get('locationId'),
    },
    price: parseFloat(formData.get('price')),
    options: formData.get('options'),
  };

  try {
    const variantResponse = await admin.graphql(`
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
      variables: { input: variantInput }
    });

    const variantResponseJson = await variantResponse.json();

    if (variantResponseJson.userErrors && variantResponseJson.userErrors.length > 0) {
      return json({ errors: variantResponseJson.userErrors }, { status: 400 });
    }

    return json({ message: "Product variant created successfully.", variant: variantResponseJson.data.productVariantCreate.productVariant });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

export default function CreateProductVariantPage() {
  const [formData, setFormData] = useState({
    productId: '', cost: '', tracked: 'true', inventoryPolicy: 'DENY',
    availableQuantity: '', locationId: '', price: '', options: '',
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
      setToast({ active: true, message: 'Product variant created successfully!' });
    } else {
      setToast({ active: true, message: 'Variant creation failed.' });
    }
  };

  const handleToastDismiss = () => setToast({ ...toast, active: false });

  return (
    <Page title="Create Product Variant">
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSubmit}>
              {/* Variant Fields */}
              <TextField label="Product ID" value={formData.productId} onChange={handleChange('productId')} required />
              <TextField label="Cost" value={formData.cost} onChange={handleChange('cost')} type="number" step="0.01" required />
              <TextField label="Tracked" value={formData.tracked} onChange={handleChange('tracked')} required />
              <TextField label="Inventory Policy" value={formData.inventoryPolicy} onChange={handleChange('inventoryPolicy')} required />
              <TextField label="Available Quantity" value={formData.availableQuantity} onChange={handleChange('availableQuantity')} type="number" required />
              <TextField label="Location ID" value={formData.locationId} onChange={handleChange('locationId')} required />
              <TextField label="Price" value={formData.price} onChange={handleChange('price')} type="number" step="0.01" required />
              <TextField label="Options" value={formData.options} onChange={handleChange('options')} required />

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
