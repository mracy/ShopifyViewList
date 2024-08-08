import React, { useState } from 'react';
import { json } from "@remix-run/node";
import { Form, TextField, Button, Page, Card, Layout, Toast } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { authenticate } from '../shopify.server'; // Adjust the import path as needed

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());

  // Extract and format draft order data
  const draftOrderInput = {
    lineItems: [
      {
        variantId: formData.get('productId') || "", // Ensure this ID is valid
        quantity: parseInt(formData.get('quantity'), 10) || 1
      }
    ],
    customerId: formData.get('customerId') || null, // Use customerId directly
    shippingAddress: {
      address1: formData.get('address1') || '',
      city: formData.get('city') || '',
      country: formData.get('country') || '',
      zip: formData.get('zip') || ''
    },
    tags: [formData.get('tags') || ""]
  };

  try {
    const response = await admin.graphql(`
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            lineItems {
              edges {
                node {
                  id
                  title
                  quantity
                }
              }
            }
            customer {
              id
              email
            }
            shippingAddress {
              address1
              city
              country
              zip
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { input: draftOrderInput }
    });

    const responseJson = await response.json();

    if (responseJson.errors || (responseJson.data && responseJson.data.draftOrderCreate.userErrors.length > 0)) {
      console.error('Draft order creation errors:', responseJson.data.draftOrderCreate.userErrors);
      return json({ errors: responseJson.data.draftOrderCreate.userErrors }, { status: 400 });
    }

    console.log('Draft order created successfully:', responseJson.data.draftOrderCreate.draftOrder);
    return json(responseJson.data.draftOrderCreate);
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

export default function CreateDraftOrderPage() {
  const [formFields, setFormFields] = useState({
    customerName: '',
    customerId: '', // This should be a valid customer ID
    email: '',
    productId: '', // This should be a valid variant ID
    quantity: '',
    tags: '',
    address1: '',
    city: '',
    country: '',
    zip: ''
  });
  const [toast, setToast] = useState({ active: false, message: '' });
  const actionData = useActionData();
  const submit = useSubmit();

  const handleChange = (field) => (value) => {
    setFormFields(prevFields => ({
      ...prevFields,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const response = await submit(new URLSearchParams(formFields), { method: 'post' });

    if (response.ok) {
      setToast({ active: true, message: 'Draft order created successfully!' });
    } else {
      setToast({ active: true, message: 'Draft order creation failed.' });
    }
  };

  return (
    <Page title="Create Draft Order">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Form onSubmit={handleSubmit}>
              <TextField
                label="Customer Name"
                value={formFields.customerName}
                onChange={handleChange('customerName')}
              />
              <TextField
                label="Customer ID"
                value={formFields.customerId}
                onChange={handleChange('customerId')}
                required
              />
              <TextField
                label="Email"
                value={formFields.email}
                onChange={handleChange('email')}
              />
              <TextField
                label="Product ID"
                value={formFields.productId}
                onChange={handleChange('productId')}
                required
              />
              <TextField
                label="Quantity"
                value={formFields.quantity}
                onChange={handleChange('quantity')}
                type="number"
                required
              />
              <TextField
                label="Tags"
                value={formFields.tags}
                onChange={handleChange('tags')}
              />
              <TextField
                label="Address 1"
                value={formFields.address1}
                onChange={handleChange('address1')}
              />
              <TextField
                label="City"
                value={formFields.city}
                onChange={handleChange('city')}
              />
              <TextField
                label="Country"
                value={formFields.country}
                onChange={handleChange('country')}
              />
              <TextField
                label="Zip"
                value={formFields.zip}
                onChange={handleChange('zip')}
              />
              <Button submit primary>Create Draft Order</Button>
            </Form>
            {toast.active && (
              <Toast content={toast.message} onDismiss={() => setToast({ active: false, message: '' })} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
