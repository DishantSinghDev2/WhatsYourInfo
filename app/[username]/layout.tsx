import { Suspense } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
        <Suspense>
            {children}
        </Suspense>
    </html>
  );
}
