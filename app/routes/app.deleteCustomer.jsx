import { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Action function for handling form submission
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());
  const id = formData.get('id');

  try {
    console.log('Deleting customer with ID:', id); // Debugging line

    const response = await admin.graphql(`
      mutation customerDelete($id: ID!) {
        customerDelete(input: { id: $id }) {
          userErrors {
            field
            message
          }
          deletedCustomerId
        }
      }
    `, {
      variables: { id }
    });

    const responseJson = await response.json();
    console.log('GraphQL response:', responseJson); // Debugging line

    if (responseJson.data.customerDelete.userErrors && responseJson.data.customerDelete.userErrors.length > 0) {
      return json({ errors: responseJson.data.customerDelete.userErrors }, { status: 400 });
    }

    return json({ deletedCustomerId: responseJson.data.customerDelete.deletedCustomerId });
  } catch (error) {
    console.error('Unexpected error during customer deletion:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

// Component for deleting a customer
export default function DeleteCustomerPage() {
  const [id, setId] = useState('');
  const [toast, setToast] = useState({ message: '', isActive: false });
  const actionData = useActionData();
  const submit = useSubmit();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare form data
    const formData = new URLSearchParams({ id });

    try {
      // Send the request
      const response = await submit(formData, { method: 'post' });

      // Check if the response is OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Response not OK:', response.status, responseText);
        setToast({
          message: 'Failed to delete customer. Please try again.',
          isActive: true
        });
        return;
      }

      // Parse JSON response
      const result = await response.json();
      console.log('Form submission result:', result); // Debugging line

      // Check if customer was deleted
      if (result.deletedCustomerId) {
        setToast({
          message: 'Customer deleted successfully!',
          isActive: true
        });
      } else if (result.errors) {
        // Handle errors from the server
        const errorMessage = result.errors.map(error => error.message).join(', ');
        setToast({
          message: `Error: ${errorMessage}`,
          isActive: true
        });
      }
    } catch (error) {
      // Log the error
      console.error('Unexpected error during form submission:', error);
      setToast({
        message: 'An unexpected error occurred.',
        isActive: true
      });
    }
  };

  // Handle toast visibility
  const handleToastDismiss = useCallback(() => setToast((prev) => ({ ...prev, isActive: false })), []);

  return (
    <Frame>
      <Page title="Delete Customer">
        <Layout>
          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
                <TextField
                  label="Customer ID"
                  value={id}
                  onChange={(value) => setId(value)}
                  required
                />
                <Button submit>Delete Customer</Button>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
        {toast.isActive && (
          <Toast content={toast.message} onDismiss={handleToastDismiss} />
        )}
      </Page>
    </Frame>
  );
}


