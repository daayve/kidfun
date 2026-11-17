import './globals.css';

export const metadata = {
  title: 'Kid Fun',
  description: 'Family learning games',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
