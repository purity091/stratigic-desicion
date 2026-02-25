import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { Lock, User, LogIn, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDefaultCredentials, setShowDefaultCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        onLoginSuccess();
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">رادار المستثمر</h1>
          <p className="text-slate-300 text-sm">محاكي القرارات الاستراتيجية</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">تسجيل الدخول</h2>
            <p className="text-slate-500 text-sm">أدخل بيانات الدخول للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                اسم المستخدم
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right"
                dir="ltr"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-right pr-12"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="animate-pulse">جاري الدخول...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Default Credentials Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowDefaultCredentials(!showDefaultCredentials)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {showDefaultCredentials ? 'إخفاء بيانات الدخول الافتراضية' : 'عرض بيانات الدخول الافتراضية'}
            </button>
          </div>

          {/* Default Credentials Info */}
          {showDefaultCredentials && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                بيانات الدخول الافتراضية:
              </p>
              <div className="space-y-2 text-sm" dir="ltr">
                <div className="flex justify-between">
                  <span className="text-slate-600">Username:</span>
                  <code className="bg-white px-2 py-1 rounded text-indigo-600 font-mono">admin</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Password:</span>
                  <code className="bg-white px-2 py-1 rounded text-indigo-600 font-mono">admin123</code>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                ⚠️ هذه بيانات تجريبية فقط. لا تستخدمها في بيئة إنتاجية.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6">
          © 2025 رادار المستثمر - جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
};
