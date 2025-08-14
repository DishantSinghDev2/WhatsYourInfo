// // lib/ditblogs-provider.tsx (Create a new file)
// "use client";
// import { DITBlogsProvider } from '@dishistech/blogs-react';
// import Link from 'next/link';

// export function ClientDITBlogsProvider({ children }: { children: React.ReactNode }) {
//   // Here we use the core provider, but not the full layout component
//   return (
//     <DITBlogsProvider
//       apiKey={process.env.NEXT_PUBLIC_DITBLOGS_API_KEY!}
//       theme="light"
//       linkComponent={Link}
//     >
//       {children}
//     </DITBlogsProvider>
//   )
// }