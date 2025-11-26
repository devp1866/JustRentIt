import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from "next-auth/react";
import { useState } from 'react';
import '../styles/globals.css';
import Layout from '../components/Layout';

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export default function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider session={pageProps.session} refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Component {...pageProps} />
          <SpeedInsights />
          <Analytics />
        </Layout>
      </QueryClientProvider>
    </SessionProvider>
  );
}
