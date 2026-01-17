import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

// 特性数据
const features = [
  {
    id: 1,
    title: "安全存储",
    description: "您的文件将被安全加密存储，确保数据安全和隐私保护",
    icon: "fa-shield-alt",
    color: "text-blue-500"
  },
  {
    id: 2,
    title: "随时访问",
    description: "在任何设备上访问您的文件，电脑、手机、平板无缝同步",
    icon: "fa-globe",
    color: "text-green-500"
  },
  {
    id: 3,
    title: "轻松共享",
    description: "简单方便地与朋友、家人和同事共享文件和文件夹",
    icon: "fa-share-alt",
    color: "text-purple-500"
  },
  {
    id: 4,
    title: "自动备份",
    description: "重要文件自动备份，再也不用担心数据丢失",
    icon: "fa-sync-alt",
    color: "text-orange-500"
  }
];

// 用户评价数据
const testimonials = [
  {
    id: 1,
    name: "张明",
    role: "企业用户",
    content: "这个云存储服务彻底改变了我们团队的协作方式，文件共享从未如此简单。",
    avatar: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Portrait%20of%20a%20middle-aged%20Asian%20man%2C%20professional%20appearance%2C%20smiling&sign=b05b1d9c61ff71d8283321c0d9840f98"
  },
  {
    id: 2,
    name: "李华",
    role: "摄影师",
    content: "作为摄影师，我需要安全存储大量高清照片，这个服务提供了我需要的所有功能。",
    avatar: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Portrait%20of%20a%20young%20Asian%20woman%2C%20creative%20style%2C%20smiling&sign=0f1310a6f07f975b4199d3e4559fa7b9"
  },
  {
    id: 3,
    name: "王强",
    role: "学生",
    content: "免费存储空间对于学生来说非常慷慨，界面简洁易用，推荐给所有同学！",
    avatar: "https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=Portrait%20of%20a%20young%20Asian%20man%2C%20casual%20style%2C%20smiling&sign=810c4e1e4f3171e16c4b9f65fa243dfa"
  }
];

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // 轮播 testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* 导航栏 */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md py-3" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <i className="fa-solid fa-cloud text-xl"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">云存储</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">功能</a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">价格</a>
            <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">用户评价</a>
            <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">常见问题</a>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
            >
              <i className={`fa-solid ${theme === "light" ? "fa-moon" : "fa-sun"}`}></i>
            </button>
            
            <Link 
              to="/login" 
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-sign-in-alt"></i>
              <span>登录</span>
            </Link>
            
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow"
            >
              <span>免费注册</span>
            </Link>
            
            <button className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300">
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>
      
      <main>
        {/* Hero区域 */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 -z-10"></div>
          
          {/* 装饰元素 */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 dark:opacity-5"></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 dark:opacity-5"></div>
          
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2 space-y-6">
                <div className="inline-block px-4 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium mb-2">
                  安全可靠的云存储解决方案
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  随时随地<br />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">访问您的文件</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                  简单、安全、高效的云存储服务，为您提供10GB免费存储空间，轻松管理和共享您的文件。
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <span>立即开始使用</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                  <button className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 shadow-sm hover:shadow">
                    <i className="fa-solid fa-play-circle"></i>
                    <span>观看演示</span>
                  </button>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden">
                        <img 
                          src={`https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=User%20avatar%20${i}`} 
                          alt="用户头像" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">10,000+</span> 用户的信赖选择
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2 relative">
                <div className="relative z-10 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img 
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Cloud%20storage%20interface%20showing%20files%20and%20folders%2C%20modern%20UI%2C%20clean%20design&sign=abcc4efb66691b025dffdb58507b120c" 
                    alt="云存储界面展示" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 z-20 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <h3 className="font-medium">文件已安全备份</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">您的12个文件已成功同步到云端</p>
                </div>
                <div className="absolute -top-6 -right-6 z-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full filter blur-3xl opacity-20 dark:opacity-10"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 合作伙伴区域 */}
        <section className="py-12 bg-white dark:bg-gray-800/50">
          <div className="container mx-auto px-4">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">受到行业领先企业的信任</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
              {["公司A", "公司B", "公司C", "公司D", "公司E"].map((company, i) => (
                <div key={i} className="text-gray-400 dark:text-gray-500 font-bold text-xl">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* 特性区域 */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-medium">
                强大功能
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">为现代生活打造的云存储</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                我们提供一系列强大功能，满足您的个人和专业存储需求
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div 
                  key={feature.id}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${feature.color} bg-blue-50 dark:bg-blue-900/20 mb-5`}>
                    <i className={`fa-solid ${feature.icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">需要更多存储空间？</h3>
                  <p className="text-blue-100 mb-6">
                    升级到高级账户，获得更多存储空间、高级功能和优先支持
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-lg">
                      <span>查看会员计划</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                    <button className="inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-xl transition-colors">
                      <i className="fa-solid fa-info-circle"></i>
                      <span>了解更多</span>
                    </button>
                  </div>
                </div>
                <div className="md:w-1/2 relative min-h-[200px] md:min-h-0">
                  <img 
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=Cloud%20storage%20upgrade%20page%2C%20modern%20UI&sign=8ef88dbbab14038d4a879ffa2bceacff" 
                    alt="升级存储空间" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 价格区域 */}
        <section id="pricing" className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-4 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
                灵活定价
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">选择适合您的计划</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                无论您是个人用户还是企业团队，我们都有满足您需求的存储方案
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
              {/* 免费计划 */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">免费计划</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">适合个人使用的基础存储</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">¥0</span>
                    <span className="text-gray-500 dark:text-gray-400">/永久</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "10GB 存储空间",
                      "基础文件同步",
                      "标准文件分享",
                      "网页版访问",
                      "社区支持"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <i className="fa-solid fa-check text-green-500 mt-1"></i>
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to="/login" 
                    className="block w-full py-3 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  >
                    注册免费账户
                  </Link>
                </div>
              </div>
              
              {/* 高级计划 */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-600 dark:border-blue-500 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl relative transform md:-translate-y-4">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1">
                  最受欢迎
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">高级计划</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">适合个人和专业用户</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">¥19</span>
                    <span className="text-gray-500 dark:text-gray-400">/月</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "1TB 存储空间",
                      "高级文件同步",
                      "高级分享权限",
                      "多设备访问",
                      "优先邮件支持",
                      "文件版本历史",
                      "高级安全功能"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <i className="fa-solid fa-check text-green-500 mt-1"></i>
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="block w-full py-3 text-center bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-lg">
                    选择高级计划
                  </button>
                </div>
              </div>
              
              {/* 企业计划 */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className="p-8">
                  <h3 className="text-xl font-bold mb-2">企业计划</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">适合团队和企业使用</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">¥99</span>
                    <span className="text-gray-500 dark:text-gray-400">/月</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "10TB 存储空间",
                      "团队文件管理",
                      "高级权限控制",
                      "管理员控制台",
                      "高级安全功能",
                      "API 访问",
                      "24/7 专属支持"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <i className="fa-solid fa-check text-green-500 mt-1"></i>
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="block w-full py-3 text-center border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                    联系销售团队
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 用户评价区域 */}
        <section id="testimonials" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-4 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-sm font-medium">
                用户评价
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">用户如何评价我们的服务</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                来自各行各业的用户分享他们使用我们云存储服务的体验
              </p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-8">
                  <div className="inline-flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="fa-solid fa-star"></i>
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 italic">
                    "{testimonials[activeTestimonial].content}"
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                    <img 
                      src={testimonials[activeTestimonial].avatar} 
                      alt={testimonials[activeTestimonial].name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold">{testimonials[activeTestimonial].name}</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i === activeTestimonial ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    aria-label={`查看评价 ${i+1}`}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ区域 */}
        <section id="faq" className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-block px-4 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium">
                常见问题
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">您可能想了解的问题</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                我们收集了用户最常问的问题，如果您有其他疑问，请联系我们的支持团队
              </p>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  question: "如何开始使用云存储服务？",
                  answer: "只需注册一个免费账户，验证您的邮箱，然后您就可以立即开始上传和管理您的文件。我们提供简单直观的网页界面，以及适用于各种设备的客户端应用程序。"
                },
                {
                  question: "我的文件安全吗？如何保障我的数据安全？",
                  answer: "我们采用银行级别的加密技术保护您的数据，包括传输加密和存储加密。所有文件都存储在多个服务器位置，确保数据不会丢失。我们不会在未经您许可的情况下访问或分享您的文件。"
                },
                {
                  question: "我可以在哪些设备上访问我的文件？",
                  answer: "您可以通过任何带有浏览器的设备访问我们的网页版服务。我们还提供适用于Windows、macOS、iOS和Android的客户端应用程序，让您随时随地访问您的文件。"
                },
                {
                  question: "如何与他人共享我的文件？",
                  answer: "共享文件非常简单，只需选择要共享的文件或文件夹，点击'共享'按钮，输入收件人的邮箱地址，设置访问权限（查看或编辑），然后发送邀请即可。您还可以创建共享链接，通过任何渠道分享。"
                },
                {
                  question: "如果我超出了存储空间限制会怎样？",
                  answer: "如果您使用的是免费计划并超出了10GB的存储空间，您将无法上传新文件，直到您删除一些文件或升级到高级计划。高级计划用户如果超出限制，系统会提供7天的宽限期，之后也需要升级或删除文件。"
                }
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none">
                    <span className="font-medium text-lg">{item.question}</span>
                    <i className="fa-solid fa-plus text-gray-400 transition-transform duration-300"></i>
                  </button>
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-300">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA区域 */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
                <div className="md:w-2/3 mb-8 md:mb-0">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    准备好开始使用最可靠的云存储服务了吗？
                  </h2>
                  <p className="text-blue-100 text-lg max-w-xl">
                    立即注册，获得10GB免费存储空间，开始您的云存储之旅。
                  </p>
                </div>
                <div className="md:w-1/3 flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/login" 
                    className="flex-1 py-3 text-center bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-lg text-lg font-medium"
                  >
                    免费注册
                  </Link>
                  <Link 
                    to="/login" 
                    className="flex-1 py-3 text-center bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-xl transition-colors text-lg font-medium"
                  >
                    登录
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-gray-100 dark:bg-gray-800 pt-16 pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <i className="fa-solid fa-cloud text-xl"></i>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">云存储</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                提供安全、可靠、高效的云存储解决方案，让您的文件触手可及。
              </p>
              <div className="flex gap-4">
                {[
                  { icon: "fa-facebook", label: "Facebook" },
                  { icon: "fa-twitter", label: "Twitter" },
                  { icon: "fa-instagram", label: "Instagram" },
                  { icon: "fa-linkedin", label: "LinkedIn" },
                  { icon: "fa-youtube", label: "YouTube" }
                ].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    aria-label={social.label}
                  >
                    <i className={`fa-brands ${social.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>
            
            {[
              {
                title: "产品",
                links: ["功能", "价格", "下载", "更新日志", "路线图"]
              },
              {
                title: "资源",
                links: ["帮助中心", "教程", "API文档", "社区论坛", "支持"]
              },
              {
                title: "公司",
                links: ["关于我们", "博客", "招贤纳士", "媒体资源", "联系我们"]
              },
              {
                title: "法律",
                links: ["服务条款", "隐私政策", "Cookie政策", "数据处理", "GDPR"]
              }
            ].map((column, i) => (
              <div key={i}>
                <h4 className="font-bold mb-4">{column.title}</h4>
                <ul className="space-y-2">
                  {column.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} 云存储服务. 保留所有权利.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                服务条款
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                隐私政策
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Cookie设置
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;