import { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Action function for handling form submission
export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = new URLSearchParams(await request.text());

    const input = {
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

    const response = await admin.graphql(`
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            email
            firstName
            lastName
            addresses {
              address1
              city
              zip
              country
            }
            phone
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      variables: { input }
    });

    const responseJson = await response.json();

    if (responseJson.data.customerCreate.userErrors && responseJson.data.customerCreate.userErrors.length > 0) {
      return json({ message: 'Customer creation failed.' }, { status: 400 });
    }

    return json({ message: 'Customer created successfully!' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
};


export default function CreateCustomerPage() {
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

      // Log response status and text for debugging
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      // Check if the response is OK
      if (!response.ok) {
        console.error('Response not OK:', response.status, responseText);
        setToast({
          message: 'Failed to submit form. Please try again.',
          isActive: true
        });
        return;
      }

      // Parse JSON response
      const result = JSON.parse(responseText);
      console.log('Form submission result:', result);

      // Set appropriate toast message based on the response
      setToast({
        message: result.message || 'Customer creation failed with an unknown reason.',
        isActive: true
      });
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
      <Page title="Create Customer">
        <Layout>
          <Layout.Section>
            <Card>
              <Form onSubmit={handleSubmit}>
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
                <Button submit>Create Customer</Button>
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
