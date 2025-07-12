import type { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import './globals.css'
import ChatwootWidget from "@/components/ChatwootWidget";

export const metadata: Metadata = {
  title: "OneNet IoT Hub",
  description: "OneNet物联网数据收集和管理平台",
  keywords: ["OneNet", "IoT", "物联网", "数据收集", "webhook"],
  authors: [{ name: "OneNet Team" }],
  creator: "OneNet",
  publisher: "OneNet",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg", sizes: "180x180", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "sdjtcw5tvu");
            `,
          }}
        />
      </head>
      <body>
        {children}
        <ChatwootWidget />
      </body>
    </html>
  );
}
