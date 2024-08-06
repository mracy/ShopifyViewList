import { Page } from "@shopify/polaris";

// Define the functional component
function MyComponent() {

  const headingStyle = {
      color: 'blue',
      fontSize: '2rem',
      textAlign: 'center',
    };

  return (
    <Page>
      <h1 style={headingStyle}>Welcome to ViewList</h1>
    </Page>
  );
}

// Export the component
export default MyComponent;
