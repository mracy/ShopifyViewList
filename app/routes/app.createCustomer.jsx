import React, { useState, useCallback } from 'react';
import { Form, TextField, Button, Page, Card, Layout, Toast, Frame } from '@shopify/polaris';
import { useSubmit, useActionData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../shopify.server';

// Initialize Prisma client
const prisma = new PrismaClient();

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

    // Save to Shopify
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
      return json({ message: 'Customer creation failed in Shopify.' }, { status: 400 });
    }

    // Save to SQLite database
    try {
      await prisma.customer.create({
        data: {
          shopifyCustomerId: responseJson.data.customerCreate.customer.id,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone, // Ensure this field is defined in your Prisma schema
          addresses: {
            create: input.addresses.map((address) => ({
              street: address.address1,
              city: address.city,
              state: address.state || '', // Handle optional state
              postalCode: address.zip,
              country: address.country
            }))
          }
        }
      });
      
      console.log('Customer successfully added to database');
    } catch (dbError) {
      console.error('Database error:', dbError);
      return json({ message: 'Failed to save customer to the database.' }, { status: 500 });
    }

    return json({ message: 'Customer created successfully!' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
};

// CreateCustomerPage Component
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

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      const response = await submit(formData, { method: 'post' });
      const responseText = await response.text();

      if (!response.ok) {
        console.error('Response not OK:', response.status, responseText);
        setToast({
          message: 'Failed to submit form. Please try again.',
          isActive: true
        });
        return;
      }

      const result = JSON.parse(responseText);
      setToast({
        message: result.message || 'Customer creation failed with an unknown reason.',
        isActive: true
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      setToast({
        message: 'An unexpected error occurred.',
        isActive: true
      });
    }
  };

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
