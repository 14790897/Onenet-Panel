import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OneNet IoT Hub - 下一代物联网数据管理平台',
  description: '专业的IoT数据管理平台，支持实时数据处理、企业级安全、全球部署。已服务10,000+企业用户，管理500万+IoT设备。立即开始30天免费试用！',
  keywords: [
    'OneNet', 'IoT平台', '物联网', '数据管理', '实时监控', 
    '设备管理', 'IoT Hub', '物联网平台', '数据分析', '云平台',
    '企业级安全', '全球部署', '团队协作'
  ],
  authors: [{ name: 'OneNet Team', url: 'https://onenet.com' }],
  creator: 'OneNet',
  publisher: 'OneNet',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'OneNet IoT Hub - 下一代物联网数据管理平台',
    description: '专业的IoT数据管理平台，已服务10,000+企业用户。实时数据处理、企业级安全、全球部署。立即开始30天免费试用！',
    url: 'https://onenet.com/promo',
    siteName: 'OneNet IoT Hub',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OneNet IoT Hub - 物联网数据管理平台',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneNet IoT Hub - 下一代物联网数据管理平台',
    description: '专业的IoT数据管理平台，已服务10,000+企业用户。立即开始30天免费试用！',
    images: ['/og-image.jpg'],
    creator: '@OneNetIoT',
  },
  alternates: {
    canonical: 'https://onenet.com/promo',
  },
  other: {
    'application-name': 'OneNet IoT Hub',
    'apple-mobile-web-app-title': 'OneNet',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#2563eb',
    'msapplication-tap-highlight': 'no',
  },
}
