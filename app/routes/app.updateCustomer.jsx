import { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Action function for handling form submission
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = new URLSearchParams(await request.text());

  const input = {
    id: formData.get('id'),
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    addresses: [
      {
        address1: formData.get('address1'),
        city: formData.get('city'),
        zip: formData.get('zip'),
        country: 'US'
      }
    ],
    phone: formData.get('phone')
  };

  try {
    const response = await admin.graphql(`
      mutation customerUpdate($input: CustomerInput!) {
        customerUpdate(input: $input) {
          userErrors {
            field
            message
          }
          customer {
            id
            firstName
            lastName
            addresses {
              address1
            }
          }
        }
      }
    `, {
      variables: { input }
    });

    const responseJson = await response.json();

    if (responseJson.data.customerUpdate.userErrors && responseJson.data.customerUpdate.userErrors.length > 0) {
      return json({ errors: responseJson.data.customerUpdate.userErrors }, { status: 400 });
    }

    return json({ customer: responseJson.data.customerUpdate.customer });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

// Component for updating a customer
export default function UpdateCustomerPage() {
  const [id, setId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState({ message: '', isActive: false });
  const actionData = useActionData();
  const submit = useSubmit();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prepare form data
    const formData = new URLSearchParams({
      id,
      firstName,
      lastName,
      email,
      address1,
      city,
      zip,
      phone
    });

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
      console.log('Form submission result:', result);

      // Check for errors in the response
      if (result.errors && result.errors.length > 0) {
        setToast({
          message: 'Customer update failed: ' + result.errors.map(error => error.message).join(', '),
          isActive: true
        });
      } else if (result.customer) {
        // Confirm customer update
        setToast({
          message: 'Customer updated successfully!',
          isActive: true
        });
      } else {
        // Handle unexpected response
        setToast({
          message: 'Customer update failed with an unknown reason.',
          isActive: true
        });
      }
    } catch (error) {
      // Log the error
      console.error('Unexpected error:', error);
      setToast({
        message: 'An unexpected error occurred. Please try again.',
        isActive: true
      });
    }
  };

  // Handle toast visibility
  const handleToastDismiss = useCallback(() => setToast((prev) => ({ ...prev, isActive: false })), []);

  return (
    <Frame>
      <Page title="Update Customer">
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
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(value) => setFirstName(value)}
                  required
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(value) => setLastName(value)}
                  required
                />
                <TextField
                  label="Email"
                  value={email}
                  onChange={(value) => setEmail(value)}
                  type="email"
                  required
                />
                <TextField
                  label="Address"
                  value={address1}
                  onChange={(value) => setAddress1(value)}
                  required
                />
                <TextField
                  label="City"
                  value={city}
                  onChange={(value) => setCity(value)}
                  required
                />
                <TextField
                  label="Zip Code"
                  value={zip}
                  onChange={(value) => setZip(value)}
                  required
                />
                <TextField
                  label="Phone"
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  required
                />
                <Button submit>Update Customer</Button>
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
