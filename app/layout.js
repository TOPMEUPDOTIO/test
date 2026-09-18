import './globals.css';

export const metadata = {
  title: 'topmeup | Keep the lights on',
  description: 'topmeup helps South African households share prepaid electricity topups securely.',
  metadataBase: new URL('https://topmeup.io'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
