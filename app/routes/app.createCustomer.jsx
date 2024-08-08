import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';

export const action = async ({ request }) => {
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

  try {
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

    if (responseJson.userErrors && responseJson.userErrors.length > 0) {
      return json({ errors: responseJson.userErrors }, { status: 400 });
    }

    return json(responseJson.data.customerCreate.customer);
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ errors: [{ field: 'general', message: 'An unexpected error occurred.' }] }, { status: 500 });
  }
};

// Function to store data in an alternative location
async function storeInDatabase(customerData) {
  // Example implementation - replace with actual database logic
  try {
    // Save customerData to your database
    console.log('Storing customer data in database:', customerData);
    // Add your database logic here
  } catch (error) {
    console.error('Failed to store data in database:', error);
    // Handle database errors if needed
  }
}

export default function CreateCustomerPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [address1, setAddress1] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [toast, setToast] = useState({ active: false, message: '' });
  const [showToast, setShowToast] = useState(false);
  const actionData = useActionData();
  const submit = useSubmit();

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    const response = await submit(new URLSearchParams({
      firstName,
      lastName,
      email,
      address1,
      city,
      zip,
      phone
    }), { method: 'post' });

    if (response.ok) {
      setToast({ active: true, message: 'Customer created successfully!' });
      setShowToast(true);
    } else {
      setToast({ active: true, message: 'Customer creation failed.' });
      setShowToast(true);
    }
  };

  // Handle toast visibility
  const handleToastDismiss = useCallback(() => setShowToast(false), []);

  return (
    <div style={{ height: '250px' }}>
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
          {showToast && (
            <Toast content={toast.message} onDismiss={handleToastDismiss} />
          )}
        </Page>
      </Frame>
    </div>
  );
}
