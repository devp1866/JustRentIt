import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from "next-auth/react";
import { useState } from 'react';
import '../styles/globals.css'; // adjust path as needed
import Layout from '../components/Layout'; // adjust path if you use src/

export default function MyApp({ Component, pageProps }) {
  // Use useState so QueryClient is only created once during hot reloads
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={pageProps.session}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </QueryClientProvider>
    </SessionProvider>
  );
}
