import AuthLayout from "@/components/layout.tsx/AuthLayout";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   
      <AuthLayout>{children}</AuthLayout>
   
  );
}
