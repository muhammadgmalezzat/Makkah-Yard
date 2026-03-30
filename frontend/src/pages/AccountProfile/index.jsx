import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSubscriptions } from "../../hooks";
import { Spinner } from "../../components/ui";
import { AccountHeader } from "./AccountHeader";
import { MemberCard } from "./MemberCard";
import { EditMemberModal } from "./EditMemberModal";
import { EditSubscriptionModal } from "./EditSubscriptionModal";
import { PaymentHistoryTable } from "./PaymentHistoryTable";
import { StatsCards } from "./StatsCards";

const roleConfig = {
  primary: { label: "أساسي", badge: "bg-blue-100 text-blue-700" },
  partner: { label: "شريك", badge: "bg-purple-100 text-purple-700" },
  child: { label: "طفل", badge: "bg-orange-100 text-orange-700" },
  sub_adult: { label: "فرعي بالغ", badge: "bg-teal-100 text-teal-700" },
};

const statusConfig = {
  active: { label: "نشط", badge: "bg-green-100 text-green-700" },
  expired: { label: "منتهي", badge: "bg-red-100 text-red-100" },
  cancelled: { label: "ملغى", badge: "bg-red-100 text-red-700" },
  renewed: { label: "مجدد", badge: "bg-blue-100 text-blue-700" },
};

const accountTypeConfig = {
  individual: { label: "حساب فردي", icon: "👤" },
  friends: { label: "حساب أصدقاء", icon: "👥" },
  family: { label: "حساب عائلي", icon: "👨‍👩‍👧‍👦" },
  academy_only: { label: "أكاديمية فقط", icon: "🎓" },
};

const paymentMethodConfig = {
  cash: "نقد",
  network: "شبكة",
  tabby: "تابي",
  tamara: "تمارة",
  transfer: "تحويل",
};

const typeConfig = {
  new: "جديد",
  renewal: "تجديد",
  transfer_fee: "رسم نقل",
  upgrade_diff: "فرق ترقية",
};

/**
 * AccountProfile - Main page for account profile
 */
export default function AccountProfile() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { useAccountProfile, updateMember, updateSubscription } =
    useSubscriptions();

  const [editingMember, setEditingMember] = useState(null);
  const [memberEditForm, setMemberEditForm] = useState({});
  const [editingSub, setEditingSub] = useState(null);
  const [subEditForm, setSubEditForm] = useState({});

  const {
    data: profileData = {},
    isLoading,
    error,
    refetch,
  } = useAccountProfile(accountId);

  const handleMemberEditSubmit = async () => {
    try {
      await updateMember(editingMember._id, memberEditForm);
      setEditingMember(null);
      refetch();
      alert("✅ تم تحديث بيانات العضو");
    } catch (error) {
      alert(error.response?.data?.message || "حدث خطأ");
    }
  };

  const handleSubEditSubmit = async () => {
    try {
      await updateSubscription(editingSub._id, subEditForm);
      setEditingSub(null);
      refetch();
      alert("✅ تم تحديث الاشتراك");
    } catch (error) {
      alert(error.response?.data?.message || "حدث خطأ");
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold mb-2">❌ خطأ</p>
        <p className="text-red-600 text-sm">
          {error.response?.data?.message || "حدث خطأ أثناء تحميل الحساب"}
        </p>
        <button
          onClick={() => navigate("/subscriptions/search")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition min-h-[44px]"
        >
          العودة للبحث
        </button>
      </div>
    );

  if (!profileData?.account)
    return (
      <div className="text-center py-12 text-gray-500">
        <p>لم يتم العثور على بيانات الحساب</p>
      </div>
    );

  const {
    account,
    primarySubscription,
    members = [],
    payments = [],
    stats,
  } = profileData;

  const accountType = accountTypeConfig[account.type] || {
    label: account.type,
    icon: "📋",
  };

  const primaryMemberData = members.find((m) => m.member?.role === "primary");
  const primaryMember = primaryMemberData?.member;
  const primarySub = primaryMemberData?.gymSubscription || primarySubscription;

  const isSubscriptionActive =
    primarySub && new Date(primarySub.endDate) > new Date();

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            ملف الحساب
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {accountType.icon} {accountType.label}
          </p>
        </div>
        <button
          onClick={() => navigate("/subscriptions/search")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] w-full sm:w-auto"
        >
          ← العودة
        </button>
      </div>

      <AccountHeader
        primaryMember={primaryMember}
        primarySub={primarySub}
        accountType={accountType}
        isSubscriptionActive={isSubscriptionActive}
        statusConfig={statusConfig}
      />

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">الأعضاء</h2>
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((memberData) => (
              <MemberCard
                key={memberData.member._id}
                memberData={memberData}
                roleConfig={roleConfig}
                statusConfig={statusConfig}
                onEditMember={(m) => {
                  setEditingMember(m);
                  setMemberEditForm({
                    fullName: m.fullName || "",
                    phone: m.phone || "",
                    email: m.email || "",
                    gender: m.gender || "male",
                    nationalId: m.nationalId || "",
                    dateOfBirth: m.dateOfBirth
                      ? m.dateOfBirth.split("T")[0]
                      : "",
                  });
                }}
                onEditSubscription={(sub) => {
                  setEditingSub(sub);
                  setSubEditForm({
                    startDate: sub.startDate ? sub.startDate.split("T")[0] : "",
                    endDate: sub.endDate ? sub.endDate.split("T")[0] : "",
                    status: sub.status || "active",
                    pricePaid: sub.pricePaid || 0,
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد أعضاء في هذا الحساب</p>
          </div>
        )}
      </div>

      <EditMemberModal
        member={editingMember}
        form={memberEditForm}
        onFormChange={setMemberEditForm}
        onSubmit={handleMemberEditSubmit}
        onCancel={() => setEditingMember(null)}
      />

      <EditSubscriptionModal
        subscription={editingSub}
        form={subEditForm}
        onFormChange={setSubEditForm}
        onSubmit={handleSubEditSubmit}
        onCancel={() => setEditingSub(null)}
      />

      <PaymentHistoryTable
        payments={payments}
        paymentMethodConfig={paymentMethodConfig}
        typeConfig={typeConfig}
      />

      <StatsCards stats={stats} />
    </div>
  );
}
