import React, { useState, useMemo, useEffect } from 'react';
import { ScenarioType, SimulationInputs, CapitalCostItem } from './types';
import { formatCurrency } from './utils/math';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, Wallet, TrendingUp, Settings, ChevronRight, ChevronLeft,
  Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertTriangle, Info,
  ArrowUpRight, ArrowDownRight, DollarSign, Users, Percent, Calendar,
  Lightbulb, BarChart3, Activity, Target, Zap, TrendingDown, Shield,
  PieChart, LineChart as LineChartIcon, ScatterChart, MoveRight, LogOut, User
} from 'lucide-react';

import { useSimulator } from './hooks/useSimulator';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/LoginScreen/LoginScreen';
import { InputGroup } from './components/InputGroup/InputGroup';
import { RangeInput } from './components/RangeInput/RangeInput';
import { MetricCard } from './components/MetricCard/MetricCard';
import { RiskIndicatorItem } from './components/RiskIndicatorItem/RiskIndicatorItem';
import { AdviceCard } from './components/AdviceCard/AdviceCard';
import { calculateMetrics } from './utils/math';

type TabType = 'dashboard' | 'costs' | 'settings' | 'whatif';

const App: React.FC = () => {
  const { isAuthenticated, logout, username } = useAuth();
  const [showLogin, setShowLogin] = useState(!isAuthenticated);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // What-if Analysis state
  const [whatIfVariable, setWhatIfVariable] = useState<keyof SimulationInputs>('churnRate');
  const [whatIfBaseValue, setWhatIfBaseValue] = useState(10);
  const [whatIfRange, setWhatIfRange] = useState({ min: 5, max: 30, step: 5 });

  // Capital Cost form state
  const [newCapitalName, setNewCapitalName] = useState('');
  const [newCapitalAmount, setNewCapitalAmount] = useState(0);
  const [newCapitalLife, setNewCapitalLife] = useState(36);
  const [newCapitalSalvage, setNewCapitalSalvage] = useState(0);
  const [newCapitalCategory, setNewCapitalCategory] = useState<CapitalCostItem['category']>('technology');

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  if (showLogin) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const {
    activeScenario,
    inputs,
    handleScenarioChange,
    updateInput,
    metrics,
    strategicAdvice,
    riskIndicators,
    chartData,
    saveSettings,
    resetSettings,
    settingsSaved,
    costItems,
    addCostItem,
    updateCostItem,
    deleteCostItem,
    totalMonthlyFixedCosts,
    // Capital Costs
    capitalCosts,
    addCapitalCost,
    updateCapitalCost,
    deleteCapitalCost,
    totalMonthlyDepreciation,
    totalCapitalInvestment,
    // Currency
    currency,
    setCurrencyType,
    toggleCurrency,
    exchangeRate,
    // Export/Import
    exportData,
    importData
  } = useSimulator();

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file)
        .then(() => {
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        })
        .catch((err) => {
          setImportError('فشل استيراد الملف. تأكد من صحة التنسيق.');
          console.error(err);
        });
      e.target.value = '';
    }
  };

  const handleAddCost = () => {
    if (newCostName.trim() && newCostAmount > 0) {
      addCostItem(newCostName, newCostAmount, 'fixed');
      setNewCostName('');
      setNewCostAmount(0);
    }
  };

  const handleAddCapitalCost = () => {
    if (newCapitalName.trim() && newCapitalAmount > 0) {
      addCapitalCost({
        name: newCapitalName,
        amount: newCapitalAmount,
        usefulLife: newCapitalLife,
        purchaseDate: new Date().toISOString().split('T')[0],
        salvageValue: newCapitalSalvage,
        category: newCapitalCategory
      });
      setNewCapitalName('');
      setNewCapitalAmount(0);
      setNewCapitalLife(36);
      setNewCapitalSalvage(0);
    }
  };

  // Update what-if base value when variable changes
  useEffect(() => {
    setWhatIfBaseValue(inputs[whatIfVariable] as number);

    // Set appropriate range based on variable
    const ranges: Record<string, { min: number; max: number; step: number }> = {
      churnRate: { min: 1, max: 50, step: 5 },
      avgRetentionMonths: { min: 1, max: 24, step: 1 },
      partnerCount: { min: 5, max: 500, step: 10 },
      avgReferralsPerPartner: { min: 1, max: 100, step: 5 },
      firstMonthCommission: { min: 0, max: 100, step: 5 },
      recurringCommission: { min: 0, max: 50, step: 5 },
      upfrontFeePerPartner: { min: 0, max: 10000, step: 500 },
      avgSubscriptionPrice: { min: 50, max: 1000, step: 50 },
      influencerDiscount: { min: 0, max: 50, step: 5 },
      conversionRate: { min: 0.5, max: 10, step: 0.5 },
      refundRate: { min: 0, max: 20, step: 1 },
      infraCostPerUser: { min: 5, max: 50, step: 5 },
      paymentGatewayFee: { min: 1, max: 5, step: 0.5 },
      supportCostPerUser: { min: 5, max: 50, step: 5 },
    };
    setWhatIfRange(ranges[whatIfVariable] || { min: 0, max: 100, step: 5 });
  }, [whatIfVariable, inputs]);

  // Generate what-if data
  const whatIfData = useMemo(() => {
    const values: number[] = [];
    const { min, max, step } = whatIfRange;
    for (let v = min; v <= max; v += step) {
      values.push(Number(v.toFixed(1)));
    }

    return values.map(value => {
      const modifiedInputs = { ...inputs, [whatIfVariable]: value };
      const m = calculateMetrics(modifiedInputs, totalMonthlyFixedCosts);
      return {
        value,
        ltv: m.ltv,
        cac: m.cac,
        netProfit12Months: m.netProfit12Months,
        grossMarginPercentage: m.grossMarginPercentage,
        paybackPeriod: m.paybackPeriod
      };
    });
  }, [whatIfVariable, whatIfRange, inputs, totalMonthlyFixedCosts]);

  // What-if insights
  const whatIfInsights = useMemo(() => {
    const base = whatIfData.find(d => Math.abs(d.value - whatIfBaseValue) < 0.1) || whatIfData[0];
    const best = whatIfData.reduce((max, d) => d.netProfit12Months > max.netProfit12Months ? d : max, whatIfData[0]);
    const worst = whatIfData.reduce((min, d) => d.netProfit12Months < min.netProfit12Months ? d : min, whatIfData[0]);

    const profitImprovement = best.netProfit12Months - base.netProfit12Months;
    const profitDecline = base.netProfit12Months - worst.netProfit12Months;
    const improvementPercent = base.netProfit12Months !== 0 ? ((profitImprovement / Math.abs(base.netProfit12Months)) * 100) : 0;

    return { base, best, worst, profitImprovement, profitDecline, improvementPercent };
  }, [whatIfData, whatIfBaseValue]);

  const variableLabels: Record<keyof SimulationInputs, string> = {
    churnRate: 'معدل الإلغاء',
    avgRetentionMonths: 'مدة البقاء',
    partnerCount: 'عدد الشركاء',
    avgReferralsPerPartner: 'الإحالات لكل شريك',
    firstMonthCommission: 'عمولة الشهر الأول',
    recurringCommission: 'العمولة المتكررة',
    upfrontFeePerPartner: 'المكافأة الأولية',
    avgSubscriptionPrice: 'سعر الاشتراك',
    influencerDiscount: 'خصم المؤثر',
    conversionRate: 'معدل التحويل',
    refundRate: 'معدل الاسترداد',
    infraCostPerUser: 'تكلفة البنية',
    paymentGatewayFee: 'رسوم الدفع',
    supportCostPerUser: 'تكلفة الدعم'
  };

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <header className="bg-slate-900 text-white py-6 px-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-indigo-500/30">Strategic Simulator</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">رادار المستثمر</h1>
              <p className="text-slate-400 text-xs">محاكي القرارات الاستراتيجية</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex items-center justify-between gap-3">
              <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm flex-1">
                {(Object.keys(ScenarioType) as ScenarioType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleScenarioChange(type)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      activeScenario === type
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {type === ScenarioType.OPTIMISTIC && <Zap className="w-3 h-3" />}
                    {type === ScenarioType.REALISTIC && <Target className="w-3 h-3" />}
                    {type === ScenarioType.PESSIMISTIC && <Shield className="w-3 h-3" />}
                    <span className="hidden sm:inline">{type === ScenarioType.OPTIMISTIC ? 'متفائل' : type === ScenarioType.REALISTIC ? 'واقعي' : 'متشائم'}</span>
                  </button>
                ))}
              </div>
              
              {/* Currency Toggle */}
              <button
                onClick={toggleCurrency}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 whitespace-nowrap"
                title="تغيير العملة"
              >
                <span className="text-lg">{currency === 'SAR' ? '🇸🇦' : '🇺🇸'}</span>
                <span>{currency}</span>
              </button>
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl backdrop-blur-sm">
                <span className="text-xs text-slate-400">سعر الصرف:</span>
                <span className="text-xs font-bold text-white">1 USD = {exchangeRate} SAR</span>
              </div>
              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-white font-semibold">{username || 'مستخدم'}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 bg-slate-800/50 text-slate-400 rounded-xl hover:text-white hover:bg-slate-700/50 transition-colors"
                title={isSidebarOpen ? 'إخفاء القائمة' : 'إظهار القائمة'}
              >
                {isSidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <div className="flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm flex-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">الرئيسية</span>
                </button>
                <button
                  onClick={() => setActiveTab('costs')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'costs'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">التكاليف</span>
                </button>
                <button
                  onClick={() => setActiveTab('whatif')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'whatif'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">ماذا لو</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">الإعدادات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {activeTab === 'dashboard' && (
          <>
            {isSidebarOpen && (
              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto">
                  <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    مدخلات القرار
                  </h2>

                  <InputGroup label="متغيرات العمولة والمكافأة">
                    <RangeInput
                      label="عمولة الشهر الأول"
                      value={inputs.firstMonthCommission}
                      min={0} max={100} suffix="%"
                      onChange={(v) => updateInput('firstMonthCommission', v)}
                    />
                    <RangeInput
                      label="العمولة المتكررة"
                      value={inputs.recurringCommission}
                      min={0} max={50} suffix="%"
                      onChange={(v) => updateInput('recurringCommission', v)}
                    />
                    <RangeInput
                      label="مكافأة أولية لكل شريك"
                      value={inputs.upfrontFeePerPartner}
                      min={0} max={10000} step={100} suffix=" ر.س"
                      onChange={(v) => updateInput('upfrontFeePerPartner', v)}
                    />
                  </InputGroup>

                  <InputGroup label="التسعير والخصم">
                    <RangeInput
                      label="متوسط سعر الاشتراك"
                      value={inputs.avgSubscriptionPrice}
                      min={50} max={1000} step={10} suffix=" ر.س"
                      onChange={(v) => updateInput('avgSubscriptionPrice', v)}
                    />
                    <RangeInput
                      label="خصم المؤثر للمتابعين"
                      value={inputs.influencerDiscount}
                      min={0} max={50} suffix="%"
                      onChange={(v) => updateInput('influencerDiscount', v)}
                    />
                  </InputGroup>

                  <InputGroup label="سلوك العملاء">
                    <RangeInput
                      label="معدل الإلغاء الشهري"
                      value={inputs.churnRate}
                      min={1} max={50} suffix="%"
                      onChange={(v) => updateInput('churnRate', v)}
                    />
                    <RangeInput
                      label="متوسط مدة البقاء"
                      value={inputs.avgRetentionMonths}
                      min={1} max={24}
                      onChange={(v) => updateInput('avgRetentionMonths', v)}
                    />
                  </InputGroup>

                  <InputGroup label="حجم الشركاء">
                    <RangeInput
                      label="عدد الشركاء الفاعلين"
                      value={inputs.partnerCount}
                      min={1} max={500}
                      onChange={(v) => updateInput('partnerCount', v)}
                    />
                    <RangeInput
                      label="متوسط الإحالات لكل شريك"
                      value={inputs.avgReferralsPerPartner}
                      min={1} max={100}
                      onChange={(v) => updateInput('avgReferralsPerPartner', v)}
                    />
                  </InputGroup>
                </div>
              </aside>
            )}

            <section className={isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  label="LTV (القيمة الدائمة)"
                  value={formatCurrency(metrics.ltv, currency)}
                  description="صافي الربح المتوقع من العميل الواحد"
                  status={metrics.ltv > (metrics.cac * 3) ? 'success' : metrics.ltv > (metrics.cac * 2) ? 'warning' : 'danger'}
                />
                <MetricCard
                  label="CAC (تكلفة الاستحواذ)"
                  value={formatCurrency(metrics.cac, currency)}
                  description="تكلفة الحصول على العميل"
                />
                <MetricCard
                  label="هامش الربح"
                  value={(metrics.grossMarginPercentage).toFixed(1) + '%'}
                  status={metrics.grossMarginPercentage < 30 ? 'danger' : 'default'}
                  description="نسبة الربح المتبقية"
                />
                <MetricCard
                  label="إجمالي المشتركين"
                  value={metrics.totalSubscribers.toLocaleString()}
                  description="العدد الكلي للمشتركين"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    توقعات الأرباح
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value, currency)}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="ربح" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    مؤشرات الجدوى
                  </h3>
                  <div className="space-y-4">
                    {riskIndicators.map((indicator, idx) => (
                      <RiskIndicatorItem key={idx} indicator={indicator} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  توصيات استراتيجية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategicAdvice.map((advice, idx) => (
                    <AdviceCard key={idx} {...advice} />
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <PieChart className="w-6 h-6" />
                      الخلاصة التنفيذية
                    </h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                      بناءً على المعايير الحالية، نظام الشراكة يولد عائداً صافياً جيداً للسنة الأولى. {metrics.paybackPeriod < 4 ? "نموذجك المالي قوي جداً ويسمح بالتوسع الهجومي." : "تحتاج إلى مراقبة التدفقات النقدية بعناية في الأشهر الأولى."}
                    </p>
                    <div className="flex gap-4">
                      <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex-1">
                        <p className="text-[10px] text-indigo-200 uppercase mb-1">صافي ربح 12 شهر</p>
                        <p className="text-xl font-bold">{formatCurrency(metrics.netProfit12Months, currency)}</p>
                      </div>
                      <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex-1">
                        <p className="text-[10px] text-indigo-200 uppercase mb-1">الربح من العميل</p>
                        <p className="text-xl font-bold">{formatCurrency(metrics.ltv, currency)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <h4 className="text-sm font-bold text-indigo-200 mb-4 text-center flex items-center justify-center gap-2">
                      <LineChartIcon className="w-4 h-4" />
                      تأثير الإلغاء على الأرباح
                    </h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[5, 10, 15, 20, 25, 30].map(c => ({ churn: c + '%', profit: calculateMetrics({ ...inputs, churnRate: c }, totalMonthlyFixedCosts).netProfit12Months }))}>
                          <Area type="monotone" dataKey="profit" stroke="#818cf8" fill="#818cf8" fillOpacity={0.2} strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-20 -ml-32 -mb-32"></div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'costs' && (
          <section className="lg:col-span-12 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-indigo-600" />
                التكاليف الشهرية الثابتة
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">اسم التكلفة</label>
                  <input
                    type="text"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    placeholder="مثال: إيجار المكتب، رواتب..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">المبلغ (ر.س)</label>
                  <input
                    type="number"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={handleAddCost}
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة تكلفة
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  قائمة التكاليف
                </h3>
                <div className="text-left">
                  <p className="text-sm text-slate-500">إجمالي التكاليف الشهرية</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalMonthlyFixedCosts, currency)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {costItems.filter(c => c.type === 'fixed').map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">تكلفة ثابتة</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateCostItem(item.id, { amount: Number(e.target.value) })}
                        className="w-32 px-3 py-1 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => deleteCostItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {costItems.filter(c => c.type === 'fixed').length === 0 && (
                  <p className="text-center text-slate-500 py-8 flex items-center justify-center gap-2">
                    <Info className="w-5 h-5" />
                    لا توجد تكاليف مضافة
                  </p>
                )}
              </div>
            </div>

            {/* Capital Costs Section */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border-2 border-dashed border-slate-300">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <PieChart className="w-6 h-6 text-indigo-600" />
                الأصول والتكاليف الرأسمالية (CapEx)
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                الأصول طويلة الأجل مثل الأجهزة والمعدات. يتم احتساب استهلاكها الشهري تلقائياً.
              </p>

              {/* Add Capital Cost Form */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  إضافة أصل جديد
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">اسم الأصل</label>
                    <input
                      type="text"
                      value={newCapitalName}
                      onChange={(e) => setNewCapitalName(e.target.value)}
                      placeholder="مثال: أجهزة لابتوب، ألواح شمسية"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">القيمة (ر.س)</label>
                    <input
                      type="number"
                      value={newCapitalAmount}
                      onChange={(e) => setNewCapitalAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">العمر الافتراضي (شهر)</label>
                    <input
                      type="number"
                      value={newCapitalLife}
                      onChange={(e) => setNewCapitalLife(Number(e.target.value))}
                      placeholder="36"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">الفئة</label>
                    <select
                      value={newCapitalCategory}
                      onChange={(e) => setNewCapitalCategory(e.target.value as CapitalCostItem['category'])}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="technology">تقنية وأجهزة</option>
                      <option value="equipment">معدات</option>
                      <option value="furniture">أثاث</option>
                      <option value="infrastructure">بنية تحتية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">القيمة المتبقية (ر.س)</label>
                    <input
                      type="number"
                      value={newCapitalSalvage}
                      onChange={(e) => setNewCapitalSalvage(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddCapitalCost}
                      className="w-full px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة الأصل
                    </button>
                  </div>
                </div>
              </div>

              {/* Capital Costs List */}
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    قائمة الأصول
                  </h3>
                  <div className="text-left">
                    <p className="text-xs text-slate-500">إجمالي الاستثمار الرأسمالي</p>
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(totalCapitalInvestment, currency)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-right py-3 px-2 font-medium text-slate-600">الأصل</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">الفئة</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">القيمة</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">العمر</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">القيمة المتبقية</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">الاستهلاك الشهري</th>
                        <th className="text-right py-3 px-2 font-medium text-slate-600">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capitalCosts.map((item) => {
                        const monthlyDep = (item.amount - item.salvageValue) / item.usefulLife;
                        const categoryLabels: Record<string, string> = {
                          technology: 'تقنية',
                          equipment: 'معدات',
                          furniture: 'أثاث',
                          infrastructure: 'بنية تحتية',
                          other: 'أخرى'
                        };
                        return (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-2 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-3 px-2">
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                {categoryLabels[item.category]}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-700">{formatCurrency(item.amount, currency)}</td>
                            <td className="py-3 px-2 text-slate-600">{item.usefulLife} شهر</td>
                            <td className="py-3 px-2 text-slate-600">{formatCurrency(item.salvageValue, currency)}</td>
                            <td className="py-3 px-2 font-bold text-indigo-600">{formatCurrency(monthlyDep, currency)}</td>
                            <td className="py-3 px-2">
                              <button
                                onClick={() => deleteCapitalCost(item.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {capitalCosts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                            <Info className="w-5 h-5" />
                            لا توجد أصول مضافة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  التكاليف الشهرية
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthlyFixedCosts, currency)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  الاستهلاك الشهري
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthlyDepreciation, currency)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  إجمالي الاستثمار
                </p>
                <p className="text-3xl font-bold">{formatCurrency(totalCapitalInvestment, currency)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  صافي الربح (12 شهر)
                </p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.netProfit12Months, currency)}</p>
              </div>
            </div>

            {/* Annual Cost Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                هيكل التكاليف السنوي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">التكاليف التشغيلية السنوية</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totalMonthlyFixedCosts * 12, currency)}</p>
                  <p className="text-xs text-slate-500 mt-2">إيجار، رواتب، خدمات</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">الاستهلاك السنوي</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalMonthlyDepreciation * 12, currency)}</p>
                  <p className="text-xs text-slate-500 mt-2">استهلاك الأصول الرأسمالية</p>
                </div>
                <div className="text-center p-6 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">إجمالي التكاليف السنوية</p>
                  <p className="text-3xl font-bold text-amber-600">{formatCurrency((totalMonthlyFixedCosts + totalMonthlyDepreciation) * 12, currency)}</p>
                  <p className="text-xs text-slate-500 mt-2">التكاليف الكاملة</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'whatif' && (
          <section className="lg:col-span-12 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">محاكاة ماذا لو</h2>
                  <p className="text-white/80 text-sm">تحليل الحساسية - افهم تأثير كل متغير على أرباحك</p>
                </div>
              </div>
              <p className="text-white/90 text-sm bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <Lightbulb className="w-4 h-4 inline ml-2" />
                اختر متغيراً من القائمة وشاهد كيف يؤثر تغييره على النتائج المالية. حرك الشريط لاستكشاف السيناريوهات المختلفة.
              </p>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    اختر المتغير للتحليل
                  </label>
                  <select
                    value={whatIfVariable}
                    onChange={(e) => setWhatIfVariable(e.target.value as keyof SimulationInputs)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-right font-medium"
                  >
                    <option value="churnRate">📉 معدل الإلغاء الشهري</option>
                    <option value="avgRetentionMonths">📅 متوسط مدة البقاء (أشهر)</option>
                    <option value="partnerCount">👥 عدد الشركاء الفاعلين</option>
                    <option value="avgReferralsPerPartner">🔗 متوسط الإحالات لكل شريك</option>
                    <option value="firstMonthCommission">💰 عمولة الشهر الأول</option>
                    <option value="recurringCommission">💵 العمولة المتكررة</option>
                    <option value="upfrontFeePerPartner">🎁 المكافأة الأولية لكل شريك</option>
                    <option value="avgSubscriptionPrice">🏷️ متوسط سعر الاشتراك</option>
                    <option value="influencerDiscount">🏷️ خصم المؤثر</option>
                    <option value="conversionRate">📊 معدل التحويل</option>
                    <option value="refundRate">↩️ معدل الاسترداد</option>
                    <option value="infraCostPerUser">🖥️ تكلفة البنية التحتية</option>
                    <option value="paymentGatewayFee">💳 رسوم بوابة الدفع</option>
                    <option value="supportCostPerUser">🎧 تكلفة الدعم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MoveRight className="w-4 h-4" />
                    حرك الشريط للتغيير
                  </label>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-600">القيمة الحالية:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {whatIfBaseValue}
                        {(whatIfVariable as string).includes('Rate') || (whatIfVariable as string).includes('Commission') || (whatIfVariable as string).includes('Discount') || (whatIfVariable as string).includes('Fee') ? '%' : ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={whatIfRange.min}
                      max={whatIfRange.max}
                      step={whatIfRange.step}
                      value={whatIfBaseValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setWhatIfBaseValue(val);
                        updateInput(whatIfVariable, val);
                      }}
                      className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>{whatIfRange.min}</span>
                      <span>{whatIfRange.max}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {whatIfData.map((data, idx) => {
                const isCurrent = Math.abs(data.value - whatIfBaseValue) < 0.1;
                const isBest = data.netProfit12Months === whatIfInsights.best.netProfit12Months;
                const isWorst = data.netProfit12Months === whatIfInsights.worst.netProfit12Months;

                return (
                  <div
                    key={idx}
                    className={`text-center p-4 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-lg scale-105 ring-2 ring-indigo-300'
                        : isBest
                        ? 'bg-emerald-50 border-2 border-emerald-500'
                        : isWorst
                        ? 'bg-red-50 border-2 border-red-500'
                        : 'bg-white border border-slate-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className={`text-sm font-bold ${isCurrent ? 'text-white' : 'text-slate-700'}`}>
                        {data.value}
                      </span>
                      {(whatIfVariable as string).includes('Rate') || (whatIfVariable as string).includes('Commission') || (whatIfVariable as string).includes('Discount') || (whatIfVariable as string).includes('Fee') ? (
                        <Percent className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                      ) : null}
                    </div>
                    <p className={`text-xs mb-1 ${isCurrent ? 'text-white/80' : 'text-slate-500'}`}>
                      {variableLabels[whatIfVariable]}
                    </p>
                    <p className={`text-lg font-bold ${isCurrent ? 'text-white' : isBest ? 'text-emerald-600' : isWorst ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatCurrency(data.netProfit12Months, currency)}
                    </p>
                    <p className={`text-[10px] ${isCurrent ? 'text-white/70' : 'text-slate-400'}`}>
                      ربح سنوي
                    </p>
                    {isBest && !isCurrent && (
                      <span className="inline-block mt-1 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">أفضل قيمة</span>
                    )}
                    {isWorst && !isCurrent && (
                      <span className="inline-block mt-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">أسوأ قيمة</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profit Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    تأثير على صافي الربح
                  </h3>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">12 شهر</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={whatIfData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="value"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value, currency)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label) => `${variableLabels[whatIfVariable]}: ${label}`}
                      />
                      <Bar dataKey="netProfit12Months" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* LTV Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                    تأثير على LTV
                  </h3>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">القيمة الدائمة</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={whatIfData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="value"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value, currency)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="ltv" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">القيمة المثلى</p>
                </div>
                <p className="text-3xl font-bold text-emerald-600 mb-1">
                  {whatIfInsights.best.value}
                  {(whatIfVariable as string).includes('Rate') || (whatIfVariable as string).includes('Commission') || (whatIfVariable as string).includes('Discount') || (whatIfVariable as string).includes('Fee') ? '%' : ''}
                </p>
                <p className="text-xs text-emerald-600 mb-2">تعطي أعلى ربح: {formatCurrency(whatIfInsights.best.netProfit12Months, currency)}</p>
                <div className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded inline-block">
                  +{formatCurrency(whatIfInsights.profitImprovement, currency)} عن الحالي
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">القيمة الحالية</p>
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-1">
                  {whatIfBaseValue}
                  {(whatIfVariable as string).includes('Rate') || (whatIfVariable as string).includes('Commission') || (whatIfVariable as string).includes('Discount') || (whatIfVariable as string).includes('Fee') ? '%' : ''}
                </p>
                <p className="text-xs text-slate-600 mb-2">ربح سنوي: {formatCurrency(whatIfInsights.base.netProfit12Months, currency)}</p>
                <div className="text-xs text-slate-700 bg-slate-200 px-2 py-1 rounded inline-block">
                  {whatIfInsights.improvementPercent > 0 ? '+' : ''}{whatIfInsights.improvementPercent.toFixed(1)}% للتحسين
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-red-800">أسوأ قيمة</p>
                </div>
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {whatIfInsights.worst.value}
                  {(whatIfVariable as string).includes('Rate') || (whatIfVariable as string).includes('Commission') || (whatIfVariable as string).includes('Discount') || (whatIfVariable as string).includes('Fee') ? '%' : ''}
                </p>
                <p className="text-xs text-red-600 mb-2">تعطي أقل ربح: {formatCurrency(whatIfInsights.worst.netProfit12Months, currency)}</p>
                <div className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded inline-block">
                  -{formatCurrency(whatIfInsights.profitDecline, currency)} عن الحالي
                </div>
              </div>
            </div>

            {/* Smart Recommendation */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    توصية ذكية
                    <span className="text-xs font-normal text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">بناءً على تحليلك</span>
                  </h4>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    {whatIfVariable === 'churnRate' && (
                      <>
                        <strong className="block mb-2">🎯 معدل الإلغاء هو العامل الأهم!</strong>
                        تخفيض معدل الإلغاء بنسبة 5% يمكن أن يزيد أرباحك بنسبة {whatIfInsights.improvementPercent.toFixed(1)}%.
                        ركّز على:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>تحسين تجربة المستخدم داخل المنصة</li>
                          <li>إضافة محتوى جديد بانتظام</li>
                          <li>برنامج ولاء للعملاء طويلي الأمد</li>
                          <li>متابعة العملاء الذين يوشكون على الإلغاء</li>
                        </ul>
                      </>
                    )}
                    {whatIfVariable === 'avgSubscriptionPrice' && (
                      <>
                        <strong className="block mb-2">💰 استراتيجية التسعير</strong>
                        زيادة السعر قد ترفع الأرباح، لكن اختبر أولاً:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>قدّم خططاً متعددة (أساسي، محترف، مميز)</li>
                          <li>اختبر السعر على شريحة صغيرة من العملاء</li>
                          <li>أضف قيمة مبررة للسعر الأعلى</li>
                          <li>راقب معدل التحويل بعد كل تغيير</li>
                        </ul>
                      </>
                    )}
                    {whatIfVariable === 'partnerCount' && (
                      <>
                        <strong className="block mb-2">👥 توسيع شبكة الشركاء</strong>
                        زيادة عدد الشركاء توسع الوصول، لكن:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>10 شركاء فاعلين أفضل من 50 غير فاعلين</li>
                          <li>وفّر أدوات تسويقية جاهزة للشركاء</li>
                          <li>أنشئ برنامج حوافز للأداء العالي</li>
                          <li>تتبع أداء كل شريك بشكل منفصل</li>
                        </ul>
                      </>
                    )}
                    {whatIfVariable === 'avgReferralsPerPartner' && (
                      <>
                        <strong className="block mb-2">🔗 تحسين أداء الشركاء</strong>
                        تحسين معدل الإحالات أكثر فعالية من زيادة العدد:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>قدّم قوالب محتوى جاهزة</li>
                          <li>أنشئ منافسات بين الشركاء</li>
                          <li>شارك قصص نجاح ملهمة</li>
                          <li>وفّر روابط تتبع ذكية</li>
                        </ul>
                      </>
                    )}
                    {whatIfVariable === 'firstMonthCommission' && (
                      <>
                        <strong className="block mb-2">💵 توازن العمولات</strong>
                        العمولة العالية تجذب الشركاء لكنها تقلل الأرباح:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>اختبر عمولات متدرجة حسب الأداء</li>
                          <li>قدّم مكافآت للمراحل milestones</li>
                          <li>اربط العمولة بجودة الإحالات</li>
                          <li>حافظ على هامش ربح لا يقل عن 30%</li>
                        </ul>
                      </>
                    )}
                    {whatIfVariable === 'upfrontFeePerPartner' && (
                      <>
                        <strong className="block mb-2">🎁 الرسو���� الأولية</strong>
                        الرسوم الثابتة تزيد المخاطرة:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>فكّر في نموذج "عمولة فقط" للشركاء الجدد</li>
                          <li>اربط الرسوم الأولية بعدد الإحالات المضمونة</li>
                          <li>قدّم خصماً للرسوم مع عمولة أعلى</li>
                          <li>اختبر بدون رسوم أولية تماماً</li>
                        </ul>
                      </>
                    )}
                    {!['churnRate', 'avgSubscriptionPrice', 'partnerCount', 'avgReferralsPerPartner', 'firstMonthCommission', 'upfrontFeePerPartner'].includes(whatIfVariable) && (
                      <>
                        <strong className="block mb-2">📊 تحسين المتغير</strong>
                        هذا المتغير يؤثر على نتائجك:
                        <ul className="mt-2 space-y-1 mr-4 list-disc">
                          <li>راقب تأثيره باستمرار</li>
                          <li>ا��بطه ب��اءً على الأداء الفعلي</li>
                          <li>قارنه مع معايير الصناعة</li>
                          <li>اختبر سيناريوهات مختلفة</li>
                        </ul>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ScatterChart className="w-5 h-5 text-indigo-600" />
                ملخص التأثير
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">نطاق الربحية</span>
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(whatIfInsights.best.netProfit12Months - whatIfInsights.worst.netProfit12Months, currency)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">الفرق بين أفضل وأسوأ سيناريو</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">نسبة التحسين الممكنة</span>
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {whatIfInsights.improvementPercent > 0 ? '+' : ''}{whatIfInsights.improvementPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">زيادة الربح بالوصول للقيمة المثلى</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="lg:col-span-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                إدارة الإعدادات
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">حالة الحفظ</p>
                  {settingsSaved ? (
                    <p className="text-emerald-600 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      تم حفظ الإعدادات محلياً
                    </p>
                  ) : (
                    <p className="text-amber-600 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      لديك تغييرات غير محفوظة
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={saveSettings}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    حفظ الإعدادات
                  </button>
                  <button
                    onClick={resetSettings}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    إعادة تعيين
                  </button>
                </div>

                {/* Export/Import Section */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    تصدير واستيراد البيانات
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={exportData}
                      className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      تصدير البيانات
                    </button>
                    
                    <label className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      استيراد بيانات
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {importSuccess && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">تم استيراد البيانات بنجاح!</span>
                    </div>
                  )}

                  {importError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-semibold">{importError}</span>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>تصدير البيانات:</strong> يحفظ جميع الإعدادات والتكاليف والأصول في ملف JSON.<br/>
                        <strong>استيراد البيانات:</strong> يحمّل الإعدادات من ملف JSON محفوظ.
                      </span>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>ملاحظة:</strong> يتم حفظ الإعدادات في متصفحك فقط (localStorage). لن تضيع البيانات عند إغلاق الصفحة، ولكن مسح بيانات المتصفح سيحذفها.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">LTV:CAC</span>
              <span className={`text-sm font-bold ${metrics.ltv / metrics.cac >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {(metrics.ltv / metrics.cac).toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-2 border-r pr-6 border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Payback</span>
              <span className="text-sm font-bold text-slate-700">{metrics.paybackPeriod.toFixed(1)}m</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            أداة محاكاة - رادار المستثمر © 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
