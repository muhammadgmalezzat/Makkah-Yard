import { useState, useEffect } from "react";
import axios from "../api/axios";
import { useAuthStore } from "../store/authStore";

// Message Formatters
const formatManagementMessage = (data) => {
  const dayName = new Date(data.date).toLocaleDateString("ar-SA", {
    weekday: "long",
  });
  const dateStr = new Date(data.date).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "numeric",
  });

  let msg = `${dayName} ${dateStr} اليوم\n\n`;

  // Individual payment lines
  data.allPaymentsToday.forEach((p) => {
    const name = p.memberId?.fullName || "-";
    const role = p.memberId?.role;
    const roleLabel =
      role === "partner"
        ? "(شريك)"
        : role === "sub_adult"
          ? "(فرعي)"
          : role === "child"
            ? "(طفل)"
            : "";

    const pkg = p.subscriptionId?.packageId?.name || "أكاديمية";
    const amount = p.amount?.toLocaleString("ar-SA") || "-";

    const method =
      {
        cash: "نقد",
        network: "شبكة",
        tabby: "تابي",
        tamara: "تمارا",
        transfer: "تحويل",
      }[p.method] || p.method;

    const type =
      p.type === "renewal"
        ? "تجديد"
        : p.type === "package_change"
          ? "تغيير باقة"
          : "جديد";

    msg += `${name} ${roleLabel} | ${pkg} | ${amount} ريال | ${method} | ${type}\n`;
  });

  msg += `\n`;

  // Gym packages
  Object.entries(data.gymByPackage).forEach(([name, count]) => {
    msg += `${count} ${name}\n`;
  });

  msg += `\nالأكاديميات:\n`;

  if (Object.keys(data.boysAcademy).length > 0) {
    msg += `أولاد\n`;
    msg += `أ.غ.م - `;
    msg += Object.entries(data.boysAcademy)
      .map(([s, c]) => `${c} ${s}`)
      .join(" - ");
    msg += `\n`;
  }

  if (Object.keys(data.girlsAcademy).length > 0) {
    msg += `بنات\n`;
    msg += `أ.غ.م - `;
    msg += Object.entries(data.girlsAcademy)
      .map(([s, c]) => `${c} ${s}`)
      .join(" - ");
    msg += `\n`;
  }

  msg += `\nالإجمالي من التجديد: ${data.renewalTotal.toLocaleString("ar-SA")}\n`;
  msg += `الإجمالي من الاشتراكات الجديدة: ${data.newTotal.toLocaleString(
    "ar-SA",
  )}\n`;
  msg += `الإجمالي: ${data.dayTotal.toLocaleString("ar-SA")}\n`;
  msg += `\nالمجموع الكلي للآن (${dateStr}): ${data.monthlyTotal.toLocaleString(
    "ar-SA",
  )}`;

  return msg;
};

