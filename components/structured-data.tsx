'use client'

import { useEffect } from 'react'

export default function StructuredData() {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "OneNet IoT Hub",
      "description": "专业的物联网数据管理平台，支持实时数据处理、企业级安全、全球部署",
      "url": "https://onenet.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": [
        {
          "@type": "Offer",
          "name": "免费版",
          "price": "0",
          "priceCurrency": "CNY",
          "description": "适合个人开发者和小型项目"
        },
        {
          "@type": "Offer",
          "name": "专业版",
          "price": "299",
          "priceCurrency": "CNY",
          "description": "适合中小企业和成长型团队"
        },
        {
          "@type": "Offer",
          "name": "企业版",
          "price": "999",
          "priceCurrency": "CNY",
          "description": "适合大型企业和高并发场景"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "ratingCount": "10000"
      },
      "creator": {
        "@type": "Organization",
        "name": "OneNet Team"
      },
      "featureList": [
        "实时数据处理",
        "企业级安全",
        "全球部署",
        "团队协作",
        "数据可视化",
        "API接口"
      ]
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)

    return () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  return null
}
