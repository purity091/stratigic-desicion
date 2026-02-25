import { useState, useMemo } from 'react';
import { ScenarioType, SimulationInputs, RiskIndicator } from '../types';
import { DEFAULT_INPUTS } from '../constants';
import { calculateMetrics, formatCurrency, formatPercent } from '../utils/math';

export const useSimulator = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(ScenarioType.REALISTIC);
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS[ScenarioType.REALISTIC]);

  const handleScenarioChange = (type: ScenarioType) => {
    setActiveScenario(type);
    setInputs(DEFAULT_INPUTS[type]);
  };

  const updateInput = <K extends keyof SimulationInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const metrics = useMemo(() => calculateMetrics(inputs), [inputs]);

  const strategicAdvice = useMemo(() => {
    const advices: Array<{ title: string; content: string; type: 'info' | 'warning' | 'positive' }> = [];
    
    const ltvCacRatio = metrics.ltv / (metrics.cac || 1);
    
    if (ltvCacRatio < 2) {
      advices.push({
        title: "تحسين اقتصاديات الوحدة",
        content: "نسبة LTV إلى CAC منخفضة جداً. يجب تقليل العمولة الأولية أو رسوم المؤثرين الثابتة فوراً لضمان عدم استنزاف الكاش.",
        type: 'warning'
      });
    } else if (ltvCacRatio > 5) {
      advices.push({
        title: "فرصة للتوسع السريع",
        content: "أرقامك ممتازة! يمكنك زيادة ميزانية المكافآت أو العمولة لجذب المزيد من الشركاء الكبار دون الخوف على الربحية.",
        type: 'positive'
      });
    }

    if (inputs.churnRate > 15) {
      advices.push({
        title: "التركيز على الاحتفاظ (Retention)",
        content: "معدل الإلغاء مرتفع جداً. أي مجهود في التسويق سيضيع إذا لم يتم تحسين جودة المحتوى وتجربة المستخدم داخل الرادار.",
        type: 'warning'
      });
    }

    if (inputs.upfrontFeePerPartner > 1000 && inputs.avgReferralsPerPartner < 10) {
      advices.push({
        title: "إعادة تقييم الرسوم الثابتة",
        content: "أنت تدفع رسوماً أولية عالية لمؤثرين لا يجلبون عدداً كافياً من المشتركين. جرب نموذج 'العمولة فقط' لتقليل المخاطر.",
        type: 'info'
      });
    }

    if (metrics.grossMarginPercentage < 30) {
      advices.push({
        title: "رفع هوامش الربح",
        content: "التكاليف التشغيلية والعمولات تلتهم أغلب الدخل. ابحث عن طرق لخفض تكلفة البنية التحتية أو زيادة سعر الاشتراك السنوي.",
        type: 'warning'
      });
    }

    if (advices.length === 0) {
      advices.push({
        title: "خطة متوازنة",
        content: "الأرقام تشير إلى توازن جيد بين النمو والربحية. استمر في مراقبة جودة الإحالات من كل شريك على حدة.",
        type: 'info'
      });
    }

    return advices;
  }, [metrics, inputs]);

  const riskIndicators = useMemo((): RiskIndicator[] => {
    const indicators: RiskIndicator[] = [];
    const ltvCacRatio = metrics.ltv / (metrics.cac || 1);
    indicators.push({
      label: 'معدل LTV إلى CAC',
      value: ltvCacRatio.toFixed(1) + 'x',
      status: ltvCacRatio >= 3 ? 'safe' : ltvCacRatio >= 2 ? 'warning' : 'danger',
      description: 'يجب أن يكون العائد من العميل 3 أضعاف تكلفة الاستحواذ عليه.'
    });
    indicators.push({
      label: 'هامش الربح الإجمالي',
      value: formatPercent(metrics.grossMarginPercentage),
      status: metrics.grossMarginPercentage >= 40 ? 'safe' : metrics.grossMarginPercentage >= 20 ? 'warning' : 'danger',
      description: 'النسبة المتبقية لتغطية التكاليف الثابتة والتطوير.'
    });
    indicators.push({
      label: 'فترة الاسترداد',
      value: metrics.paybackPeriod.toFixed(1) + ' شهر',
      status: metrics.paybackPeriod <= 3 ? 'safe' : metrics.paybackPeriod <= 6 ? 'warning' : 'danger',
      description: 'الزمن اللازم لاسترداد تكلفة الاستحواذ على العميل.'
    });
    return indicators;
  }, [metrics]);

  const chartData = useMemo(() => [
    { name: '3 أشهر', ربح: metrics.expectedProfit3Months },
    { name: '6 أشهر', ربح: metrics.expectedProfit6Months },
    { name: '12 شهر', ربح: metrics.expectedProfit12Months },
  ], [metrics]);

  return {
    activeScenario,
    inputs,
    handleScenarioChange,
    updateInput,
    metrics,
    strategicAdvice,
    riskIndicators,
    chartData
  };
};