const formatAccountingMessage = (data) => {
  const dateStr = new Date(data.date).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "numeric",
  });
  const dayName = new Date(data.date).toLocaleDateString("ar-SA", {
    weekday: "long",
  });

  let msg = `${dayName} ${dateStr}\n`;

  // List all payments with full member details
  data.allPaymentsToday.forEach((p) => {
    const name = p.memberId?.fullName || "-";
    const role = p.memberId?.role;
    const roleLabel =
      role === "partner"
        ? "(شريك)"
        : role === "sub_adult"
          ? "(فرعي)"
          : role === "child"
            ? "(طفل)"
            : "";

    const pkg = p.subscriptionId?.packageId?.name || "أكاديمية";
    const amount = p.amount?.toLocaleString("ar-SA") || "-";

    const method =
      {
        cash: "نقد",
        network: "شبكة",
        tabby: "تابي",
        tamara: "تمارا",
        transfer: "تحويل",
      }[p.method] || p.method;

    const type =
      p.type === "renewal"
        ? "تجديد"
        : p.type === "package_change"
          ? "تغيير باقة"
          : "جديد";

    msg += `${name} ${roleLabel} | ${pkg} | ${amount} ريال | ${method} | ${type}\n`;
  });

  msg += `\n`;
  Object.entries(data.gymByPackage).forEach(([name, count]) => {
    msg += `${count} ${name}\n`;
  });

  if (Object.keys(data.boysAcademy).length > 0) {
    msg += `أولاد\nأ.غ.م - `;
    msg += Object.entries(data.boysAcademy)
      .map(([s, c]) => `${c} ${s}`)
      .join(" - ");
    msg += `\n`;
  }
  if (Object.keys(data.girlsAcademy).length > 0) {
    msg += `بنات\nأ.غ.م - `;
    msg += Object.entries(data.girlsAcademy)
      .map(([s, c]) => `${c} ${s}`)
      .join(" - ");
    msg += `\n`;
  }

  msg += `\nالإجمالي من التجديد: ${data.renewalTotal.toLocaleString("ar-SA")}\n`;
  msg += `الإجمالي من الاشتراكات الجديدة: ${data.newTotal.toLocaleString(
    "ar-SA",
  )}\n`;
  msg += `الإجمالي: ${data.dayTotal.toLocaleString("ar-SA")}\n`;
  msg += `المجموع الكلي للآن (${dateStr}): ${data.monthlyTotal.toLocaleString(
    "ar-SA",
  )}`;

  return msg;
};

// Message Templates
const TEMPLATES = [
  {
    id: "active_subs",
    label: "📊 إجمالي الاشتراكات النشطة",
    requiresReport: false,
    getMessage: (stats) =>
      `نادي مكة الرياضي 🏋️\nالاشتراكات النشطة حالياً:\n✅ صالة: ${stats.activeGym}\n✅ أكاديمية: ${stats.activeAcademy}\nالإجمالي: ${stats.totalActive} مشترك`,
  },
  {
    id: "expiring_soon",
    label: "⚠️ تنبيه انتهاء الاشتراك",
    requiresReport: false,
    getMessage: (stats) =>
      `عزيزي العضو،\nاشتراكك في نادي مكة الرياضي سينتهي خلال أسبوع.\nللتجديد تواصل معنا.\nنادي مكة الرياضي 🏋️`,
  },
  {
    id: "welcome",
    label: "👋 رسالة ترحيب",
    requiresReport: false,
    getMessage: () =>
      `أهلاً بك في نادي مكة الرياضي! 🏋️\nيسعدنا انضمامك لعائلتنا.\nنتمنى لك تجربة رياضية مميزة.`,
  },
  {
    id: "renewal_reminder",
    label: "🔄 تذكير بالتجديد",
    requiresReport: false,
    getMessage: () =>
      `نادي مكة الرياضي 🏋️\nنذكرك بتجديد اشتراكك للاستمرار في الاستفادة من خدماتنا.\nللتجديد تواصل مع الاستقبال.`,
  },
  {
    id: "daily_management",
    label: "📊 التقرير اليومي - الإدارة",
    requiresReport: true,
    getMessageFromReport: (data) => formatManagementMessage(data),
    autoPhone: "mgmt_phone",
  },
  {
    id: "daily_accounting",
    label: "📋 التقرير اليومي - الحسابات",
    requiresReport: true,
    getMessageFromReport: (data) => formatAccountingMessage(data),
    autoPhone: "acct_phone",
  },
  {
    id: "custom",
    label: "✏️ رسالة مخصصة",
    requiresReport: false,
    getMessage: () => "",
  },
];

