import React from 'react';
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

const App: React.FC = () => {
  const {
    activeScenario,
    inputs,
    handleScenarioChange,
    updateInput,
    metrics,
    strategicAdvice,
    riskIndicators,
    chartData
  } = useSimulator();

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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

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
                    <p className="text-xl font-bold">{formatCurrency(metrics.expectedProfit12Months)}</p>
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
                    <AreaChart data={[5, 10, 15, 20, 25, 30].map(c => ({ churn: c + '%', profit: calculateMetrics({ ...inputs, churnRate: c }).expectedProfit12Months }))}>
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
