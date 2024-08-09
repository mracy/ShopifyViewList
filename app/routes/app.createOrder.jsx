import React, { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from "@remix-run/node";

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

    const formData = new URLSearchParams(formFields);

    try {
      // Send the request
      const response = await submit(formData, { method: 'post' });

      // Check if the response is OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Response not OK:', response.status, responseText);
        setToast({
          message: 'Failed to submit form. Please try again.',
          active: true
        });
        return;
      }

      // Parse JSON response
      const result = await response.json();
      console.log('Form submission result:', result);

      // Check for errors in the response
      if (result.errors && result.errors.length > 0) {
        setToast({
          message: 'Draft order update failed: ' + result.errors.map(error => error.message).join(', '),
          active: true
        });
      } else if (result.draftOrder) {
        // Confirm draft order update
        setToast({
          message: 'Draft order updated successfully!',
          active: true
        });
      } else {
        // Handle unexpected response
        setToast({
          message: 'Draft order update failed with an unknown reason.',
          active: true
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setToast({
        message: 'An unexpected error occurred.',
        active: true
      });
    }
  };

  const handleToastDismiss = useCallback(() => setToast((prev) => ({ ...prev, active: false })), []);

  return (
    <Page title="Update Draft Order">
      <Layout>
        <Layout.Section>
          <Card sectioned>
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
              <Button submit primary>Update Draft Order</Button>
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
