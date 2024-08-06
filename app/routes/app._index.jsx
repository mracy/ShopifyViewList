import { Page } from "@shopify/polaris";

// Define the functional component
function MyComponent() {

 const headingStyle = {
   fontSize: '2em',
   textAlign: 'center',
   margin: '20px 0',
   color: 'red'
 };

 const headingStyle1 = {
   fontSize: '1.5em',
   lineHeight: '1.6',
   margin: '10px 0',
   color: 'black'
 };

 const paragraphContainerStyle = {
   maxWidth: '800px',
   margin: '0 auto',
   padding: '20px',
   textAlign: 'center',
   color: 'black'
 };


  return (
    <Page>
      <h1 style={headingStyle}>Welcome to ViewList</h1>
      <div style={paragraphContainerStyle}>
        <h2 style={headingStyle1}>Discover a new way to manage and view your data with ViewList.</h2>
        <h2 style={headingStyle1}>Our platform offers an intuitive interface designed to streamline your workflow, providing easy access to key insights and information.</h2>
        <h2 style={headingStyle1}>Whether you're tracking performance metrics, analyzing trends, or simply keeping tabs on important data, ViewList is here to enhance your productivity.</h2>
        <h2 style={headingStyle1}>Our clean and modern design ensures a user-friendly experience, while our powerful features deliver the performance you need to stay ahead.</h2>
        <h2 style={headingStyle1}>Explore our tools, customize your view, and take control of your data with confidence.</h2>
      </div>
    </Page>

  );
}

// Export the component
export default MyComponent;
