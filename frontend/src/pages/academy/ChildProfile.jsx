import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../api/axios";

export default function ChildProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for modals and operations
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showChangeSportModal, setShowChangeSportModal] = useState(false);
  const [showChangeGroupModal, setShowChangeGroupModal] = useState(false);
  const [changeFormData, setChangeFormData] = useState({
    sportId: "",
    groupId: "",
  });
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState("");

  // Fetch child profile
  const {
    data: profile,
    isLoading,
    error,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["childProfile", memberId],
    queryFn: async () => {
      const response = await axios.get(`/academy/members/${memberId}/profile`);
      return response.data;
    },
  });

  // Fetch sports for change sport modal
  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const response = await axios.get("/academy/sports", {
        params: { gender: profile?.member?.gender },
      });
      return response.data;
    },
    enabled: !!profile?.member?.gender,
  });

  // Fetch groups for the selected sport
  const { data: groupsForSport = [] } = useQuery({
    queryKey: ["groupsForSport", changeFormData.sportId],
    queryFn: async () => {
      const response = await axios.get(
        `/academy/sports/${changeFormData.sportId}`,
      );
      return response.data.groups || [];
    },
    enabled: !!changeFormData.sportId,
  });

  // Fetch groups for same sport (change group modal)
  const { data: groupsForCurrentSport = [] } = useQuery({
    queryKey: ["groupsForCurrentSport", selectedSubscription?.sport?._id],
    queryFn: async () => {
      const response = await axios.get(
        `/academy/sports/${selectedSubscription.sport._id}`,
      );
      return response.data.groups || [];
    },
    enabled: !!selectedSubscription?.sport?._id && showChangeGroupModal,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: {
        text: "نشط",
        bg: "bg-green-100",
        text_color: "text-green-700",
      },
      expired: { text: "منتهي", bg: "bg-red-100", text_color: "text-red-700" },
      cancelled: {
        text: "ملغى",
        bg: "bg-gray-100",
        text_color: "text-gray-700",
      },
    };
    const config = statusMap[status] || statusMap.expired;
    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text_color}`}
      >
        {config.text}
      </span>
    );
  };

  const getStatusColor = (status) => {
    const colorMap = {
      active: "border-l-4 border-l-green-500",
      expired: "border-l-4 border-l-red-500",
      cancelled: "border-l-4 border-l-gray-500",
    };
    return colorMap[status] || colorMap.expired;
  };

  // Handle change sport
  const handleChangeSport = async () => {
    if (!changeFormData.sportId || !changeFormData.groupId) {
      setChangeError("الرياضة والمجموعة مطلوبة");
      return;
    }

    setChangeLoading(true);
    setChangeError("");
    setChangeSuccess("");

    try {
      await axios.post(
        `/academy/subscriptions/${selectedSubscription._id}/change-sport`,
        {
          newSportId: changeFormData.sportId,
          newGroupId: changeFormData.groupId,
        },
      );

      setChangeSuccess("تم تغيير الرياضة بنجاح");
      // Invalidate CoachList cache to force refetch with new data
      queryClient.invalidateQueries({ queryKey: ["activeTodayMembers"] });

      setTimeout(() => {
        setShowChangeSportModal(false);
        setChangeFormData({ sportId: "", groupId: "" });
        setSelectedSubscription(null);
        refetchProfile();
      }, 1500);
    } catch (err) {
      setChangeError(
        err.response?.data?.message || "فشل تغيير الرياضة، حاول مرة أخرى",
      );
    } finally {
      setChangeLoading(false);
    }
  };

  // Handle change group
  const handleChangeGroup = async () => {
    if (!changeFormData.groupId) {
      setChangeError("المجموعة الجديدة مطلوبة");
      return;
    }

    setChangeLoading(true);
    setChangeError("");
    setChangeSuccess("");

    try {
      await axios.post(
        `/academy/subscriptions/${selectedSubscription._id}/change-group`,
        {
          newGroupId: changeFormData.groupId,
        },
      );

      setChangeSuccess("تم تغيير المجموعة بنجاح");
      // Invalidate CoachList cache to force refetch with new data
      queryClient.invalidateQueries({ queryKey: ["activeTodayMembers"] });

      setTimeout(() => {
        setShowChangeGroupModal(false);
        setChangeFormData({ sportId: "", groupId: "" });
        setSelectedSubscription(null);
        refetchProfile();
      }, 1500);
    } catch (err) {
      setChangeError(
        err.response?.data?.message || "فشل تغيير المجموعة، حاول مرة أخرى",
      );
    } finally {
      setChangeLoading(false);
    }
  };

  // Handle add sport
  const handleAddSport = () => {
    navigate(`/academy/new`, {
      state: {
        childId: memberId,
        childData: {
          fullName: profile.member.fullName,
          gender: profile.member.gender,
          dateOfBirth: profile.member.dateOfBirth,
          phone: profile.member.phone,
          guardianName: profile.member.guardianName,
          guardianPhone: profile.member.guardianPhone,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold">خطأ في تحميل البيانات</p>
        <p className="text-red-600 text-sm mt-2">
          {error?.response?.data?.message || "حاول مرة أخرى"}
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">لم يتم العثور على بيانات الطفل</p>
      </div>
    );
  }

  const { member, subscriptions, totalPaid, activeCount } = profile;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/academy/sports")}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-4 flex items-center gap-2"
        >
          ← العودة
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-right">
          ملف شخصي: {member.fullName}
        </h1>
      </div>

      {/* Member Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Name */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">الاسم</p>
            <p className="text-lg font-semibold text-gray-900">
              {member.fullName}
            </p>
          </div>

          {/* Age and Gender */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">العمر والنوع</p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-lg font-semibold text-gray-900">
                {member.age || "-"} سنة
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  member.gender === "male"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-pink-100 text-pink-700"
                }`}
              >
                {member.gender === "male" ? "ذكر" : "أنثى"}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">الهاتف</p>
            <p className="text-lg font-semibold text-gray-900 ltr">
              {member.phone || "-"}
            </p>
          </div>

          {/* Birth Date */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">تاريخ الميلاد</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(member.dateOfBirth)}
            </p>
          </div>

          {/* Guardian Name */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">ولي الأمر</p>
            <p className="text-lg font-semibold text-gray-900">
              {member.guardianName || "-"}
            </p>
          </div>

          {/* Guardian Phone */}
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">هاتف ولي الأمر</p>
            <p className="text-lg font-semibold text-gray-900 ltr">
              {member.guardianPhone || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-right">
          <p className="text-sm text-blue-600 mb-1">الاشتراكات النشطة</p>
          <p className="text-3xl font-bold text-blue-900">{activeCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-right">
          <p className="text-sm text-green-600 mb-1">إجمالي المبلغ المدفوع</p>
          <p className="text-3xl font-bold text-green-900">{totalPaid} ر.س</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-right">
          <p className="text-sm text-purple-600 mb-1">إجمالي الاشتراكات</p>
          <p className="text-3xl font-bold text-purple-900">
            {subscriptions.length}
          </p>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-300">
          <button
            onClick={handleAddSport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
          >
            + إضافة رياضة
          </button>
          <h2 className="text-2xl font-bold">الاشتراكات</h2>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">لا توجد اشتراكات حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div
                key={sub._id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 ${getStatusColor(sub.status)} hover:shadow-md transition`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-start">
                  {/* Sport */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">الرياضة</p>
                    <p className="font-semibold text-gray-900">
                      {sub.sport?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sub.sport?.nameEn}
                    </p>
                  </div>

                  {/* Group */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">المجموعة</p>
                    <p className="font-semibold text-gray-900">
                      {sub.group?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {sub.group?.schedule}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">الفترة</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {formatDate(sub.startDate)}
                    </p>
                    <p className="text-xs text-gray-600 my-1">إلى</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {formatDate(sub.endDate)}
                    </p>
                  </div>

                  {/* Duration & Price */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">المدة والسعر</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {sub.durationMonths}
                      {sub.durationMonths >= 12 ? " سنة" : " شهر"}
                    </p>
                    <p className="text-sm text-green-700 font-bold mt-1">
                      {sub.pricePaid} ر.س
                    </p>
                  </div>

                  {/* Status & Info */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">الحالة</p>
                    <div className="mb-2">{getStatusBadge(sub.status)}</div>
                    <p className="text-xs text-gray-600">
                      <span className="block">
                        {sub.paymentMethod === "cash"
                          ? "كاش"
                          : sub.paymentMethod === "network"
                            ? "تحويل بنكي"
                            : sub.paymentMethod === "tabby"
                              ? "Tabby"
                              : sub.paymentMethod === "tamara"
                                ? "Tamara"
                                : "تحويل"}
                      </span>
                      <span className="block mt-1">
                        التجديدات: {sub.renewalCount || 0}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="text-right flex flex-col gap-2">
                    {sub.status === "expired" ? (
                      <button
                        onClick={() =>
                          navigate(`/subscriptions/${member._id}/renew`)
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition whitespace-nowrap"
                      >
                        تجديد
                      </button>
                    ) : sub.status === "active" ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setShowChangeSportModal(true);
                          }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition whitespace-nowrap"
                        >
                          تغيير رياضة
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setShowChangeGroupModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                        >
                          تغيير مجموعة
                        </button>
                      </>
                    ) : null}
                    <button
                      onClick={() =>
                        navigate(
                          `/academy/members/${memberId}/subscription/${sub._id}`,
                        )
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition whitespace-nowrap"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Sport Modal */}
      {showChangeSportModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-right"
            dir="rtl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              تغيير الرياضة
            </h3>

            {changeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {changeError}
              </div>
            )}

            {changeSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm">
                {changeSuccess}
              </div>
            )}

            {/* Sport Selection */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اختر الرياضة الجديدة
              </label>
              <select
                value={changeFormData.sportId}
                onChange={(e) => {
                  setChangeFormData({
                    ...changeFormData,
                    sportId: e.target.value,
                    groupId: "",
                  });
                  setChangeError("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر...</option>
                {sports.map((sport) => (
                  <option key={sport._id} value={sport._id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Selection */}
            {changeFormData.sportId && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اختر المجموعة
                </label>
                <select
                  value={changeFormData.groupId}
                  onChange={(e) => {
                    setChangeFormData({
                      ...changeFormData,
                      groupId: e.target.value,
                    });
                    setChangeError("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر...</option>
                  {groupsForSport.map((group) => (
                    <option
                      key={group._id}
                      value={group._id}
                      disabled={group.isFull}
                    >
                      {group.name}
                      {group.isFull ? " (ممتلئة)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleChangeSport}
                disabled={
                  changeLoading ||
                  !changeFormData.sportId ||
                  !changeFormData.groupId
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {changeLoading ? "جاري..." : "تأكيد"}
              </button>
              <button
                onClick={() => {
                  setShowChangeSportModal(false);
                  setChangeFormData({ sportId: "", groupId: "" });
                  setChangeError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Group Modal */}
      {showChangeGroupModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-right"
            dir="rtl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              تغيير المجموعة
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              الرياضة:{" "}
              <span className="font-semibold">
                {selectedSubscription.sport?.name}
              </span>
            </p>

            {changeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                {changeError}
              </div>
            )}

            {changeSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-green-700 text-sm">
                {changeSuccess}
              </div>
            )}

            {/* Group Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                اختر المجموعة الجديدة
              </label>
              <select
                value={changeFormData.groupId}
                onChange={(e) => {
                  setChangeFormData({
                    ...changeFormData,
                    groupId: e.target.value,
                  });
                  setChangeError("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر...</option>
                {groupsForCurrentSport.map((group) => (
                  <option
                    key={group._id}
                    value={group._id}
                    disabled={
                      group.isFull ||
                      group._id === selectedSubscription.group?._id
                    }
                  >
                    {group.name} - {group.schedule}
                    {group.isFull ? " (ممتلئة)" : ""}
                    {group._id === selectedSubscription.group?._id
                      ? " (الحالية)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleChangeGroup}
                disabled={changeLoading || !changeFormData.groupId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {changeLoading ? "جاري..." : "تأكيد"}
              </button>
              <button
                onClick={() => {
                  setShowChangeGroupModal(false);
                  setChangeFormData({ sportId: "", groupId: "" });
                  setChangeError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
