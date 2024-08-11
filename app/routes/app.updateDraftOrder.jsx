import React, { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Toast, Spinner, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from "@remix-run/node";
import { authenticate } from '../shopify.server';

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());

  const id = formData.get('id');
  if (!id) {
    return json({ errors: [{ field: 'id', message: 'ID is required.' }] }, { status: 400 });
  }

  const draftOrderInput = {
    lineItems: [
      {
        variantId: formData.get('productId') || "",
        quantity: parseInt(formData.get('quantity'), 10) || 1
      }
    ],
    customerId: formData.get('customerId') || null,
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
      mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
        draftOrderUpdate(id: $id, input: $input) {
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
            shippingAddress {
              address1
              city
              country
              zip
            }
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { id, input: draftOrderInput }
    });

    const responseJson = await response.json();

    if (responseJson.errors || (responseJson.data && responseJson.data.draftOrderUpdate.userErrors.length > 0)) {
      return json({ errors: responseJson.data.draftOrderUpdate.userErrors }, { status: 400 });
    }

    return json(responseJson.data.draftOrderUpdate);
  } catch (error) {
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

export default function UpdateDraftOrderPage() {
  const [formFields, setFormFields] = useState({
    id: '',
    customerId: '',
    productId: '',
    quantity: '',
    tags: '',
    address1: '',
    city: '',
    country: '',
    zip: ''
  });

  const [toast, setToast] = useState({ active: false, message: '' });
  const [loading, setLoading] = useState(false);
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

    if (!validateForm(formFields)) {
      setToast({
        message: 'Please fill in all required fields correctly.',
        active: true
      });
      return;
    }

    setLoading(true);
    const formData = new URLSearchParams(formFields);

    try {
      const response = await submit(formData, { method: 'post' });

      if (!response.ok) {
        const responseText = await response.text();
        setToast({
          message: 'Failed to submit form. Please try again.',
          active: true
        });
        return;
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        setToast({
          message: 'Draft order update failed: ' + result.errors.map(error => error.message).join(', '),
          active: true
        });
      } else if (result.draftOrder) {
        setToast({
          message: 'Draft order updated successfully!',
          active: true
        });
      } else {
        setToast({
          message: 'Draft order update failed with an unknown reason.',
          active: true
        });
      }
    } catch (error) {
      setToast({
        message: 'An unexpected error occurred.',
        active: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToastDismiss = useCallback(() => setToast((prev) => ({ ...prev, active: false })), []);

  const validateForm = (fields) => {
    return fields.id && fields.quantity && !isNaN(fields.quantity) && fields.address1 && fields.city && fields.country && fields.zip;
  };

  return (
    <Frame>
      <Page title="Update Draft Order">
        <Form onSubmit={handleSubmit}>
          <TextField
            label="Draft Order ID"
            value={formFields.id}
            onChange={handleChange('id')}
            required
          />
          <TextField
            label="Customer ID"
            value={formFields.customerId}
            onChange={handleChange('customerId')}
          />
          <TextField
            label="Product ID"
            value={formFields.productId}
            onChange={handleChange('productId')}
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
            required
          />
          <TextField
            label="City"
            value={formFields.city}
            onChange={handleChange('city')}
            required
          />
          <TextField
            label="Country"
            value={formFields.country}
            onChange={handleChange('country')}
            required
          />
          <TextField
            label="Zip"
            value={formFields.zip}
            onChange={handleChange('zip')}
            required
          />
          <Button submit primary disabled={loading}>
            {loading ? <Spinner size="small" /> : 'Update Draft Order'}
          </Button>
        </Form>
        {toast.active && (
          <Toast content={toast.message} onDismiss={handleToastDismiss} />
        )}
      </Page>
    </Frame>
  );
}