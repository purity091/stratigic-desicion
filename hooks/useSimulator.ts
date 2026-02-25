import { useState, useMemo, useEffect } from 'react';
import { ScenarioType, SimulationInputs, RiskIndicator, CostItem } from '../types';
import { DEFAULT_INPUTS } from '../constants';
import { calculateMetrics, formatCurrency, formatPercent } from '../utils/math';

const STORAGE_KEY_SETTINGS = 'simulator_settings';
const STORAGE_KEY_COSTS = 'simulator_costs';

const defaultCostItems: CostItem[] = [
  { id: '1', name: 'إيجار المكتب', amount: 5000, type: 'fixed' },
  { id: '2', name: 'رواتب الموظفين', amount: 15000, type: 'fixed' },
  { id: '3', name: 'تسويق وإعلانات', amount: 3000, type: 'fixed' },
  { id: '4', name: 'برامج وخدمات سحابية', amount: 1000, type: 'fixed' },
];

export const useSimulator = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(ScenarioType.REALISTIC);
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS[ScenarioType.REALISTIC]);
  const [costItems, setCostItems] = useState<CostItem[]>(defaultCostItems);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load settings and costs from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const savedCosts = localStorage.getItem(STORAGE_KEY_COSTS);
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setInputs(parsed.inputs || DEFAULT_INPUTS[ScenarioType.REALISTIC]);
        setActiveScenario(parsed.activeScenario || ScenarioType.REALISTIC);
        setSettingsSaved(true);
      }
      
      if (savedCosts) {
        const parsedCosts = JSON.parse(savedCosts);
        if (Array.isArray(parsedCosts) && parsedCosts.length > 0) {
          setCostItems(parsedCosts);
        }
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }, []);

  const handleScenarioChange = (type: ScenarioType) => {
    setActiveScenario(type);
    setInputs(DEFAULT_INPUTS[type]);
    setSettingsSaved(false);
  };

  const updateInput = <K extends keyof SimulationInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setSettingsSaved(false);
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
        inputs,
        activeScenario
      }));
      setSettingsSaved(true);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const resetSettings = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_COSTS);
      setInputs(DEFAULT_INPUTS[ScenarioType.REALISTIC]);
      setActiveScenario(ScenarioType.REALISTIC);
      setCostItems(defaultCostItems);
      setSettingsSaved(false);
    } catch (e) {
      console.error('Failed to reset settings', e);
    }
  };

  const addCostItem = (name: string, amount: number, type: 'fixed' | 'variable' = 'fixed') => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name,
      amount,
      type
    };
    const updated = [...costItems, newItem];
    setCostItems(updated);
    localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(updated));
  };

  const updateCostItem = (id: string, updates: Partial<CostItem>) => {
    const updated = costItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setCostItems(updated);
    localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(updated));
  };

  const deleteCostItem = (id: string) => {
    const updated = costItems.filter(item => item.id !== id);
    setCostItems(updated);
    localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(updated));
  };

  const totalMonthlyFixedCosts = useMemo(() => {
    return costItems.reduce((sum, item) => item.type === 'fixed' ? sum + item.amount : sum, 0);
  }, [costItems]);

  const metrics = useMemo(() => calculateMetrics(inputs, totalMonthlyFixedCosts), [inputs, totalMonthlyFixedCosts]);

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
    chartData,
    // Settings & Costs
    saveSettings,
    resetSettings,
    settingsSaved,
    costItems,
    addCostItem,
    updateCostItem,
    deleteCostItem,
    totalMonthlyFixedCosts
  };
};
