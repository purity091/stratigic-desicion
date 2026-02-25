import React, { useState } from 'react';
import { ScenarioType } from './types';
import { formatCurrency } from './utils/math';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

import { useSimulator } from './hooks/useSimulator';
import { InputGroup } from './components/InputGroup/InputGroup';
import { RangeInput } from './components/RangeInput/RangeInput';
import { MetricCard } from './components/MetricCard/MetricCard';
import { RiskIndicatorItem } from './components/RiskIndicatorItem/RiskIndicatorItem';
import { AdviceCard } from './components/AdviceCard/AdviceCard';
import { calculateMetrics } from './utils/math';

type TabType = 'dashboard' | 'costs' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState(0);
  
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
    totalMonthlyFixedCosts
  } = useSimulator();

  const handleAddCost = () => {
    if (newCostName.trim() && newCostAmount > 0) {
      addCostItem(newCostName, newCostAmount, 'fixed');
      setNewCostName('');
      setNewCostAmount(0);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-slate-900 text-white py-8 px-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Strategic Simulator</span>
              <h1 className="text-2xl font-bold tracking-tight">رادار المستثمر: محاكي القرارات الاستراتيجية</h1>
            </div>
            <p className="text-slate-400 text-sm">أداة قياس الوحدة الاقتصادية (Unit Economics) لاتخاذ قرارات برنامج الشركاء</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              {(Object.keys(ScenarioType) as ScenarioType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleScenarioChange(type)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeScenario === type
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {type === ScenarioType.OPTIMISTIC ? '🚀 متفائل' : type === ScenarioType.REALISTIC ? '⚖️ واقعي' : '⚠️ متشائم'}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-800 p-1 rounded-lg justify-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 لوحة القيادة
              </button>
              <button
                onClick={() => setActiveTab('costs')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'costs'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💰 التكاليف
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚙️ الإعدادات
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {activeTab === 'dashboard' && (
          <>
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-32 max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
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
                    label="مكافأة أولية لكل شريك (ثابتة)"
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
                    label="متوسط مدة البقاء (أشهر)"
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

            <section className="lg:col-span-8 space-y-8">

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  label="LTV (القيمة الدائمة)"
                  value={formatCurrency(metrics.ltv)}
                  description="صافي الربح المتوقع من العميل الواحد بعد خصم العمولات والمصاريف"
                  status={metrics.ltv > (metrics.cac * 3) ? 'success' : metrics.ltv > (metrics.cac * 2) ? 'warning' : 'danger'}
                />
                <MetricCard
                  label="CAC (تكلفة الاستحواذ)"
                  value={formatCurrency(metrics.cac)}
                  description="إجمالي ما يتم صرفه للحصول على العميل (العمولة + نصيب المكافأة الثابتة)"
                />
                <MetricCard
                  label="هامش الربح"
                  value={(metrics.grossMarginPercentage).toFixed(1) + '%'}
                  status={metrics.grossMarginPercentage < 30 ? 'danger' : 'default'}
                  description="نسبة الربح المتبقية من إيراد العميل الكلي"
                />
                <MetricCard
                  label="إجمالي المشتركين"
                  value={metrics.totalSubscribers.toLocaleString()}
                  description="العدد الكلي المتوقع للمشتركين عبر شبكة الشركاء"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">توقعات الأرباح (صافي)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="ربح" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">مؤشرات الجدوى</h3>
                  <div className="space-y-4">
                    {riskIndicators.map((indicator, idx) => (
                      <RiskIndicatorItem key={idx} indicator={indicator} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.674a1 1 0 00.996-1.09L14.547 11.268A4.996 4.996 0 0012 10.5c-2.76 0-5 2.24-5 5 0 .282.023.558.067.828L7.56 16.1a1 1 0 00.996 1.09h1.107zM12 21v-4"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 5h-3m-12 0H3m15.364 4.364l-2.121-2.121M6.757 6.757l-2.121-2.121m12.728 0l2.121 2.121M6.757 17.243l2.121-2.121"></path></svg>
                  توصيات استراتيجية للقرار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategicAdvice.map((advice, idx) => (
                    <AdviceCard key={idx} {...advice} />
                  ))}
                </div>
              </div>

              <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-bold mb-4">الخلاصة التنفيذية</h3>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">بناءً على المعايير الحالية، نظام الشراكة يولد عائداً صافياً جيداً للسنة الأولى. {metrics.paybackPeriod < 4 ? "نموذجك المالي قوي جداً ويسمح بالتوسع الهجومي." : "تحتاج إلى مراقبة التدفقات النقدية بعناية في الأشهر الأولى."}</p>
                    <div className="flex gap-4">
                      <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex-1">
                        <p className="text-[10px] text-indigo-200 uppercase mb-1">صافي ربح 12 شهر</p>
                        <p className="text-xl font-bold">{formatCurrency(metrics.netProfit12Months)}</p>
                      </div>
                      <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 flex-1">
                        <p className="text-[10px] text-indigo-200 uppercase mb-1">الربح من العميل</p>
                        <p className="text-xl font-bold">{formatCurrency(metrics.ltv)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <h4 className="text-sm font-bold text-indigo-200 mb-4 text-center">تأثير الإلغاء على الأرباح</h4>
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
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
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
                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                إضافة تكلفة
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">قائمة التكاليف</h3>
                <div className="text-right">
                  <p className="text-sm text-slate-500">إجمالي التكاليف الشهرية</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalMonthlyFixedCosts)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {costItems.filter(c => c.type === 'fixed').map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
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
                        className="w-32 px-3 py-1 text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => deleteCostItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {costItems.filter(c => c.type === 'fixed').length === 0 && (
                  <p className="text-center text-slate-500 py-8">لا توجد تكاليف مضافة</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1">التكاليف السنوية</p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthlyFixedCosts * 12)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1">صافي الربح (12 شهر)</p>
                <p className="text-3xl font-bold">{formatCurrency(metrics.netProfit12Months)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-2xl shadow-lg">
                <p className="text-sm opacity-80 mb-1">نقطة التعادل الشهرية</p>
                <p className="text-3xl font-bold">{formatCurrency(totalMonthlyFixedCosts / (metrics.grossMarginPercentage / 100) || 0)}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="lg:col-span-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                إدارة الإعدادات
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">حالة الحفظ</p>
                  {settingsSaved ? (
                    <p className="text-emerald-600 font-semibold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      تم حفظ الإعدادات محلياً
                    </p>
                  ) : (
                    <p className="text-amber-600 font-semibold">⚠️ لديك تغييرات غير محفوظة</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={saveSettings}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    حفظ الإعدادات
                  </button>
                  <button
                    onClick={resetSettings}
                    className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    إعادة تعيين
                  </button>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>ملاحظة:</strong> يتم حفظ الإعدادات في متصفحك فقط (localStorage). لن تضيع البيانات عند إغلاق الصفحة، ولكن مسح بيانات المتصفح سيحذفها.
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
          <p className="text-[10px] text-slate-400 italic">أداة محاكاة - رادار المستثمر © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