export default function MessagingPage() {
  const { user, token } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("sms");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [mgmtPhone, setMgmtPhone] = useState("");
  const [acctPhone, setAcctPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportData, setReportData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load phone numbers from localStorage on mount
  useEffect(() => {
    const savedMgmtPhone = localStorage.getItem("mgmt_phone") || "";
    const savedAcctPhone = localStorage.getItem("acct_phone") || "";
    setMgmtPhone(savedMgmtPhone);
    setAcctPhone(savedAcctPhone);
  }, []);

  // Save phone numbers to localStorage
  const handleSaveMgmtPhone = (value) => {
    setMgmtPhone(value);
    localStorage.setItem("mgmt_phone", value);
  };

  const handleSaveAcctPhone = (value) => {
    setAcctPhone(value);
    localStorage.setItem("acct_phone", value);
  };

  // Fetch stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/messaging/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(res.data.data);
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, [token]);

  // Check if user is admin or owner
  if (user?.role !== "admin" && user?.role !== "owner") {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-bold">وصول مرفوض</h2>
          <p className="text-red-700">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  // Handle template selection
  const handleTemplateSelect = async (templateId) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find((t) => t.id === templateId);

    if (!template) return;

    if (template.requiresReport) {
      // Fetch daily report data
      setIsLoading(true);
      try {
        const res = await axios.get(
          `/messaging/daily-report?date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setReportData(res.data.data);
        const templateMessage = template.getMessageFromReport(res.data.data);
        setMessage(templateMessage);
        setShowPreview(true);

        // Auto-fill phone
        if (template.autoPhone === "mgmt_phone" && mgmtPhone) {
          setPhone(mgmtPhone);
        } else if (template.autoPhone === "acct_phone" && acctPhone) {
          setPhone(acctPhone);
        }
      } catch (err) {
        setErrorMessage("فشل في جلب بيانات التقرير");
        console.error("Failed to fetch daily report");
      } finally {
        setIsLoading(false);
      }
    } else {
      const templateMessage = template.getMessage(stats || {});
      setMessage(templateMessage);
      setShowPreview(false);
    }
  };

  // Calculate SMS count (160 chars per SMS)
  const calculateSmsCount = (text) => {
    if (text.length <= 160) return 1;
    if (text.length <= 306) return 2;
    if (text.length <= 459) return 3;
    return Math.ceil(text.length / 153);
  };

  const smsCount = calculateSmsCount(message);
  const showSmsWarning = message.length > 160;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!message.trim()) {
      setErrorMessage("يجب إدخال النص قبل الإرسال");
      return;
    }

    if (message.length > 500) {
      setErrorMessage("لا يمكن أن تتجاوز الرسالة 500 حرف");
      return;
    }

    if (channel === "email" && !email) {
      setErrorMessage("يجب إدخال البريد الإلكتروني");
      return;
    }

    if ((channel === "sms" || channel === "whatsapp") && !phone) {
      setErrorMessage(
        `يجب إدخال رقم الهاتف لـ ${channel === "sms" ? "SMS" : "WhatsApp"}`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "/messaging/send",
        {
          phone: channel !== "email" ? phone : null,
          email: channel === "email" ? email : null,
          message: message.trim(),
          channel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        // Reset form
        setPhone("");
        setEmail("");
        setMessage("");
        setChannel("sms");
        setSelectedTemplate("custom");
        setShowPreview(false);
      } else {
        setErrorMessage(response.data.message || "فشل الإرسال");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMessage = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (channel === "email") {
      setErrorMessage("لا تدعم الرسائل التجريبية للبريد الإلكتروني");
      return;
    }

    if (!phone) {
      setErrorMessage("يجب إدخال رقم الهاتف لإرسال رسالة تجريبية");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "/messaging/test",
        {
          phone,
          channel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
      } else {
        setErrorMessage(response.data.message || "فشل الإرسال");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
          إرسال رسائل
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          أرسل رسائل SMS أو WhatsApp إلى الأعضاء والعملاء
        </p>
      </div>

      {/* Admin Phone Numbers Configuration */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          أرقام الاتصال للتقارير اليومية
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="mgmt_phone"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              📊 رقم الإدارة:
            </label>
            <input
              type="tel"
              id="mgmt_phone"
              value={mgmtPhone}
              onChange={(e) => handleSaveMgmtPhone(e.target.value)}
              placeholder="966501234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor="acct_phone"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              📋 رقم الحسابات:
            </label>
            <input
              type="tel"
              id="acct_phone"
              value={acctPhone}
              onChange={(e) => handleSaveAcctPhone(e.target.value)}
              placeholder="966501234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6"
      >
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            📅 اختر التاريخ:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setReportData(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Phone Input */}
        {(channel === "sms" || channel === "whatsapp") && (
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              رقم الجوال:
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="966501234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={channel !== "email"}
            />
            <p className="text-xs text-gray-500 mt-1">
              أدخل الرقم مع رمز الدولة (مثال: 966501234567)
            </p>
          </div>
        )}

        {/* Channel Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            اختر طريقة الإرسال:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all min-h-[44px] flex items-center justify-center ${
                channel === "whatsapp"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              💬 واتساب
            </button>
            <button
              type="button"
              onClick={() => setChannel("sms")}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all min-h-[44px] flex items-center justify-center ${
                channel === "sms"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📱 SMS
            </button>
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all min-h-[44px] flex items-center justify-center ${
                channel === "email"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📧 إيميل
            </button>
          </div>
        </div>

        {/* Email Input */}
        {channel === "email" && (
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              البريد الإلكتروني:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={channel === "email"}
            />
          </div>
        )}

        {/* Template Selector */}
        {(channel === "sms" || channel === "whatsapp") && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              القوالب المسبقة:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template.id)}
                  disabled={isLoading}
                  className={`whitespace-nowrap px-4 py-2 rounded-full font-bold transition-all min-h-[44px] flex items-center justify-center ${
                    selectedTemplate === template.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Preview */}
        {showPreview && reportData && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">📋 معاينة التقرير:</h3>
            <div className="bg-white rounded p-3 text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {message}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="message"
              className="block text-sm font-bold text-gray-700"
            >
              محتوى الرسالة:
            </label>
            <div className="text-sm text-gray-600">
              {showSmsWarning ? (
                <span className="text-orange-600 font-semibold">
                  ستُرسل كـ {smsCount} رسائل ({message.length} حرف)
                </span>
              ) : (
                <span className="text-gray-500">{message.length}/160 حرف</span>
              )}
            </div>
          </div>
          <textarea
            id="message"
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setMessage(e.target.value);
              }
            }}
            placeholder="اكتب رسالتك هنا..."
            maxLength="500"
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">يمكنك كتابة حتى 500 حرف</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                جاري الإرسال...
              </>
            ) : (
              <>✓ إرسال الرسالة</>
            )}
          </button>

          {(channel === "sms" || channel === "whatsapp") && (
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={isLoading || !phone}
              className="sm:flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
            >
              🧪 رسالة تجريبية
            </button>
          )}
        </div>
      </form>

      {/* Stats Display */}
      {stats && (channel === "sms" || channel === "whatsapp") && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-bold text-blue-900 mb-3">احصائيات فورية:</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">الاشتراكات النشطة</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalActive}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">المشتركين</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalMembers}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">الصالة (نشط)</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats.activeGym}
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-xs text-gray-600">الأكاديمية (نشطة)</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.activeAcademy}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="font-bold text-blue-900 mb-2">معلومات مهمة:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ تأكد من تفعيل مفتاح API في متغيرات البيئة</li>
          <li>✓ استخدم أرقام الهواتف مع رمز الدولة (+966)</li>
          <li>✓ الرسالة الواحدة بحد أقصى 160 حرف</li>
          <li>✓ استخدم الرسالة التجريبية للتحقق من التكوين</li>
          <li>✓ استخدم القوالب المسبقة لتسريع الإرسال</li>
          <li>✓ أرقام الإدارة والحسابات تُحفظ في الجهاز تلقائياً</li>
        </ul>
      </div>
    </div>
  );
}
