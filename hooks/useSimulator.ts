import { useState, useMemo, useEffect } from 'react';
import { ScenarioType, SimulationInputs, RiskIndicator, CostItem, CapitalCostItem, CurrencyType } from '../types';
import { DEFAULT_INPUTS } from '../constants';
import { calculateMetrics, calculateMonthlyDepreciation, calculateTotalCapitalInvestment, formatCurrency, formatPercent } from '../utils/math';

const STORAGE_KEY_SETTINGS = 'simulator_settings';
const STORAGE_KEY_COSTS = 'simulator_costs';
const STORAGE_KEY_CAPITAL = 'simulator_capital_costs';
const STORAGE_KEY_CURRENCY = 'simulator_currency';

// Fixed exchange rate: 1 USD = 3.75 SAR
const USD_SAR_RATE = 3.75;

const defaultCostItems: CostItem[] = [
  { id: '1', name: 'إيجار المكتب', amount: 5000, type: 'fixed' },
  { id: '2', name: 'رواتب الموظفين', amount: 15000, type: 'fixed' },
  { id: '3', name: 'تسويق وإعلانات', amount: 3000, type: 'fixed' },
  { id: '4', name: 'برامج وخدمات سحابية', amount: 1000, type: 'fixed' },
];

const defaultCapitalCosts: CapitalCostItem[] = [
  { id: 'c1', name: 'أجهزة لابتوب', amount: 15000, usefulLife: 36, purchaseDate: '2025-01-01', salvageValue: 3000, category: 'technology' },
  { id: 'c2', name: 'ألواح طاقة شمسية', amount: 25000, usefulLife: 240, purchaseDate: '2025-01-01', salvageValue: 5000, category: 'infrastructure' },
  { id: 'c3', name: 'مكتب وكراسي', amount: 8000, usefulLife: 60, purchaseDate: '2025-01-01', salvageValue: 1000, category: 'furniture' },
];

export const useSimulator = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(ScenarioType.REALISTIC);
  const [inputs, setInputs] = useState<SimulationInputs>(DEFAULT_INPUTS[ScenarioType.REALISTIC]);
  const [costItems, setCostItems] = useState<CostItem[]>(defaultCostItems);
  const [capitalCosts, setCapitalCosts] = useState<CapitalCostItem[]>(defaultCapitalCosts);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [currency, setCurrency] = useState<CurrencyType>('SAR');

  // Load settings and costs from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
      const savedCosts = localStorage.getItem(STORAGE_KEY_COSTS);
      const savedCapital = localStorage.getItem(STORAGE_KEY_CAPITAL);
      const savedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);

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

      if (savedCapital) {
        const parsedCapital = JSON.parse(savedCapital);
        if (Array.isArray(parsedCapital) && parsedCapital.length > 0) {
          setCapitalCosts(parsedCapital);
        }
      }

      if (savedCurrency) {
        const parsedCurrency = JSON.parse(savedCurrency);
        if (parsedCurrency.currency) {
          setCurrency(parsedCurrency.currency);
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
      localStorage.removeItem(STORAGE_KEY_CAPITAL);
      setInputs(DEFAULT_INPUTS[ScenarioType.REALISTIC]);
      setActiveScenario(ScenarioType.REALISTIC);
      setCostItems(defaultCostItems);
      setCapitalCosts(defaultCapitalCosts);
      setSettingsSaved(false);
    } catch (e) {
      console.error('Failed to reset settings', e);
    }
  };

  const setCurrencyType = (newCurrency: CurrencyType) => {
    setCurrency(newCurrency);
    localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify({ currency: newCurrency }));
  };

  const toggleCurrency = () => {
    const newCurrency = currency === 'SAR' ? 'USD' : 'SAR';
    setCurrencyType(newCurrency);
  };

  const exchangeRate = USD_SAR_RATE;
  const convertAmount = (amount: number, from: CurrencyType = 'SAR', to: CurrencyType = currency): number => {
    if (from === to) return amount;
    if (from === 'SAR' && to === 'USD') return amount / USD_SAR_RATE;
    if (from === 'USD' && to === 'SAR') return amount * USD_SAR_RATE;
    return amount;
  };

  // Export/Import functionality
  const exportData = () => {
    const exportObj = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      scenario: activeScenario,
      inputs,
      costItems,
      capitalCosts,
      currency
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulator-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          
          if (!imported.version || !imported.inputs) {
            throw new Error('Invalid file format');
          }

          if (imported.scenario) setActiveScenario(imported.scenario);
          if (imported.inputs) setInputs(imported.inputs);
          if (imported.costItems) setCostItems(imported.costItems);
          if (imported.capitalCosts) setCapitalCosts(imported.capitalCosts);
          if (imported.currency) setCurrency(imported.currency);

          // Save to localStorage
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
            inputs: imported.inputs,
            activeScenario: imported.scenario
          }));
          localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(imported.costItems || []));
          localStorage.setItem(STORAGE_KEY_CAPITAL, JSON.stringify(imported.capitalCosts || []));
          localStorage.setItem(STORAGE_KEY_CURRENCY, JSON.stringify({ currency: imported.currency || 'SAR' }));

          resolve(true);
        } catch (error) {
          console.error('Import failed:', error);
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
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

  // Capital Costs management
  const addCapitalCost = (item: Omit<CapitalCostItem, 'id'>) => {
    const newItem: CapitalCostItem = {
      ...item,
      id: Date.now().toString()
    };
    const updated = [...capitalCosts, newItem];
    setCapitalCosts(updated);
    localStorage.setItem(STORAGE_KEY_CAPITAL, JSON.stringify(updated));
  };

  const updateCapitalCost = (id: string, updates: Partial<CapitalCostItem>) => {
    const updated = capitalCosts.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setCapitalCosts(updated);
    localStorage.setItem(STORAGE_KEY_CAPITAL, JSON.stringify(updated));
  };

  const deleteCapitalCost = (id: string) => {
    const updated = capitalCosts.filter(item => item.id !== id);
    setCapitalCosts(updated);
    localStorage.setItem(STORAGE_KEY_CAPITAL, JSON.stringify(updated));
  };

  const totalMonthlyFixedCosts = useMemo(() => {
    return costItems.reduce((sum, item) => item.type === 'fixed' ? sum + item.amount : sum, 0);
  }, [costItems]);

  const totalMonthlyDepreciation = useMemo(() => {
    return calculateMonthlyDepreciation(capitalCosts);
  }, [capitalCosts]);

  const totalCapitalInvestment = useMemo(() => {
    return calculateTotalCapitalInvestment(capitalCosts);
  }, [capitalCosts]);

  const metrics = useMemo(() => calculateMetrics(
    inputs,
    totalMonthlyFixedCosts,
    totalMonthlyDepreciation,
    totalCapitalInvestment
  ), [inputs, totalMonthlyFixedCosts, totalMonthlyDepreciation, totalCapitalInvestment]);

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
    convertAmount,
    // Export/Import
    exportData,
    importData
  };
};
