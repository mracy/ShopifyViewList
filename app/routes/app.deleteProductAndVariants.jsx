import { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

// Server-Side Logic for Product and Variant Deletion
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());
  const productId = formData.get('productId');

  try {
    console.log('Deleting product with ID:', productId); // Debugging line

    const response = await admin.graphql(`
      mutation productDelete($id: ID!) {
        productDelete(input: { id: $id }) {
          userErrors {
            field
            message
          }
          deletedProductId
        }
      }
    `, {
      variables: { id: productId }
    });

    const responseJson = await response.json();
    console.log('GraphQL response:', responseJson); // Debugging line

    if (responseJson.data.productDelete.userErrors && responseJson.data.productDelete.userErrors.length > 0) {
      return json({ errors: responseJson.data.productDelete.userErrors }, { status: 400 });
    }

    return json({ deletedProductId: responseJson.data.productDelete.deletedProductId });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};


// Component for deleting a product and its variants
export default function DeleteProductPage() {
  const [productId, setProductId] = useState('');
  const [toast, setToast] = useState({ message: '', isActive: false });
  const actionData = useActionData();
  const submit = useSubmit();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare form data
    const formData = new URLSearchParams({ productId });

    try {
      // Send the request
      const response = await submit(formData, { method: 'post' });

      // Check if the response is OK
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Response not OK:', response.status, responseText);
        setToast({
          message: 'Failed to submit form. Please try again.',
          isActive: true
        });
        return;
      }

      // Parse JSON response
      const result = await response.json();
      console.log('Form submission result:', result); // Debugging line

      // Check for errors in the response
      if (result.errors && result.errors.length > 0) {
        setToast({
          message: 'Product deletion failed: ' + result.errors.map(error => error.message).join(', '),
          isActive: true
        });
      } else if (result.deletedProductId) {
        // Confirm product deletion
        setToast({
          message: 'Product deleted successfully!',
          isActive: true
        });
      } else {
        // Handle unexpected response
        setToast({
          message: 'Product deletion failed with an unknown reason.',
          isActive: true
        });
      }
    } catch (error) {
      // Log the error
      console.error('Unexpected error:', error);
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
      <Page title="Delete Product">
        <Layout>
          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
                <TextField
                  label="Product ID"
                  value={productId}
                  onChange={(value) => setProductId(value)}
                  required
                />
                <Button submit>Delete Product</Button>
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
