// OTP88 Console Internationalization Dictionary (English & Chinese)
const OTP88_I18N = {
  en: {
    brandSubtitle: '',
    navTitle: 'CONSOLE NAVIGATION',
    
    // User Navigation Tabs
    navDashboard: 'Dashboard',
    navLogs: 'OTP Logs',
    navServices: 'Services',
    navRates: 'Carrier Rates',
    navApi: 'API & Keys',
    navBilling: 'Billing & Top-up',
    
    // Admin only Navigation Tabs
    navUsers: 'Manage Users',
    navAdminOtpLogs: 'Admin OTP Logs',
    
    signOut: 'Logout',
    adminLive: 'Admin Live',
    userLive: 'Developer Active',
    
    // Dashboard
    availBalance: 'Available Balance',
    deliverySla: 'Direct Route SLA',
    avgLatency: 'Avg Direct Latency',
    monthlyVolume: 'Monthly Volume',
    autoReload: '● Auto-reload active',
    allGreen: '● All nodes optimal',
    singaporePipe: 'Singapore Direct Pipe',
    growthRate: '+18.4% MoM growth',
    liveLogsTitle: 'LIVE DELIVERY STREAM',
    row: 'Row',
    txId: 'Transaction ID',
    recipient: 'Recipient MSISDN',
    carrierRoute: 'Carrier Route',
    avgDelivery: 'Avg Delivery',
    unitCost: 'Cost / Unit',
    status: 'Status',
    timestamp: 'Timestamp',
    
    // Services
    servicesTitle: 'ACTIVE CPaaS MESSAGING CHANNELS & PROTOCOLS',
    channelProto: 'Channel Protocol',
    routingShare: 'Routing Share',
    ratesTitle: 'GLOBAL DIRECT CARRIER PRICING GRID (USD / OTP)',
    country: 'Destination Country',
    sandboxTitle: 'Quick Sandbox Dispatcher',
    targetPhone: 'Target MSISDN',
    channelMode: 'Channel Mode',
    execDispatch: 'Execute Dispatch Simulation',
    
    // API
    apiTitle: 'API CREDENTIALS & SDK INTEGRATION',
    prodApiKey: 'Production Live API Key',
    jwtBearer: 'Bearer Signed JWT Session Token',
    copyKey: 'Copy Key',
    copyJwt: 'Copy Signed Token',
    webhookUrl: 'Webhook Destination URL',
    saveWebhook: 'Save Webhook',
    quickstartCode: 'Instant API Quickstart Example',
    
    // Billing
    currentBalance: 'Current Available Balance',
    topUpCredits: 'Top-up Enterprise Credits',
    payWithCard: 'Pay via Credit Card (Stripe)',
    payWithCrypto: 'Pay via USDT (TRC20 / ERC20)',
    invoicesHistory: 'INVOICES & TOP-UP TRANSACTION HISTORY',
    invoiceId: 'Invoice ID',
    date: 'Date',
    amount: 'Amount',
    method: 'Method',
    
    // Users (Admin)
    usersTitle: 'USERS DIRECTORY',
    tenantName: 'User Name',
    tenantEmail: 'Email Address',
    tenantRole: 'Role',
    tenantBalance: 'Balance (USD)',
    statusReady: 'Ready',
    addUser: 'Add User',
    editUser: 'Edit',
    editUserTitle: 'Edit User Details',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    statusLabel: 'Status',
    passwordOptional: 'New Password (Optional, min 6 chars)',
    totalUsers: 'Total Users',
    commitChanges: 'Commit Rate Updates to MongoDB',
    
    // Auth & Generic
    authPrompt: 'OTP88 PLATFORM ACCESS',
    signInTab: 'Sign In',
    registerTab: 'Create Account',
    usernameLabel: 'Username or Email',
    phoneLabel: 'Phone Number (E.164)',
    phonePlaceholder: '+60123456789',
    passwordLabel: 'Password',
    showPassword: 'Show Password',
    signInBtn: 'Sign In to Console',
    registerBtn: 'Register Developer Account',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    registerNowLink: 'Register now',
    signInLink: 'Sign in',
    region: 'AP-SOUTHEAST-1',
    latency: '0.8s'
  },
  zh: {
    brandSubtitle: '',
    navTitle: '控制台导航',
    
    // User Navigation Tabs
    navDashboard: '仪表盘',
    navLogs: 'OTP 日志',
    navServices: '通道服务',
    navRates: '全球费率',
    navApi: 'API 密钥',
    navBilling: '账单与充值',
    
    // Admin only Navigation Tabs
    navUsers: '用户管理',
    navAdminOtpLogs: '管理员 OTP 日志',
    
    signOut: '退出登录',
    adminLive: '管理员在线',
    userLive: '开发者已连接',
    
    // Dashboard
    availBalance: '可用账户余额',
    deliverySla: '直连线路 SLA',
    avgLatency: '平均直连延迟',
    monthlyVolume: '本月发送总量',
    autoReload: '● 自动充值开启',
    allGreen: '● 节点全绿运行',
    singaporePipe: '新加坡直连专线',
    growthRate: '+18.4% 环比增长',
    liveLogsTitle: '实时发送数据流',
    row: '序号',
    txId: '交易编号',
    recipient: '接收手机号',
    carrierRoute: '运营商线路',
    avgDelivery: '平均送达',
    unitCost: '单价成本',
    status: '状态',
    timestamp: '时间戳',
    
    // Services
    servicesTitle: '活跃 CPaaS 通信通道与协议',
    channelProto: '通道协议',
    routingShare: '路由占比',
    ratesTitle: '全球运营商直连报价表 (美元 / 条)',
    country: '目的国家/地区',
    sandboxTitle: '快速沙盒发送测试',
    targetPhone: '目标手机号',
    channelMode: '通道模式',
    execDispatch: '执行发送模拟',
    
    // API
    apiTitle: 'API 凭证与 SDK 集成',
    prodApiKey: '生产环境 API 密钥',
    jwtBearer: 'JWT 签名会话 Token',
    copyKey: '复制密钥',
    copyJwt: '复制 Token',
    webhookUrl: '回调 Webhook URL',
    saveWebhook: '保存配置',
    quickstartCode: '即时 API 接入示例',
    
    // Billing
    currentBalance: '当前可用余额',
    topUpCredits: '企业额度充值',
    payWithCard: '信用卡支付 (Stripe)',
    payWithCrypto: 'USDT 虚拟币充值 (TRC20 / ERC20)',
    invoicesHistory: '发票与充值交易记录',
    invoiceId: '发票号',
    date: '日期',
    amount: '金额',
    method: '支付方式',
    addUser: '添加用户',
    tenantName: '用户名 / 姓名',
    tenantEmail: '登录邮箱',
    tenantRole: '权限角色',
    tenantBalance: '账户余额 ($)',
    usersTitle: '用户管理列表',
    editUser: '编辑',
    editUserTitle: '编辑用户详情',
    saveChanges: '保存修改',
    cancel: '取消',
    statusLabel: '状态',
    passwordOptional: '重置密码 (可选，至少6位)',
    totalUsers: '用户总数',
    
    // 认证与注册与重置
    authPrompt: '安全身份验证与账户访问',
    signInTab: '账号登录',
    registerTab: '立即注册',
    usernameLabel: '用户名 / 邮箱',
    passwordLabel: '登录密码 (至少6位字符)',
    phoneLabel: '手机号码 (用于验证与通知)',
    phonePlaceholder: '+60123456789 或 +8613800138000',
    showPassword: '显示密码',
    signInBtn: '登 录 控 制 台',
    registerBtn: '立即注册并获取免费测试额度',
    noAccount: '还没有账号？',
    haveAccount: '已有账号？',
    registerNowLink: '立即免费注册',
    signInLink: '立即登录',
    statusReady: '就绪',
    region: '节点: 亚太新加坡 (AP-SOUTHEAST-1)',
    latency: '时延: 14ms',
    copied: '已复制到剪贴板！',
  }
};

if (typeof window !== 'undefined') {
  window.OTP88_I18N = OTP88_I18N;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OTP88_I18N;
}

