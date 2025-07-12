'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, ArrowRight, Zap, Shield, Globe, Users, TrendingUp, Award, Play, ChevronDown, Sparkles, Rocket, Heart, Target } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import './promo.css'
import PromoNavbar from '@/components/promo-navbar'
import StructuredData from '@/components/structured-data'

export default function PromoPage() {
  const [mounted, setMounted] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  useEffect(() => {
    setMounted(true)
    // 自动轮播推荐
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "实时数据处理",
      description: "毫秒级数据传输，确保您的IoT设备数据实时同步",
      highlight: "99.9% 可用性"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "企业级安全",
      description: "端到端加密，多重身份验证，保障您的数据安全",
      highlight: "ISO 27001 认证"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "全球部署",
      description: "覆盖全球的CDN网络，就近接入，降低延迟",
      highlight: "< 50ms 延迟"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "团队协作",
      description: "多用户权限管理，团队协作更高效",
      highlight: "无限团队成员"
    }
  ]

  const stats = [
    { number: "50,000+", label: "活跃设备", icon: <Target className="h-5 w-5" /> },
    { number: "99.9%", label: "服务可用性", icon: <Shield className="h-5 w-5" /> },
    { number: "< 50ms", label: "平均延迟", icon: <Zap className="h-5 w-5" /> },
    { number: "24/7", label: "技术支持", icon: <Heart className="h-5 w-5" /> }
  ]

  const plans = [
    {
      name: "免费版",
      price: "¥0",
      period: "/月",
      description: "适合个人开发者和小型项目",
      features: [
        "最多5个设备",
        "1GB数据存储",
        "基础API访问",
        "社区支持"
      ],
      popular: false,
      color: "from-gray-400 to-gray-600"
    },
    {
      name: "专业版",
      price: "¥299",
      period: "/月",
      description: "适合中小企业和成长型团队",
      features: [
        "最多100个设备",
        "50GB数据存储",
        "高级API访问",
        "实时监控面板",
        "邮件支持",
        "数据导出功能"
      ],
      popular: true,
      color: "from-blue-500 to-purple-600",
      savings: "立省 ¥600/年"
    },
    {
      name: "企业版",
      price: "¥999",
      period: "/月",
      description: "适合大型企业和高并发场景",
      features: [
        "无限设备数量",
        "500GB数据存储",
        "完整API访问",
        "自定义仪表板",
        "24/7专属支持",
        "高级分析报告",
        "私有部署选项"
      ],
      popular: false,
      color: "from-purple-500 to-pink-600"
    }
  ]

  const testimonials = [
    {
      name: "张明",
      company: "智能制造科技",
      role: "CTO",
      content:
        "OneNet平台帮助我们实现了工厂设备的智能化管理，生产效率提升了30%。数据可视化功能特别棒！",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "李华",
      company: "绿色能源集团",
      role: "技术总监",
      content:
        "数据处理速度非常快，界面简洁易用，团队很快就上手了。客服响应也很及时。",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
      name: "王芳",
      company: "智慧城市解决方案",
      role: "产品经理",
      content:
        "客服响应及时，技术支持专业，是我们信赖的合作伙伴。API文档也很详细。",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&crop=faces",
    },
    {
      name: "陈刚",
      company: "农业科技创新",
      role: "研发总监",
      content:
        "帮助我们实现了农业设备的远程监控，大大降低了运营成本，提高了管理效率。",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face",
    },
  ];

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <StructuredData />
      <PromoNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* 动态背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm animate-bounce">
              <Sparkles className="w-4 h-4 mr-2" />
              🚀 新用户专享优惠 - 首月5折
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent animate-fade-in">
              OneNet IoT Hub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              下一代物联网数据管理平台，让您的设备智能互联
            </p>
            <p className="text-lg mb-8 text-blue-200">
              已服务 <span className="font-bold text-white">10,000+</span> 企业用户，管理 <span className="font-bold text-white">500万+</span> IoT设备
            </p>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex justify-center mb-2 text-blue-200">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg">
                <Rocket className="mr-2 h-5 w-5" />
                免费试用 30 天
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-enhanced">
                <Play className="mr-2 h-5 w-5" />
                观看演示
              </Button>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              ✅ 无需信用卡 • ✅ 5分钟快速部署 • ✅ 24/7技术支持
            </p>
            
            {/* 向下箭头指示器 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-6 h-6 text-white/60" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              <Award className="w-4 h-4 mr-2" />
              行业领先
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              为什么选择 OneNet？
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              我们提供业界领先的IoT解决方案，助力您的数字化转型
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm group">
                <CardHeader className="pb-4">
                  <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${index % 2 === 0 ? 'from-blue-500 to-purple-600' : 'from-purple-500 to-pink-600'} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-3">{feature.title}</CardTitle>
                  <Badge variant="outline" className="mb-4 text-xs">
                    {feature.highlight}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 特色展示 */}
          <div className="mt-20 text-center">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="p-12">
                <h3 className="text-3xl font-bold mb-6">🎯 专为中国市场定制</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <TrendingUp className="w-8 h-8 mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">本土化服务</h4>
                    <p className="text-blue-100">符合国内法规，中文技术支持</p>
                  </div>
                  <div>
                    <Shield className="w-8 h-8 mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">数据安全</h4>
                    <p className="text-blue-100">数据存储在境内，完全合规</p>
                  </div>
                  <div>
                    <Users className="w-8 h-8 mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">专业团队</h4>
                    <p className="text-blue-100">10年+IoT行业经验</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        {/* 背景装饰 */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">
              <Sparkles className="w-4 h-4 mr-2" />
              限时优惠
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              选择适合您的方案
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              灵活的定价方案，满足不同规模的业务需求
            </p>
            <div className="inline-flex bg-white rounded-full p-1 shadow-lg">
              <Badge className="bg-orange-100 text-orange-800 px-4 py-2">
                💰 年付可享8折优惠
              </Badge>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative transition-all duration-300 ${
                plan.popular 
                  ? 'ring-2 ring-blue-500 scale-105 shadow-2xl z-10' 
                  : 'hover:shadow-xl hover:-translate-y-2'
              } border-0 bg-white/90 backdrop-blur-sm overflow-hidden`}>
                {plan.popular && (
                  <>
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`}></div>
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                      ⭐ 最受欢迎
                    </Badge>
                  </>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <Badge className="bg-green-100 text-green-800 mb-4">
                      🎉 {plan.savings}
                    </Badge>
                  )}
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full py-3 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105' 
                        : ''
                    } transition-all duration-200`} 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.price === "¥0" ? "免费开始" : "立即购买"}
                    {plan.popular && <Sparkles className="ml-2 h-4 w-4" />}
                  </Button>
                  
                  {plan.popular && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      🎁 包含免费迁移服务
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-4">需要更多设备或定制方案？</p>
            <Button variant="outline" size="lg" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              联系企业销售
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800">
              <Star className="w-4 h-4 mr-2" />
              客户好评
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              客户怎么说
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              来自全球 <span className="font-bold text-blue-600">10,000+</span> 用户的真实反馈
            </p>
          </div>
          
          {/* 轮播推荐 */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="flex justify-center space-x-1 mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  <div className="flex items-center justify-center space-x-4">
                    <img 
                      src={testimonials[currentTestimonial].avatar} 
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="text-left">
                      <p className="font-bold text-lg">{testimonials[currentTestimonial].name}</p>
                      <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
                      <p className="text-blue-600 font-medium">{testimonials[currentTestimonial].company}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 指示器 */}
            <div className="flex justify-center space-x-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentTestimonial 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* 所有推荐网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full border-2 border-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-blue-600 font-medium">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 信任标识 */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">受到行业领先企业信赖</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <Badge variant="outline" className="px-6 py-3 text-lg">华为云</Badge>
              <Badge variant="outline" className="px-6 py-3 text-lg">阿里云</Badge>
              <Badge variant="outline" className="px-6 py-3 text-lg">腾讯云</Badge>
              <Badge variant="outline" className="px-6 py-3 text-lg">百度智能云</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
            <Rocket className="w-4 h-4 mr-2" />
            立即开始您的IoT之旅
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">准备开始了吗？</h2>
          <p className="text-xl md:text-2xl mb-4 text-blue-100 leading-relaxed">
            加入 <span className="font-bold text-white">10,000+</span> 家企业，体验下一代IoT管理平台
          </p>
          <p className="text-lg mb-12 text-blue-200">
            30天免费试用，无风险体验完整功能
          </p>
          
          {/* 优势列表 */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Zap className="w-8 h-8 mx-auto mb-4 text-yellow-300" />
              <h3 className="font-semibold mb-2">5分钟快速部署</h3>
              <p className="text-blue-200 text-sm">即开即用，无需复杂配置</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Shield className="w-8 h-8 mx-auto mb-4 text-green-300" />
              <h3 className="font-semibold mb-2">数据安全保障</h3>
              <p className="text-blue-200 text-sm">银行级安全，合规认证</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Users className="w-8 h-8 mx-auto mb-4 text-purple-300" />
              <h3 className="font-semibold mb-2">专业技术支持</h3>
              <p className="text-blue-200 text-sm">24/7在线，中文服务</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-xl text-lg px-8 py-4">
              <Rocket className="mr-2 h-6 w-6" />
              免费试用 30 天
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="btn-outline-enhanced text-lg px-8 py-4">
              <Users className="mr-2 h-6 w-6" />
              联系销售团队
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-200 max-w-2xl mx-auto">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              无需信用卡
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              随时可取消
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-300" />
              免费数据迁移
            </div>
          </div>
          
          <p className="mt-8 text-blue-200">
            有疑问？
            <Link href="/contact" className="underline hover:text-white transition-colors ml-1 font-medium">
              联系我们的专家团队
            </Link>
            ，获取免费咨询
          </p>
        </div>
      </section>
    </div>
  )
}
