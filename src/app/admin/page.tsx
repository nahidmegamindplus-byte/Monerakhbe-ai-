"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Send,
  Bell,
  BrainCircuit,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckSquare,
  CalendarCheck,
  CreditCard,
  Settings,
  Download,
  RefreshCw,
  Eye,
  KeyRound,
  UserX,
  UserCheck,
  Clock,
  Sparkles,
  Database,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  X,
  Server,
  LogOut,
  LayoutDashboard,
  Menu,
  Check,
  DollarSign,
  TrendingUp,
  FileText,
  BadgePercent,
  Wallet,
  Power,
  Ban,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type TabType =
  | "overview"
  | "payments"
  | "paymentMethods"
  | "plans"
  | "users"
  | "reminders"
  | "memories"
  | "tasks"
  | "telegram"
  | "notifications"
  | "subscriptions"
  | "audit"
  | "system";

export default function AdminPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Admin Direct Gateway Auth States
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [data, setData] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Tab Data States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [remindersList, setRemindersList] = useState<any[]>([]);
  const [memoriesList, setMemoriesList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [telegramsList, setTelegramsList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [systemTelemetry, setSystemTelemetry] = useState<any>(null);

  // Payments, Payment Methods & Plans States
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<any>(null);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planFormData, setPlanFormData] = useState<any>({});

  // Dynamic Payment Methods States
  const [paymentMethodsAdminList, setPaymentMethodsAdminList] = useState<any[]>([]);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any | null>(null);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [paymentMethodFormData, setPaymentMethodFormData] = useState({
    name: "",
    code: "",
    type: "WALLET",
    accountNumber: "",
    accountType: "Personal",
    instructions: "",
    chargePercent: 0,
    isActive: true,
    displayOrder: 0,
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedUserFilter, setSelectedUserFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [quickBlockInput, setQuickBlockInput] = useState("");
  const [quickBlockLoading, setQuickBlockLoading] = useState(false);

  // Modal States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    role: "USER",
    plan: "FREE",
    timezone: "Asia/Dhaka",
    language: "bn",
    isSuspended: false,
  });

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<any | null>(null);
  const [reminderFormData, setReminderFormData] = useState({
    userId: "",
    title: "",
    description: "",
    dueAt: "",
    priority: "NORMAL",
    categoryName: "General",
    status: "PENDING",
  });

  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<any | null>(null);
  const [memoryFormData, setMemoryFormData] = useState({
    userId: "",
    category: "Personal",
    key: "",
    value: "",
    tags: "",
    summary: "",
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    userId: "",
    title: "",
    description: "",
    priority: "NORMAL",
    status: "TODO",
    dueDate: "",
    dueTime: "",
    category: "Work",
  });

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subFormData, setSubFormData] = useState({
    userId: "",
    planId: "PRO",
    billingCycle: "MONTHLY",
    durationMonths: 1,
    paymentMethod: "manual_admin",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "user" | "reminder" | "memory" | "task" | "subscription" | "notification" | "order" | "plan" | "paymentMethod";
    id: string;
    title: string;
  }>({ open: false, type: "user", id: "", title: "" });

  const notify = (text: string, type: "success" | "error" = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg(null), 4000);
  };

  // Main Overview Fetcher
  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.status === 403) {
        return;
      }
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (methodFilter !== "ALL") params.append("method", methodFilter);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setOrdersList(json.orders);
        setPaymentAnalytics(json.analytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentMethodsAdmin = async () => {
    try {
      const res = await fetch("/api/admin/payment-methods");
      const json = await res.json();
      if (json.success) setPaymentMethodsAdminList(json.paymentMethods);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const json = await res.json();
      if (json.success) setPlansList(json.plans);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (planFilter !== "ALL") params.append("plan", planFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) setUsersList(json.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReminders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (selectedUserFilter !== "ALL") params.append("userId", selectedUserFilter);

      const res = await fetch(`/api/admin/reminders?${params.toString()}`);
      const json = await res.json();
      if (json.success) setRemindersList(json.reminders);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMemories = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (selectedUserFilter !== "ALL") params.append("userId", selectedUserFilter);

      const res = await fetch(`/api/admin/memories?${params.toString()}`);
      const json = await res.json();
      if (json.success) setMemoriesList(json.memories);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (selectedUserFilter !== "ALL") params.append("userId", selectedUserFilter);

      const res = await fetch(`/api/admin/tasks?${params.toString()}`);
      const json = await res.json();
      if (json.success) setTasksList(json.tasks);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) setNotificationsList(json.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTelegrams = async () => {
    try {
      const res = await fetch("/api/admin/telegram");
      const json = await res.json();
      if (json.success) setTelegramsList(json.connections);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      const json = await res.json();
      if (json.success) setSubscriptionsList(json.subscriptions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystem = async () => {
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      if (json.success) setSystemTelemetry(json);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshCurrentTab = () => {
    if (activeTab === "overview") fetchOverview();
    else if (activeTab === "payments") fetchPayments();
    else if (activeTab === "paymentMethods") fetchPaymentMethodsAdmin();
    else if (activeTab === "plans") fetchPlans();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "reminders") fetchReminders();
    else if (activeTab === "memories") fetchMemories();
    else if (activeTab === "tasks") fetchTasks();
    else if (activeTab === "notifications") fetchNotifications();
    else if (activeTab === "telegram") fetchTelegrams();
    else if (activeTab === "subscriptions") fetchSubscriptions();
    else if (activeTab === "audit") fetchOverview();
    else if (activeTab === "system") fetchSystem();
  };

  // Admin Login Direct Handler
  const handleAdminDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        await refreshUser();
        notify("অ্যাডমিন হিসেবে সফলভাবে লগইন হয়েছে!");
      } else {
        setAdminLoginError(resData.error || "লগইন ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।");
      }
    } catch (err: any) {
      setAdminLoginError(err.message || "সার্ভার সংযোগে ত্রুটি ঘটেছে।");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Promote Current Session to Admin Handler
  const handlePromoteCurrentUser = async () => {
    setAdminLoginLoading(true);
    setAdminLoginError("");
    try {
      const res = await fetch("/api/admin/promote-me", {
        method: "POST",
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        await refreshUser();
        notify("আপনার অ্যাকাউন্টকে সফলভাবে অ্যাডমিন এক্সেস দেওয়া হয়েছে!");
      } else {
        setAdminLoginError(resData.error || "অ্যাডমিন পারমিশন প্রদানে ত্রুটি।");
      }
    } catch (err: any) {
      setAdminLoginError(err.message || "সার্ভার সংযোগে ত্রুটি।");
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Route & Security Guard
  useEffect(() => {
    if (!loading) {
      if (user?.role === "ADMIN") {
        setFetching(true);
        Promise.all([fetchOverview(), fetchUsers(), fetchPayments(), fetchPaymentMethodsAdmin()]).finally(() => {
          setFetching(false);
        });
      } else {
        setFetching(false);
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user?.role === "ADMIN") {
      refreshCurrentTab();
    }
  }, [activeTab, searchQuery, roleFilter, planFilter, statusFilter, priorityFilter, categoryFilter, selectedUserFilter, methodFilter]);

  // Handlers
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUser.id,
            name: userFormData.name,
            email: userFormData.email,
            role: userFormData.role,
            plan: userFormData.plan,
            timezone: userFormData.timezone,
            language: userFormData.language,
            isSuspended: userFormData.isSuspended,
            newPassword: userFormData.newPassword || undefined,
          }),
        });
        const json = await res.json();
        if (json.success) {
          notify("ইউজার সফলভাবে আপডেট হয়েছে!");
          setUserModalOpen(false);
          fetchUsers();
          fetchOverview();
        } else {
          notify(json.error || "আপডেট ব্যর্থ হয়েছে", "error");
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userFormData),
        });
        const json = await res.json();
        if (json.success) {
          notify("নতুন ইউজার সফলভাবে তৈরি হয়েছে!");
          setUserModalOpen(false);
          fetchUsers();
          fetchOverview();
        } else {
          notify(json.error || "ইউজার তৈরিতে সমস্যা হয়েছে", "error");
        }
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    }
  };

  // User Block / Turn Off / Unblock Toggle Handler
  const handleToggleUserBlock = async (userId: string, currentSuspended: boolean, userName: string) => {
    const nextState = !currentSuspended;
    const actionLabel = nextState ? "ব্লক ও অফ (Block / Turn Off)" : "আনব্লক ও অন (Unblock / Turn On)";
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${userName}" অ্যাকাউন্টটি ${actionLabel} করতে চান?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          isSuspended: nextState,
        }),
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || `ইউজার সফলভাবে ${actionLabel} করা হয়েছে!`);
        fetchUsers();
        fetchOverview();
      } else {
        notify(json.error || `${actionLabel} করা সম্ভব হয়নি`, "error");
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    }
  };

  // Quick Block / Unblock by User ID or Email
  const handleQuickBlockById = async (action: "BLOCK" | "UNBLOCK") => {
    if (!quickBlockInput.trim()) {
      notify("অনুগ্রহ করে ইউজার আইডি (User ID) বা ইমেইল লিখুন", "error");
      return;
    }
    const actionLabel = action === "BLOCK" ? "ব্লক ও অফ" : "আনব্লক ও অন";
    setQuickBlockLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: quickBlockInput.trim(),
          action,
        }),
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || `ইউজার সফলভাবে ${actionLabel} করা হয়েছে!`);
        setQuickBlockInput("");
        fetchUsers();
        fetchOverview();
      } else {
        notify(json.error || "অ্যাকশন সম্পন্ন করা সম্ভব হয়নি", "error");
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    } finally {
      setQuickBlockLoading(false);
    }
  };

    // Plan Save Handler (Create & Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingPlan;
      const res = await fetch("/api/admin/plans", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planFormData),
      });
      const json = await res.json();
      if (json.success) {
        notify(isNew ? "নতুন প্যাকেজ সফলভাবে তৈরি হয়েছে!" : "প্যাকেজ রেট ও লিমিট সফলভাবে সংরক্ষিত হয়েছে!");
        setEditingPlan(null);
        setPlanModalOpen(false);
        fetchPlans();
      } else {
        notify(json.error || "সংরক্ষণ ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    }
  };

  // Plan Delete Handler
  const handleDeletePlan = async (planId: string, planName: string) => {
    if (planId === "FREE") {
      notify("বেসিক FREE প্ল্যান মুছে ফেলা সম্ভব নয়", "error");
      return;
    }
    setDeleteConfirm({
      open: true,
      type: "plan",
      id: planId,
      title: `প্যাকেজ "${planName} (${planId})"`,
    });
  };

  // Payment Method Save Handler (Create & Update)
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isNew = !editingPaymentMethod;
      const res = await fetch("/api/admin/payment-methods", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? paymentMethodFormData : { id: editingPaymentMethod.id, ...paymentMethodFormData }),
      });
      const json = await res.json();
      if (json.success) {
        notify(isNew ? "নতুন পেমেন্ট মেথড ও নাম্বার সফলভাবে যোগ করা হয়েছে!" : "পেমেন্ট মেথড সফলভাবে আপডেট করা হয়েছে!");
        setEditingPaymentMethod(null);
        setPaymentMethodModalOpen(false);
        fetchPaymentMethodsAdmin();
      } else {
        notify(json.error || "পেমেন্ট মেথড সংরক্ষণে সমস্যা হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    }
  };

  // Payment Method Quick Active/Inactive Toggle
  const handleTogglePaymentMethodActive = async (method: any) => {
    try {
      const nextState = !method.isActive;
      const res = await fetch("/api/admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: method.id, isActive: nextState }),
      });
      const json = await res.json();
      if (json.success) {
        notify(`পেমেন্ট মেথড '${method.name}' এখন ${nextState ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Inactive)"}!`);
        fetchPaymentMethodsAdmin();
      } else {
        notify(json.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message || "ত্রুটি ঘটেছে", "error");
    }
  };

  // Payment Method Delete Trigger
  const handleDeletePaymentMethod = (method: any) => {
    setDeleteConfirm({
      open: true,
      type: "paymentMethod",
      id: method.id,
      title: `পেমেন্ট মেথড "${method.name} (${method.accountNumber})"`,
    });
  };

  // Payment Manual Verify Action
  const handleManualVerifyPayment = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MANUAL_VERIFY", orderId }),
      });
      const json = await res.json();
      if (json.success) {
        notify("পেমেন্ট সফলভাবে ভেরিফাই ও সাবস্ক্রিপশন চালু হয়েছে!");
        fetchPayments();
        fetchOverview();
      } else {
        notify(json.error || "ভেরিফিকেশন ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Refund Order Action
  const handleRefundOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REFUND", orderId, reason: "Admin initiated refund" }),
      });
      const json = await res.json();
      if (json.success) {
        notify("রিফান্ড সম্পন্ন হয়েছে এবং প্ল্যান বাতিল করা হয়েছে!");
        fetchPayments();
        fetchOverview();
      } else {
        notify(json.error || "রিফান্ড ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Reject Order Action
  const handleRejectOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", orderId, reason: "Admin rejected unverified payment" }),
      });
      const json = await res.json();
      if (json.success) {
        notify("অর্ডারটি সফলভাবে বাতিল (Reject) করা হয়েছে!");
        fetchPayments();
        fetchOverview();
      } else {
        notify(json.error || "বাতিল ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        const res = await fetch("/api/admin/reminders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingReminder.id, ...reminderFormData }),
        });
        const json = await res.json();
        if (json.success) {
          notify("রিমাইন্ডার আপডেট হয়েছে!");
          setReminderModalOpen(false);
          fetchReminders();
          fetchOverview();
        } else {
          notify(json.error || "আপডেট ব্যর্থ হয়েছে", "error");
        }
      } else {
        const res = await fetch("/api/admin/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reminderFormData),
        });
        const json = await res.json();
        if (json.success) {
          notify("রিমাইন্ডার যুক্ত হয়েছে!");
          setReminderModalOpen(false);
          fetchReminders();
          fetchOverview();
        } else {
          notify(json.error || "যুক্ত করতে সমস্যা হয়েছে", "error");
        }
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMemory) {
        const res = await fetch("/api/admin/memories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingMemory.id, ...memoryFormData }),
        });
        const json = await res.json();
        if (json.success) {
          notify("মেমোরি সফলভাবে আপডেট হয়েছে!");
          setMemoryModalOpen(false);
          fetchMemories();
        } else {
          notify(json.error || "আপডেট ব্যর্থ হয়েছে", "error");
        }
      } else {
        const res = await fetch("/api/admin/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memoryFormData),
        });
        const json = await res.json();
        if (json.success) {
          notify("মেমোরি সংরক্ষণ করা হয়েছে!");
          setMemoryModalOpen(false);
          fetchMemories();
        } else {
          notify(json.error || "সংরক্ষণে সমস্যা হয়েছে", "error");
        }
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        const res = await fetch("/api/admin/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTask.id, ...taskFormData }),
        });
        const json = await res.json();
        if (json.success) {
          notify("টাস্ক সফলভাবে আপডেট হয়েছে!");
          setTaskModalOpen(false);
          fetchTasks();
        } else {
          notify(json.error || "আপডেট ব্যর্থ হয়েছে", "error");
        }
      } else {
        const res = await fetch("/api/admin/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskFormData),
        });
        const json = await res.json();
        if (json.success) {
          notify("টাস্ক তৈরি হয়েছে!");
          setTaskModalOpen(false);
          fetchTasks();
        } else {
          notify(json.error || "তৈরিতে সমস্যা হয়েছে", "error");
        }
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subFormData),
      });
      const json = await res.json();
      if (json.success) {
        notify("সাবস্ক্রিপশন সফলভাবে প্রদান করা হয়েছে!");
        setSubModalOpen(false);
        fetchSubscriptions();
        fetchUsers();
      } else {
        notify(json.error || "সাবস্ক্রিপশন ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleExecuteDelete = async () => {
    try {
      if (deleteConfirm.type === "plan") {
        const res = await fetch(`/api/admin/plans?id=${deleteConfirm.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          notify(json.message || "প্ল্যান সফলভাবে মুছে ফেলা হয়েছে!");
          setDeleteConfirm({ open: false, type: "user", id: "", title: "" });
          fetchPlans();
          return;
        } else {
          notify(json.error || "প্ল্যান মুছতে সমস্যা হয়েছে", "error");
          setDeleteConfirm({ open: false, type: "user", id: "", title: "" });
          return;
        }
      }

      if (deleteConfirm.type === "paymentMethod") {
        const res = await fetch(`/api/admin/payment-methods?id=${deleteConfirm.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.success) {
          notify(json.message || "পেমেন্ট মেথড সফলভাবে মুছে ফেলা হয়েছে!");
          setDeleteConfirm({ open: false, type: "user", id: "", title: "" });
          fetchPaymentMethodsAdmin();
          return;
        } else {
          notify(json.error || "পেমেন্ট মেথড মুছতে সমস্যা হয়েছে", "error");
          setDeleteConfirm({ open: false, type: "user", id: "", title: "" });
          return;
        }
      }

      let endpoint = "";
      if (deleteConfirm.type === "user") endpoint = `/api/admin/users?id=${deleteConfirm.id}`;
      else if (deleteConfirm.type === "reminder") endpoint = `/api/admin/reminders?id=${deleteConfirm.id}`;
      else if (deleteConfirm.type === "memory") endpoint = `/api/admin/memories?id=${deleteConfirm.id}`;
      else if (deleteConfirm.type === "task") endpoint = `/api/admin/tasks?id=${deleteConfirm.id}`;
      else if (deleteConfirm.type === "subscription") endpoint = `/api/admin/subscriptions?id=${deleteConfirm.id}`;
      else if (deleteConfirm.type === "notification") endpoint = `/api/admin/notifications?id=${deleteConfirm.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json();

      if (json.success) {
        notify(`${deleteConfirm.title} সফলভাবে মুছে ফেলা হয়েছে!`);
        setDeleteConfirm({ open: false, type: "user", id: "", title: "" });
        refreshCurrentTab();
        fetchOverview();
      } else {
        notify(json.error || "ডিলিট ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleNotificationAction = async (action: string, notificationId?: string) => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notificationId }),
      });
      const json = await res.json();
      if (json.success) {
        notify(json.message || "অ্যাকশন সম্পন্ন হয়েছে!");
        fetchNotifications();
        fetchOverview();
      } else {
        notify(json.error || "অ্যাকশন ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleTelegramAction = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (json.success) {
        notify("টেলিগ্রাম সেটিংস আপডেট হয়েছে!");
        fetchTelegrams();
      } else {
        notify(json.error || "ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  const handleExportData = async (targetTable: string = "ALL") => {
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EXPORT_DATA", targetTable }),
      });
      const json = await res.json();
      if (json.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json.exportPayload, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `monerakhbe_backup_${targetTable}_${format(new Date(), "yyyyMMdd_HHmmss")}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        notify("সম্পূর্ণ ডেটা ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!");
      }
    } catch (err: any) {
      notify("এক্সপোর্ট ব্যর্থ হয়েছে", "error");
    }
  };

  // Sidebar Menu Structure
  const menuSections = [
    {
      title: "প্রধান পর্যবেক্ষণ (Monitoring)",
      items: [
        { id: "overview", label: "ওভারভিউ ড্যাশবোর্ড", icon: LayoutDashboard, badge: null },
        { id: "audit", label: "অডিট ও সিকিউরিটি লগ", icon: ShieldAlert, badge: "Live" },
      ],
    },
    {
      title: "পেমেন্ট ও ফাইন্যান্স (Bangladesh Payments)",
      items: [
        { id: "payments", label: "পেমেন্টস ও অর্ডার ট্র্যাকিং", icon: Wallet, badge: paymentAnalytics?.totalPaidCount ? `৳${paymentAnalytics.totalRevenue}` : null },
        { id: "paymentMethods", label: "পেমেন্ট মেথড ও নাম্বার", icon: CreditCard, badge: paymentMethodsAdminList.length ? `${paymentMethodsAdminList.length} মেথড` : "Config" },
        { id: "plans", label: "SaaS প্ল্যান ও প্রাইসিং", icon: BadgePercent, badge: "Config" },
        { id: "subscriptions", label: "ইউজার সাবস্ক্রিপশন", icon: CreditCard, badge: data?.stats?.activeSubscriptions || null },
      ],
    },
    {
      title: "ডেটাবেস ও ইউজার কন্ট্রোল (Management)",
      items: [
        { id: "users", label: "ইউজার ব্যবস্থাপনা", icon: Users, badge: data?.stats?.totalUsers || null },
        { id: "reminders", label: "রিমাইন্ডার সেন্টার", icon: CalendarCheck, badge: data?.stats?.totalReminders || null },
        { id: "memories", label: "মেমোরি ভল্ট", icon: BrainCircuit, badge: data?.stats?.totalMemories || null },
        { id: "tasks", label: "টাস্ক ম্যানেজার", icon: CheckSquare, badge: data?.stats?.totalTasks || null },
      ],
    },
    {
      title: "যোগাযোগ ও ডেলিভারি (Services)",
      items: [
        { id: "telegram", label: "টেলিগ্রাম বটস", icon: Send, badge: data?.stats?.totalTelegramConnections || null },
        {
          id: "notifications",
          label: "নোটিফিকেশন কিউ",
          icon: Bell,
          badge: data?.stats?.failedNotifications ? `⚠️ ${data.stats.failedNotifications}` : null,
        },
      ],
    },
    {
      title: "সিস্টেম ও ব্যাকআপ (Infrastructure)",
      items: [
        { id: "system", label: "সার্ভার ও ডেটা ব্যাকআপ", icon: Server, badge: "Backup" },
      ],
    },
  ];

  // 1. Loading State
  if (loading || (user?.role === "ADMIN" && fetching && !data)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-700">MoneRakhbe Admin প্যানেল যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // 2. Admin Authentication / Gateway Screen (when not logged in as ADMIN)
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 text-white text-center relative">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">MoneRakhbe AI</h1>
            <p className="text-xs font-semibold text-rose-100 mt-1">
              Master Admin Control Center
            </p>
            <span className="inline-block mt-3 px-3 py-1 rounded-full bg-black/20 text-[11px] font-bold tracking-wide uppercase border border-white/10">
              🔒 সিকিউর এডমিন পোর্টাল
            </span>
          </div>

          <div className="p-6 space-y-5">
            {adminLoginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            {/* Current Session Info if logged in as standard user */}
            {user ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">বর্তমান লগইন:</span>
                  <span className="font-bold text-slate-800">{user.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">বর্তমান রোল:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-extrabold text-[10px]">
                    {user.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePromoteCurrentUser}
                  disabled={adminLoginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {adminLoginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>👑 এই অ্যাকাউন্টকে এডমিন পারমিশন দিন</span>
                </button>
              </div>
            ) : null}

            {/* Admin Login Form */}
            <form onSubmit={handleAdminDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  অ্যাডমিন ইমেইল
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@monerakhbe.ai"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  অ্যাডমিন পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={adminLoginLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {adminLoginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>এডমিন প্যানেলে প্রবেশ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail("admin@monerakhbe.ai");
                    setAdminPassword("Admin123456!");
                    setTimeout(() => handleAdminDirectLogin(), 50);
                  }}
                  disabled={adminLoginLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>⚡ কুইক এডমিন লগইন (1-Click Login)</span>
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
              <Link
                href="/dashboard"
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ইউজার ড্যাশবোর্ড</span>
              </Link>

              <Link
                href="/"
                className="text-rose-600 hover:text-rose-700 transition-colors"
              >
                হোমপেজ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex selection:bg-rose-500 selection:text-white">
      {/* ======================= PRO ADMIN SIDEBAR ======================= */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 ring-1 ring-white/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900">MoneRakhbe</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-extrabold tracking-wider uppercase">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Enterprise Control Console</p>
            </div>
          </div>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live System Health Badge */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-700 font-semibold">পেমেন্ট গেটওয়ে:</span>
          </div>
          <span className="text-emerald-700 font-bold font-bold">bKash/Nagad/Rocket সচল</span>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as TabType);
                      setMobileSidebarOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30 border border-rose-400/30"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badge.toString().includes("⚠️")
                            ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Admin User Footer Widget */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-rose-600 font-bold font-semibold truncate">Super Administrator</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="লগআউট"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 font-bold hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ইউজার ড্যাশবোর্ড মোডে যান</span>
          </Link>
        </div>
      </aside>

      {/* ======================= MAIN CONTENT AREA ======================= */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 capitalize">
                  {activeTab === "overview" && "সার্বিক সিস্টেম ওভারভিউ (System Overview)"}
                  {activeTab === "payments" && "বাংলাদেশ পেমেন্ট ও রেভিনিউ ট্র্যাকিং (Payment Gateway)"}
                  {activeTab === "plans" && "SaaS প্যাকেজ মূল্য ও লিমিট কনফিগারেশন (Plans Config)"}
                  {activeTab === "users" && "ইউজার ব্যবস্থাপনা ও পারমিশন (User Management)"}
                  {activeTab === "reminders" && "রিমাইন্ডার হাব ও তালিকা (Reminders Hub)"}
                  {activeTab === "memories" && "মেমোরি ভল্ট মাস্টার (Memory Vault)"}
                  {activeTab === "tasks" && "টাস্ক ম্যানেজার কন্ট্রোল (Tasks Master)"}
                  {activeTab === "telegram" && "টেলিগ্রাম কানেকশন ট্র্যাকিং (Telegram Bots)"}
                  {activeTab === "notifications" && "নোটিফিকেশন ডেলিভারি কিউ (Notification Queue)"}
                  {activeTab === "subscriptions" && "সাবস্ক্রিপশন ও বিলিং (Billing & Plans)"}
                  {activeTab === "audit" && "সিকিউরিটি ও অডিট ট্রেইল (Security Logs)"}
                  {activeTab === "system" && "সার্ভার ডায়াগনস্টিকস ও ব্যাকআপ (System Tools)"}
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                অ্যাডমিন প্রিভিলেজ সহ সকল ডেটা অবিলম্বে পরিবর্তন ও নিয়ন্ত্রণযোগ্য
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshCurrentTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-700 border border-slate-300 text-slate-800 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
          </div>
        </header>

        {/* Floating Notification Toast */}
        {actionMsg && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 ${
                actionMsg.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
                  : "bg-rose-950/90 border-rose-500 text-rose-200"
              }`}
            >
              {actionMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 font-bold" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 font-bold" />
              )}
              {actionMsg.text}
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ----------------- TAB: PAYMENTS & REVENUE ----------------- */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Revenue Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">মোট আয় (Total Revenue)</span>
                  <p className="text-3xl font-black text-emerald-700 font-bold">
                    ৳{paymentAnalytics?.totalRevenue || 0} BDT
                  </p>
                  <p className="text-[10px] text-slate-500">
                    সফল পেমেন্ট: {paymentAnalytics?.totalPaidCount || 0}টি
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">বিকাশ লেনদেন (bKash)</span>
                  <p className="text-3xl font-black text-pink-700 font-bold">
                    ৳{paymentAnalytics?.bkashRevenue || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">bKash Tokenized Checkout</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">নগদ লেনদেন (Nagad)</span>
                  <p className="text-3xl font-black text-amber-700 font-bold">
                    ৳{paymentAnalytics?.nagadRevenue || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Nagad Merchant PG</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500 font-semibold">রকেট লেনদেন (Rocket)</span>
                  <p className="text-3xl font-black text-purple-700 font-bold">
                    ৳{paymentAnalytics?.rocketRevenue || 0}
                  </p>
                  <p className="text-[10px] text-slate-500">Rocket DBBL Gateway</p>
                </div>
              </div>

              {/* Action & Filter Bar */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="অর্ডার নং, TrxID, ইউজার বা ইমেইল দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল স্ট্যাটাস</option>
                    <option value="PAID">PAID (পরিশোধিত)</option>
                    <option value="PENDING">PENDING (অপেক্ষমান)</option>
                    <option value="FAILED">FAILED (ব্যর্থ)</option>
                    <option value="REFUNDED">REFUNDED (রিফান্ডেড)</option>
                  </select>

                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল মেথড</option>
                    <option value="bkash">bKash (বিকাশ)</option>
                    <option value="nagad">Nagad (নগদ)</option>
                    <option value="rocket">Rocket (রকেট)</option>
                  </select>
                </div>

                <Link
                  href="/checkout?plan=PRO"
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>লাইভ চেকআউট টেস্ট</span>
                </Link>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">অর্ডার ও তারিখ</th>
                        <th className="p-3.5">গ্রাহক তথ্য</th>
                        <th className="p-3.5">প্যাকেজ</th>
                        <th className="p-3.5">পরিমাণ</th>
                        <th className="p-3.5">পদ্ধতি ও TrxID</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            কোনো পেমেন্ট অর্ডার রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        ordersList.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="p-3.5">
                              <p className="font-mono font-bold text-slate-900 text-[11px]">{o.orderNumber}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {format(new Date(o.createdAt), "dd MMM yyyy, hh:mm a")}
                              </p>
                            </td>

                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{o.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{o.user?.email}</p>
                            </td>

                            <td className="p-3.5">
                              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                                {o.plan?.name || o.planId} ({o.billingCycle})
                              </span>
                            </td>

                            <td className="p-3.5 font-black text-rose-600 font-bold font-mono text-sm">
                              ৳{o.amount}
                            </td>

                            <td className="p-3.5">
                              <p className="uppercase font-bold text-slate-800 text-[11px]">{o.paymentMethod}</p>
                              <p className="font-mono text-indigo-700 font-bold text-[10px]">
                                {o.providerTransactionId || o.transactionId || "N/A"}
                              </p>
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  o.status === "PAID"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
                                    : o.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200 font-bold"
                                    : o.status === "REFUNDED"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200 font-bold"
                                    : "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {o.invoice && (
                                  <Link
                                    href={`/invoice/${o.invoice.id}`}
                                    target="_blank"
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                                    title="ইনভয়েস দেখুন"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </Link>
                                )}

                                {o.status === "PENDING" && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleManualVerifyPayment(o.id)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] shadow-sm flex items-center gap-1 transition-all hover:scale-105"
                                      title="পেমেন্ট কনফার্ম ও প্যাকেজ সক্রিয় করুন"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>কনফার্ম করুন</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectOrder(o.id)}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                                      title="অর্ডারটি বাতিল করুন"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>বাতিল</span>
                                    </button>
                                  </div>
                                )}

                                {o.status === "PAID" && (
                                  <button
                                    onClick={() => handleRefundOrder(o.id)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[10px]"
                                  >
                                    রিফান্ড
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB: PAYMENT METHODS & MERCHANT NUMBERS ----------------- */}
          {activeTab === "paymentMethods" && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-rose-600 font-bold" />
                    <span>পেমেন্ট মেথড ও মার্চেন্ট একাউন্ট কন্ট্রোল (Payment Gateways)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    অ্যাডমিন প্যানেল থেকে বিকাশ, নগদ, রকেট সহ সকল পেমেন্ট নম্বর, পার্সোনাল/মার্চেন্ট ধরন এবং নির্দেশনা কনফিগার করুন
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPaymentMethod(null);
                    setPaymentMethodFormData({
                      name: "",
                      code: "",
                      type: "WALLET",
                      accountNumber: "",
                      accountType: "Personal",
                      instructions: "১. আপনার অ্যাপ থেকে সেন্ড মানি করুন।\n২. নির্ধারিত বিকাশ/নগদ নাম্বারে টাকা পাঠান।\n৩. ট্রানজেকশন আইডি দিয়ে সাবমিট করুন।",
                      chargePercent: 0,
                      isActive: true,
                      displayOrder: paymentMethodsAdminList.length + 1,
                    });
                    setPaymentMethodModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন পেমেন্ট মেথড যোগ করুন</span>
                </button>
              </div>

              {/* Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paymentMethodsAdminList.length === 0 ? (
                  <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
                    <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">কোনো পেমেন্ট মেথড পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-400">নতুন পেমেন্ট মেথড ও নাম্বার যোগ করতে উপরের বাটনে ক্লিক করুন।</p>
                  </div>
                ) : (
                  paymentMethodsAdminList.map((m) => {
                    const isBkash = m.code?.toLowerCase() === "bkash";
                    const isNagad = m.code?.toLowerCase() === "nagad";
                    const isRocket = m.code?.toLowerCase() === "rocket";

                    const badgeColor = isBkash
                      ? "bg-pink-100 text-pink-800 border-pink-200"
                      : isNagad
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : isRocket
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : "bg-indigo-100 text-indigo-800 border-indigo-200";

                    return (
                      <div
                        key={m.id}
                        className={`p-5 rounded-3xl bg-white border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                          m.isActive ? "border-slate-200 hover:border-slate-300" : "border-rose-200 bg-rose-50/20 opacity-75"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Method Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badgeColor}`}>
                                {m.code?.toUpperCase()}
                              </span>
                              <h4 className="text-base font-black text-slate-900 pt-1">{m.name}</h4>
                            </div>

                            {/* Active Switch Toggle */}
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentMethodActive(m)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                m.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
                                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300"
                              }`}
                              title={m.isActive ? "নিষ্ক্রিয় করতে ক্লিক করুন" : "সক্রিয় করতে ক্লিক করুন"}
                            >
                              <span className={`w-2 h-2 rounded-full ${m.isActive ? "bg-emerald-600 animate-pulse" : "bg-slate-500"}`}></span>
                              <span>{m.isActive ? "সক্রিয় (Active)" : "নিষ্ক্রিয় (Off)"}</span>
                            </button>
                          </div>

                          {/* Account Number Box */}
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-semibold">একাউন্ট / মার্চেন্ট নম্বর:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-extrabold text-[10px]">
                                {m.accountType || "Personal"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-base font-black text-slate-900">{m.accountNumber}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(m.accountNumber);
                                  notify(`নম্বর '${m.accountNumber}' কপি হয়েছে!`);
                                }}
                                className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                title="নম্বর কপি করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Extra info */}
                          <div className="space-y-1 text-xs text-slate-600">
                            {m.chargePercent > 0 && (
                              <p className="text-[11px] text-amber-700 font-bold">
                                ⚡ অতিরিক্ত চার্জ: {m.chargePercent}%
                              </p>
                            )}
                            <div className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50/60 p-2 rounded-xl border border-slate-100 whitespace-pre-line">
                              {m.instructions || "কোনো নির্দেশনাবলী যুক্ত করা নেই"}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPaymentMethod(m);
                              setPaymentMethodFormData({
                                name: m.name,
                                code: m.code,
                                type: m.type || "WALLET",
                                accountNumber: m.accountNumber,
                                accountType: m.accountType || "Personal",
                                instructions: m.instructions || "",
                                chargePercent: m.chargePercent || 0,
                                isActive: m.isActive,
                                displayOrder: m.displayOrder || 0,
                              });
                              setPaymentMethodModalOpen(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>এডিট নম্বর ও তথ্য</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePaymentMethod(m)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
                            title="মেথড মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ----------------- TAB: PLANS CONFIGURATION ----------------- */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BadgePercent className="w-5 h-5 text-indigo-700 font-bold" />
                    SaaS প্যাকেজ ও মূল্য নির্ধারণ (Plan Pricing & Limits)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    অ্যাডমিন প্যানেল থেকে যেকোনো প্যাকেজের মাসিক/বাৎসরিক ফি এবং লিমিট পরিবর্তন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plansList.map((p) => (
                  <div
                    key={p.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono">
                          ID: {p.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                      <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">মাসিক মূল্য:</span>
                          <strong className="text-rose-600 font-bold font-mono text-sm">৳{p.monthlyPrice} BDT</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">বাৎসরিক মূল্য:</span>
                          <strong className="text-emerald-700 font-bold font-mono text-sm">৳{p.yearlyPrice} BDT</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        <p>⏰ রিমাইন্ডার লিমিট: <strong>{p.reminderLimit}টি</strong></p>
                        <p>🧠 মেমোরি লিমিট: <strong>{p.memoryLimit}টি</strong></p>
                        <p>📋 টাস্ক লিমিট: <strong>{p.taskLimit}টি</strong></p>
                        <p>✨ AI রিকোয়েস্ট: <strong>{p.aiLimit}টি</strong></p>
                        <p>📁 ফাইল আপলোড: <strong>{p.fileSizeLimit} MB</strong></p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingPlan(p);
                        setPlanFormData(p);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>মূল্য ও লিমিট এডিট করুন</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 1: OVERVIEW ----------------- */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => {
                    setStatusFilter("ALL");
                    setActiveTab("users");
                  }}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">মোট নিবন্ধিত ইউজার</span>
                    <Users className="w-5 h-5 text-indigo-700 font-bold group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-2">{data?.stats?.totalUsers || 0}</p>
                  <div className="mt-2 text-[11px] text-emerald-700 font-bold font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    সক্রিয় ইউজার: {data?.stats?.activeUsers ?? data?.stats?.totalUsers ?? 0} জন
                  </div>
                </div>

                <div
                  onClick={() => {
                    setStatusFilter("suspended");
                    setActiveTab("users");
                  }}
                  className="p-5 rounded-3xl bg-white border border-rose-200 hover:border-rose-400 transition-all shadow-sm cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-rose-700 font-semibold">ব্লকড / অফ ইউজার</span>
                    <Ban className="w-5 h-5 text-rose-600 font-bold group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-3xl font-black text-rose-600 font-bold mt-2">
                    {data?.stats?.suspendedUsers || 0}
                  </p>
                  <div className="mt-2 text-[11px] text-rose-600 font-medium">
                    {data?.stats?.suspendedUsers ? "অ্যাকাউন্ট অফ/ব্লক করা আছে" : "কোনো ইউজার ব্লক নেই"}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">টেলিগ্রাম কানেক্টেড</span>
                    <Send className="w-5 h-5 text-sky-700 font-bold" />
                  </div>
                  <p className="text-3xl font-black text-sky-700 font-bold mt-2">
                    {data?.stats?.totalTelegramConnections || 0}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-500">সক্রিয় বট ইন্টিগ্রেশন</div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">মোট রিমাইন্ডার</span>
                    <CalendarCheck className="w-5 h-5 text-purple-700 font-bold" />
                  </div>
                  <p className="text-3xl font-black text-purple-700 font-bold mt-2">{data?.stats?.totalReminders || 0}</p>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {data?.stats?.pendingReminders || 0} পেন্ডিং • {data?.stats?.completedReminders || 0} সম্পন্ন
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Users Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-rose-600 font-bold" />
                    কুইক অ্যাডমিন অ্যাকশন
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setActiveTab("payments")}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
                    >
                      <Wallet className="w-4 h-4 text-emerald-700 font-bold mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">পেমেন্ট ট্র্যাকিং</p>
                      <p className="text-[10px] text-slate-500">বিকাশ/নগদ রেকর্ড</p>
                    </button>

                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setUserFormData({
                          name: "",
                          email: "",
                          password: "",
                          newPassword: "",
                          role: "USER",
                          plan: "FREE",
                          timezone: "Asia/Dhaka",
                          language: "bn",
                          isSuspended: false,
                        });
                        setUserModalOpen(true);
                      }}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
                    >
                      <Plus className="w-4 h-4 text-indigo-700 font-bold mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">নতুন ইউজার</p>
                      <p className="text-[10px] text-slate-500">ইউজার তৈরি করুন</p>
                    </button>

                    <button
                      onClick={() => {
                        setEditingReminder(null);
                        setReminderFormData({
                          userId: usersList[0]?.id || "",
                          title: "",
                          description: "",
                          dueAt: new Date().toISOString().slice(0, 16),
                          priority: "NORMAL",
                          categoryName: "General",
                          status: "PENDING",
                        });
                        setReminderModalOpen(true);
                      }}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
                    >
                      <Plus className="w-4 h-4 text-purple-700 font-bold mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">নতুন রিমাইন্ডার</p>
                      <p className="text-[10px] text-slate-500">রিমাইন্ডার যুক্ত করুন</p>
                    </button>

                    <button
                      onClick={() => handleExportData("ALL")}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
                    >
                      <Download className="w-4 h-4 text-amber-700 font-bold mb-1 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">ডেটা ব্যাকআপ</p>
                      <p className="text-[10px] text-slate-500">JSON এক্সপোর্ট</p>
                    </button>
                  </div>
                </div>

                {/* Recent Users Table */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-700 font-bold" />
                      সাম্প্রতিক নিবন্ধিত ইউজার
                    </h3>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="text-xs text-indigo-700 font-bold hover:text-indigo-300 font-bold flex items-center gap-1"
                    >
                      সব ইউজার দেখুন <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">ইউজার</th>
                          <th className="p-2.5">প্ল্যান</th>
                          <th className="p-2.5">রোল</th>
                          <th className="p-2.5">স্ট্যাটাস</th>
                          <th className="p-2.5">টেলিগ্রাম</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {data?.users?.slice(0, 5).map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-100/30">
                            <td className="p-2.5">
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-500">{u.email}</p>
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {u.plan}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === "ADMIN"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-2.5">
                              {u.isSuspended ? (
                                <span className="text-rose-600 font-bold font-bold">Suspended</span>
                              ) : (
                                <span className="text-emerald-700 font-bold font-bold">Active</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {u.telegramConnection?.isConnected ? (
                                <span className="text-sky-700 font-bold font-semibold">
                                  @{u.telegramConnection.username || "Connected"}
                                </span>
                              ) : (
                                <span className="text-slate-600">None</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 2: USERS MANAGEMENT ----------------- */}
          {activeTab === "users" && (
            <div className="space-y-5">
              {/* Quick ID Block / Turn Off Action Box */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>কুইক ইউজার আইডি ব্লক ও অফ কন্ট্রোল (Quick User Block / Turn Off by ID or Email)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="ইউজার আইডি (User ID e.g. clx...) অথবা ইমেইল অ্যাড্রেস লিখুন..."
                    value={quickBlockInput}
                    onChange={(e) => setQuickBlockInput(e.target.value)}
                    className="flex-1 min-w-[280px] bg-white border border-rose-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                  />

                  <button
                    onClick={() => handleQuickBlockById("BLOCK")}
                    disabled={quickBlockLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>ইউজার অফ / ব্লক করুন</span>
                  </button>

                  <button
                    onClick={() => handleQuickBlockById("UNBLOCK")}
                    disabled={quickBlockLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>ইউজার অন / আনব্লক করুন</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  💡 কোনো ইউজার ব্লক/অফ করা হলে তিনি ড্যাশবোর্ড, চ্যাটবট বা এআই সার্ভিসে লগইন অথবা অ্যাক্সেস করতে পারবেন না।
                </p>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="ইউজার নাম, ইমেইল বা আইডি দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল স্ট্যাটাস</option>
                    <option value="active">🟢 সক্রিয় / অন ইউজার (Active)</option>
                    <option value="suspended">🔴 ব্লকড / অফ ইউজার (Blocked)</option>
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল রোল</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল প্ল্যান</option>
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="BUSINESS">BUSINESS</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingUser(null);
                    setUserFormData({
                      name: "",
                      email: "",
                      password: "",
                      newPassword: "",
                      role: "USER",
                      plan: "FREE",
                      timezone: "Asia/Dhaka",
                      language: "bn",
                      isSuspended: false,
                    });
                    setUserModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ইউজার তৈরি করুন</span>
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ইউজার তথ্য ও আইডি</th>
                        <th className="p-3.5">রোল ও পারমিশন</th>
                        <th className="p-3.5">সাবস্ক্রিপশন</th>
                        <th className="p-3.5">টেলিগ্রাম</th>
                        <th className="p-3.5">কাউন্টার</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">ব্লক / অফ / ম্যানেজ অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            কোনো ইউজার রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-start gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0 mt-0.5">
                                  {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <p className="font-bold text-slate-900">{u.name}</p>
                                  <p className="text-[11px] text-slate-500">{u.email}</p>
                                  <div className="flex items-center gap-1 pt-0.5">
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[140px]">
                                      ID: {u.id}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(u.id);
                                        notify("ইউজার আইডি কপি করা হয়েছে!");
                                      }}
                                      title="আইডি কপি করুন"
                                      className="p-0.5 text-slate-400 hover:text-slate-700"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                  u.role === "ADMIN"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                                    : "bg-slate-100 text-slate-700 border border-slate-300"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                  u.plan === "BUSINESS"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200 font-bold"
                                    : u.plan === "PRO"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200 font-bold"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {u.plan}
                              </span>
                            </td>

                            <td className="p-3.5">
                              {u.telegramConnection?.isConnected ? (
                                <span className="text-sky-700 font-bold font-semibold">
                                  @{u.telegramConnection.username || "Connected"}
                                </span>
                              ) : (
                                <span className="text-slate-400">None</span>
                              )}
                            </td>

                            <td className="p-3.5 text-slate-600 text-[11px]">
                              {u._count?.reminders || 0} রিমাইন্ডার • {u._count?.memories || 0} মেমোরি
                            </td>

                            <td className="p-3.5">
                              {u.isSuspended ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1 shadow-sm">
                                  <Ban className="w-3 h-3 text-rose-600" />
                                  <span>🔴 ব্লকড / অফ (Off)</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 shadow-sm">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>🟢 সচল / অন (Active)</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* 1-Click Block / Turn Off or Unblock Toggle */}
                                {u.isSuspended ? (
                                  <button
                                    onClick={() => handleToggleUserBlock(u.id, u.isSuspended, u.name)}
                                    title="ইউজার চালু ও আনব্লক করুন"
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
                                  >
                                    <Power className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>অন / আনব্লক</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleUserBlock(u.id, u.isSuspended, u.name)}
                                    disabled={u.id === user?.id}
                                    title={u.id === user?.id ? "নিজের অ্যাকাউন্ট ব্লক করা সম্ভব নয়" : "ইউজার বন্ধ ও ব্লক করুন"}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-bold text-xs flex items-center gap-1 transition-all shadow-sm disabled:opacity-30"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                                    <span>অফ / ব্লক</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setEditingUser(u);
                                    setUserFormData({
                                      name: u.name,
                                      email: u.email,
                                      password: "",
                                      newPassword: "",
                                      role: u.role,
                                      plan: u.plan,
                                      timezone: u.timezone || "Asia/Dhaka",
                                      language: u.language || "bn",
                                      isSuspended: u.isSuspended || false,
                                    });
                                    setUserModalOpen(true);
                                  }}
                                  title="ইউজার তথ্য পরিবর্তন"
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: "user",
                                      id: u.id,
                                      title: `ইউজার "${u.name} (${u.email})"`,
                                    })
                                  }
                                  disabled={u.id === user?.id}
                                  title="ইউজার পার্মানেন্ট মুছে ফেলুন"
                                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold disabled:opacity-30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: REMINDERS ----------------- */}
          {activeTab === "reminders" && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="রিমাইন্ডার শিরোনাম দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingReminder(null);
                    setReminderFormData({
                      userId: usersList[0]?.id || "",
                      title: "",
                      description: "",
                      dueAt: new Date().toISOString().slice(0, 16),
                      priority: "NORMAL",
                      categoryName: "General",
                      status: "PENDING",
                    });
                    setReminderModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন রিমাইন্ডার</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">শিরোনাম ও বিবরণ</th>
                        <th className="p-3.5">ইউজার</th>
                        <th className="p-3.5">সময়সূচি (Due Time)</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {remindersList.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-3.5">
                            <p className="font-bold text-slate-900">{r.title}</p>
                            {r.description && <p className="text-[10px] text-slate-500">{r.description}</p>}
                          </td>
                          <td className="p-3.5">{r.user?.name}</td>
                          <td className="p-3.5 font-mono text-[11px]">{format(new Date(r.dueAt), "dd MMM yyyy, hh:mm a")}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  type: "reminder",
                                  id: r.id,
                                  title: `রিমাইন্ডার "${r.title}"`,
                                })
                              }
                              className="p-1.5 rounded-lg bg-rose-950/40 text-rose-600 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 4: MEMORIES VAULT ----------------- */}
          {activeTab === "memories" && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="মেমোরি কি-ওয়ার্ড, ট্যাগ বা টেক্সট দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল ক্যাটাগরি</option>
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Work">Work (কাজ/অফিস)</option>
                    <option value="Financial">Financial (আর্থিক)</option>
                    <option value="Health">Health (স্বাস্থ্য)</option>
                    <option value="Important">Important (জরুরি)</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingMemory(null);
                    setMemoryFormData({
                      userId: usersList[0]?.id || "",
                      category: "Personal",
                      key: "",
                      value: "",
                      tags: "",
                      summary: "",
                    });
                    setMemoryModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন মেমোরি যুক্ত করুন</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">মেমোরি তথ্য (Key & Value)</th>
                        <th className="p-3.5">ইউজার</th>
                        <th className="p-3.5">ক্যাটাগরি</th>
                        <th className="p-3.5">তৈরির তারিখ</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memoriesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500">
                            কোনো মেমোরি রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        memoriesList.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-3.5 max-w-md">
                              <p className="font-bold text-slate-900">{m.key}</p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{m.value}</p>
                              {m.tags && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-indigo-700 font-mono">
                                  #{m.tags}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900">{m.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{m.user?.email}</p>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {m.category}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-slate-500">
                              {format(new Date(m.createdAt), "dd MMM yyyy")}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingMemory(m);
                                    setMemoryFormData({
                                      userId: m.userId,
                                      category: m.category,
                                      key: m.key,
                                      value: m.value,
                                      tags: m.tags || "",
                                      summary: m.summary || "",
                                    });
                                    setMemoryModalOpen(true);
                                  }}
                                  title="মেমোরি এডিট"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: "memory",
                                      id: m.id,
                                      title: `মেমোরি "${m.key}"`,
                                    })
                                  }
                                  title="মেমোরি ডিলিট"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 5: TASKS MASTER ----------------- */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="টাস্ক শিরোনাম দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল স্ট্যাটাস</option>
                    <option value="TODO">TODO (করতে হবে)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (চলমান)</option>
                    <option value="COMPLETED">COMPLETED (সম্পন্ন)</option>
                    <option value="CANCELLED">CANCELLED (বাতিল)</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="ALL">সকল প্রায়োরিটি</option>
                    <option value="HIGH">HIGH (উচ্চ)</option>
                    <option value="NORMAL">NORMAL (স্বাভাবিক)</option>
                    <option value="LOW">LOW (নিম্ন)</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingTask(null);
                    setTaskFormData({
                      userId: usersList[0]?.id || "",
                      title: "",
                      description: "",
                      priority: "NORMAL",
                      status: "TODO",
                      dueDate: "",
                      dueTime: "",
                      category: "Work",
                    });
                    setTaskModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন টাস্ক তৈরি করুন</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">টাস্ক ও বিবরণ</th>
                        <th className="p-3.5">ইউজার</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5">প্রায়োরিটি</th>
                        <th className="p-3.5">নির্ধারিত তারিখ</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasksList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            কোনো টাস্ক রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        tasksList.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{t.title}</p>
                              {t.description && <p className="text-[10px] text-slate-500 mt-0.5">{t.description}</p>}
                            </td>
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900">{t.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{t.user?.email}</p>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : t.status === "IN_PROGRESS"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.priority === "HIGH"
                                    ? "bg-rose-100 text-rose-800"
                                    : t.priority === "LOW"
                                    ? "bg-slate-100 text-slate-600"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-slate-500">
                              {t.dueDate ? format(new Date(t.dueDate), "dd MMM yyyy") : "N/A"}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingTask(t);
                                    setTaskFormData({
                                      userId: t.userId,
                                      title: t.title,
                                      description: t.description || "",
                                      priority: t.priority,
                                      status: t.status,
                                      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
                                      dueTime: t.dueTime || "",
                                      category: t.category || "Work",
                                    });
                                    setTaskModalOpen(true);
                                  }}
                                  title="টাস্ক এডিট"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: "task",
                                      id: t.id,
                                      title: `টাস্ক "${t.title}"`,
                                    })
                                  }
                                  title="টাস্ক ডিলিট"
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 6: TELEGRAM BOTS ----------------- */}
          {activeTab === "telegram" && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-sky-600" />
                    টেলিগ্রাম বট কানেকশন তালিকা
                  </h3>
                  <p className="text-xs text-slate-500">সকল ইউজারের টেলিগ্রাম চ্যাট আইডি ও কানেকশন অবস্থা</p>
                </div>
                <button
                  onClick={fetchTelegrams}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold"
                >
                  রিফ্রেশ
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ইউজার তথ্য</th>
                        <th className="p-3.5">টেলিগ্রাম ইউজারনেম</th>
                        <th className="p-3.5">Chat ID & User ID</th>
                        <th className="p-3.5">কানেকশন টোকেন</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {telegramsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            কোনো টেলিগ্রাম কানেকশন নেই
                          </td>
                        </tr>
                      ) : (
                        telegramsList.map((tc) => (
                          <tr key={tc.id} className="hover:bg-slate-50">
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{tc.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{tc.user?.email}</p>
                            </td>
                            <td className="p-3.5">
                              {tc.username ? (
                                <span className="font-bold text-sky-700">@{tc.username}</span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              <p className="text-slate-900">Chat: {tc.chatId || "N/A"}</p>
                              <p className="text-slate-500 text-[10px]">TG ID: {tc.telegramUserId || "N/A"}</p>
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-slate-600 font-bold">
                              {tc.connectionToken || "N/A"}
                            </td>
                            <td className="p-3.5">
                              {tc.isConnected ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  🟢 সচল (Connected)
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  ⚪ ডিসকানেক্টেড
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleTelegramAction(tc.id, "REGENERATE_TOKEN")}
                                  title="নতুন টোকেন জেনারেট করুন"
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                                >
                                  নতুন টোকেন
                                </button>
                                {tc.isConnected && (
                                  <button
                                    onClick={() => handleTelegramAction(tc.id, "DISCONNECT")}
                                    title="কানেকশন বিচ্ছিন্ন করুন"
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px]"
                                  >
                                    ডিসকানেক্ট
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 7: NOTIFICATIONS QUEUE ----------------- */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-600" />
                    নোটিফিকেশন ডেলিভারি কিউ
                  </h3>
                  <p className="text-xs text-slate-500">সকল পুশ/টেলিগ্রাম নোটিফিকেশনের ডেলিভারি রিপোর্ট</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNotificationAction("RETRY_ALL_FAILED")}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    <span>ব্যর্থগুলো পুনরায় পাঠান (Retry All)</span>
                  </button>
                  <button
                    onClick={() => handleNotificationAction("PURGE_OLD_SENT")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    পুরানো সাফ করুন
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">রিমাইন্ডার ও সময়সূচি</th>
                        <th className="p-3.5">ইউজার</th>
                        <th className="p-3.5">চ্যানেল</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5">রিট্রাই / মেসেজ</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notificationsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            কোনো নোটিফিকেশন কিউ রেকর্ড নেই
                          </td>
                        </tr>
                      ) : (
                        notificationsList.map((n) => (
                          <tr key={n.id} className="hover:bg-slate-50">
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{n.reminder?.title || "Notification"}</p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                সময়: {format(new Date(n.scheduledFor), "dd MMM, hh:mm a")}
                              </p>
                            </td>
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900">{n.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{n.user?.email}</p>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                                {n.channel}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  n.status === "SENT"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : n.status === "FAILED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {n.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-[10px] text-slate-500">
                              <p>রিট্রাই: {n.retryCount || 0} বার</p>
                              {n.errorMessage && <p className="text-rose-600 truncate max-w-[160px]">{n.errorMessage}</p>}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {n.status === "FAILED" && (
                                  <button
                                    onClick={() => handleNotificationAction("RETRY_SINGLE", n.id)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px]"
                                  >
                                    রিট্রাই
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: "notification",
                                      id: n.id,
                                      title: `নোটিফিকেশন #${n.id.slice(0, 8)}`,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 8: SUBSCRIPTIONS ----------------- */}
          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">ইউজার সাবস্ক্রিপশন ও প্ল্যান তালিকা</h3>
                  <p className="text-xs text-slate-500">সকল সক্রিয় ও মেয়াদোত্তীর্ণ সাবস্ক্রিপশন ট্র্যাকিং</p>
                </div>
                <button
                  onClick={() => {
                    setSubFormData({
                      userId: usersList[0]?.id || "",
                      planId: "PRO",
                      billingCycle: "MONTHLY",
                      durationMonths: 1,
                      paymentMethod: "manual_admin",
                    });
                    setSubModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>প্ল্যান প্রদান (Grant Plan)</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ইউজার</th>
                        <th className="p-3.5">প্ল্যান আইডি</th>
                        <th className="p-3.5">বিলিং সাইকেল</th>
                        <th className="p-3.5">মেয়াদ শেষ</th>
                        <th className="p-3.5">পেমেন্ট মেথড</th>
                        <th className="p-3.5">স্ট্যাটাস</th>
                        <th className="p-3.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subscriptionsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            কোনো সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি
                          </td>
                        </tr>
                      ) : (
                        subscriptionsList.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-3.5">
                              <p className="font-bold text-slate-900">{s.user?.name}</p>
                              <p className="text-[10px] text-slate-500">{s.user?.email}</p>
                            </td>
                            <td className="p-3.5 font-bold text-indigo-700 font-bold">{s.planId}</td>
                            <td className="p-3.5">{s.billingCycle}</td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {s.expiresAt || s.validUntil
                                ? format(new Date(s.expiresAt || s.validUntil), "dd MMM yyyy")
                                : "অনির্দিষ্ট (Lifetime)"}
                            </td>
                            <td className="p-3.5 text-[11px] font-mono text-slate-600 uppercase">
                              {s.paymentMethod || "system"}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  s.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    open: true,
                                    type: "subscription",
                                    id: s.id,
                                    title: `সাবস্ক্রিপশন (${s.user?.email} - ${s.planId})`,
                                  })
                                }
                                title="সাবস্ক্রিপশন বাতিল করুন"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 9: AUDIT TRAIL ----------------- */}
          {activeTab === "audit" && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-700 font-bold" />
                  সিকিউরিটি ও অ্যাডমিন অডিট ট্রেইল (Audit Trail)
                </h3>
                <button
                  onClick={fetchOverview}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold"
                >
                  রিফ্রেশ
                </button>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto font-mono text-xs">
                {data?.auditLogs?.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                        {log.action}
                      </span>{" "}
                      <span className="text-slate-900 font-bold">{log.entityType}</span>{" "}
                      <span className="text-slate-500">by {log.user?.name || log.user?.email || "System"}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 10: SYSTEM DIAGNOSTICS & BACKUP ----------------- */}
          {activeTab === "system" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-700 font-bold" />
                  সম্পূর্ণ ডেটাবেস ব্যাকআপ ও এক্সপোর্ট
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleExportData("ALL")}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> সম্পূর্ণ ডেটা (ALL)
                  </button>
                  <button
                    onClick={() => handleExportData("users")}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> ইউজার ব্যাকআপ
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-3 font-mono text-xs">
                <h3 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-700 font-bold" />
                  সার্ভার ডায়াগনস্টিকস
                </h3>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Node.js:</span>
                  <strong className="text-slate-900">{process.version}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-slate-500">পেমেন্ট মোড:</span>
                  <strong className="text-emerald-700 font-bold">{process.env.PAYMENT_MODE || "test"} (Sandbox)</strong>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================== MODAL: PLAN CREATE / EDIT ===================== */}
      {(planModalOpen || editingPlan) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingPlan ? `প্যাকেজ এডিট করুন (${editingPlan.name})` : "নতুন SaaS প্ল্যান তৈরি করুন (Create Plan)"}
              </h3>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanModalOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              {!editingPlan && (
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">প্ল্যান আইডি / কোড (Unique ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: STARTER, AGENCY, VIP"
                    value={planFormData.id || ""}
                    onChange={(e) => setPlanFormData({ ...planFormData, id: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">ইংরেজি বড় হাতের অক্ষর ও সংখ্যা ব্যবহার করুন।</p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 mb-1 font-bold">প্যাকেজের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Starter Special, Agency Plus"
                  value={planFormData.name || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">বিবরণ (Description)</label>
                <input
                  type="text"
                  placeholder="গ্রাহকদের জন্য প্যাকেজের সংক্ষিপ্ত বর্ণনা"
                  value={planFormData.description || ""}
                  onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">মাসিক ফি (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    value={planFormData.monthlyPrice ?? 0}
                    onChange={(e) => setPlanFormData({ ...planFormData, monthlyPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-black focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">বাৎসরিক ফি (BDT ৳) *</label>
                  <input
                    type="number"
                    required
                    value={planFormData.yearlyPrice ?? 0}
                    onChange={(e) => setPlanFormData({ ...planFormData, yearlyPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-black focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">রিমাইন্ডার লিমিট</label>
                  <input
                    type="number"
                    value={planFormData.reminderLimit ?? 100}
                    onChange={(e) => setPlanFormData({ ...planFormData, reminderLimit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">মেমোরি লিমিট</label>
                  <input
                    type="number"
                    value={planFormData.memoryLimit ?? 100}
                    onChange={(e) => setPlanFormData({ ...planFormData, memoryLimit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">টাস্ক লিমিট</label>
                  <input
                    type="number"
                    value={planFormData.taskLimit ?? 100}
                    onChange={(e) => setPlanFormData({ ...planFormData, taskLimit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">AI রিকোয়েস্ট লিমিট</label>
                  <input
                    type="number"
                    value={planFormData.aiLimit ?? 100}
                    onChange={(e) => setPlanFormData({ ...planFormData, aiLimit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">ফাইল আপলোড লিমিট (MB)</label>
                  <input
                    type="number"
                    value={planFormData.fileSizeLimit ?? 10}
                    onChange={(e) => setPlanFormData({ ...planFormData, fileSizeLimit: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planFormData.telegramEnabled ?? true}
                    onChange={(e) => setPlanFormData({ ...planFormData, telegramEnabled: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">টেলিগ্রাম বট নোটিফিকেশন সাপোর্ট</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planFormData.advancedFeatures ?? false}
                    onChange={(e) => setPlanFormData({ ...planFormData, advancedFeatures: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-800">অ্যাডভান্সড এআই মেমোরি ও প্রায়োরিটি রিমাইন্ডার</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planFormData.isActive ?? true}
                    onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-emerald-800">প্যাকেজটি সক্রিয় ও গ্রাহকদের জন্য দৃশ্যমান (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlan(null);
                    setPlanModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md shadow-indigo-600/20"
                >
                  {editingPlan ? "সংরক্ষণ করুন (Save Changes)" : "প্ল্যান তৈরি করুন (Create Plan)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: USER CREATE / EDIT ===================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? "ইউজার তথ্য পরিবর্তন (Edit User)" : "নতুন ইউজার তৈরি করুন (Create User)"}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">নাম *</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ইমেইল *</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {!editingUser ? (
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">পাসওয়ার্ড *</label>
                  <input
                    type="password"
                    required
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে লিখুন)</label>
                  <input
                    type="password"
                    placeholder="পাসওয়ার্ড অপরিবর্তিত রাখতে ফাঁকা রাখুন..."
                    value={userFormData.newPassword || ""}
                    onChange={(e) => setUserFormData({ ...userFormData, newPassword: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">রোল</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">প্ল্যান</label>
                  <select
                    value={userFormData.plan}
                    onChange={(e) => setUserFormData({ ...userFormData, plan: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="BUSINESS">BUSINESS</option>
                  </select>
                </div>
              </div>

              {/* Account Status / Block Option */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <label className="block text-slate-800 font-bold mb-1">অ্যাকাউন্ট স্ট্যাটাস (Account On/Off / Block)</label>
                <select
                  value={userFormData.isSuspended ? "SUSPENDED" : "ACTIVE"}
                  onChange={(e) => setUserFormData({ ...userFormData, isSuspended: e.target.value === "SUSPENDED" })}
                  className={`w-full border rounded-xl px-3 py-2 font-bold focus:outline-none ${
                    userFormData.isSuspended
                      ? "bg-rose-50 border-rose-300 text-rose-800"
                      : "bg-emerald-50 border-emerald-300 text-emerald-800"
                  }`}
                >
                  <option value="ACTIVE">🟢 সক্রিয় ও চালু (Active / ON)</option>
                  <option value="SUSPENDED">🔴 ব্লকড ও বন্ধ (Blocked / OFF / Suspended)</option>
                </select>
                <p className="text-[10px] text-slate-500 pt-0.5">
                  ইউজার অ্যাকাউন্ট ব্লক বা অফ করা হলে ইউজার কোনো ডিভাইসে লগইন করতে পারবেন না।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REMINDER CREATE / EDIT ===================== */}
      {reminderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingReminder ? "রিমাইন্ডার এডিট করুন" : "নতুন রিমাইন্ডার তৈরি করুন"}
              </h3>
              <button onClick={() => setReminderModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ইউজার নির্বাচন করুন *</label>
                <select
                  required
                  value={reminderFormData.userId}
                  onChange={(e) => setReminderFormData({ ...reminderFormData, userId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                >
                  <option value="">-- ইউজার বেছে নিন --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">শিরোনাম (Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বিল পরিশোধ, মিটিং, ঔষধ খাওয়া"
                  value={reminderFormData.title}
                  onChange={(e) => setReminderFormData({ ...reminderFormData, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="অতিরিক্ত কোনো নোট থাকলে লিখুন..."
                  value={reminderFormData.description}
                  onChange={(e) => setReminderFormData({ ...reminderFormData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">সময় ও তারিখ *</label>
                  <input
                    type="datetime-local"
                    required
                    value={reminderFormData.dueAt}
                    onChange={(e) => setReminderFormData({ ...reminderFormData, dueAt: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">প্রায়োরিটি</label>
                  <select
                    value={reminderFormData.priority}
                    onChange={(e) => setReminderFormData({ ...reminderFormData, priority: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH (জরুরি)</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setReminderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MEMORY CREATE / EDIT ===================== */}
      {memoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingMemory ? "মেমোরি তথ্য পরিবর্তন" : "নতুন মেমোরি সংরক্ষণ করুন"}
              </h3>
              <button onClick={() => setMemoryModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ইউজার নির্বাচন করুন *</label>
                <select
                  required
                  value={memoryFormData.userId}
                  onChange={(e) => setMemoryFormData({ ...memoryFormData, userId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                >
                  <option value="">-- ইউজার বেছে নিন --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">ক্যাটাগরি</label>
                  <select
                    value={memoryFormData.category}
                    onChange={(e) => setMemoryFormData({ ...memoryFormData, category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Work">Work (অফিস/কাজ)</option>
                    <option value="Financial">Financial (আর্থিক)</option>
                    <option value="Health">Health (স্বাস্থ্য)</option>
                    <option value="Important">Important (জরুরি)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">ট্যাগ (কমা দিয়ে লিখুন)</label>
                  <input
                    type="text"
                    placeholder="পাসপোর্ট, ব্যাংক, অ্যাকাউন্ট"
                    value={memoryFormData.tags}
                    onChange={(e) => setMemoryFormData({ ...memoryFormData, tags: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">মেমোরি কি / শিরোনাম (Key) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পাসপোর্ট নাম্বার, ব্যাংক অ্যাকাউন্ট, প্রিয় রেসিপি"
                  value={memoryFormData.key}
                  onChange={(e) => setMemoryFormData({ ...memoryFormData, key: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">মেমোরি বিষয়বস্তু / বিবরণ (Value) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="মেমোরির মূল বিবরণ বা তথ্য..."
                  value={memoryFormData.value}
                  onChange={(e) => setMemoryFormData({ ...memoryFormData, value: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMemoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: TASK CREATE / EDIT ===================== */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTask ? "টাস্ক এডিট করুন" : "নতুন টাস্ক তৈরি করুন"}
              </h3>
              <button onClick={() => setTaskModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ইউজার নির্বাচন করুন *</label>
                <select
                  required
                  value={taskFormData.userId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, userId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                >
                  <option value="">-- ইউজার বেছে নিন --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">টাস্ক শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: প্রজেক্ট রিপোর্ট জমা দেওয়া, ক্লায়েন্ট ফলোআপ"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="টাস্কের বিস্তারিত নোট..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">স্ট্যাটাস</label>
                  <select
                    value={taskFormData.status}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="TODO">TODO (করতে হবে)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (চলমান)</option>
                    <option value="COMPLETED">COMPLETED (সম্পন্ন)</option>
                    <option value="CANCELLED">CANCELLED (বাতিল)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">প্রায়োরিটি</label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH (উচ্চ)</option>
                    <option value="LOW">LOW (নিম্ন)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">নির্ধারিত তারিখ</label>
                  <input
                    type="date"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">নির্ধারিত সময়</label>
                  <input
                    type="time"
                    value={taskFormData.dueTime}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueTime: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: SUBSCRIPTION GRANT ===================== */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">ইউজারকে প্ল্যান সাবস্ক্রিপশন প্রদান করুন</h3>
              <button onClick={() => setSubModalOpen(false)} className="p-1 text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantSubscription} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">ইউজার নির্বাচন করুন *</label>
                <select
                  required
                  value={subFormData.userId}
                  onChange={(e) => setSubFormData({ ...subFormData, userId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                >
                  <option value="">-- ইউজার বেছে নিন --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">প্যাকেজ (Plan)</label>
                  <select
                    value={subFormData.planId}
                    onChange={(e) => setSubFormData({ ...subFormData, planId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="PRO">PRO</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="FREE">FREE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">বিলিং সাইকেল</label>
                  <select
                    value={subFormData.billingCycle}
                    onChange={(e) => setSubFormData({ ...subFormData, billingCycle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="MONTHLY">MONTHLY (মাসিক)</option>
                    <option value="YEARLY">YEARLY (বাৎসরিক)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">মেয়াদ (মাস)</label>
                <select
                  value={subFormData.durationMonths}
                  onChange={(e) => setSubFormData({ ...subFormData, durationMonths: parseInt(e.target.value, 10) })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none"
                >
                  <option value={1}>১ মাস (1 Month)</option>
                  <option value={3}>৩ মাস (3 Months)</option>
                  <option value={6}>৬ মাস (6 Months)</option>
                  <option value={12}>১ বছর (12 Months)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  সাবস্ক্রিপশন চালু করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PAYMENT METHOD ADD/EDIT ===================== */}
      {paymentMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPaymentMethod ? "পেমেন্ট মেথড ও নাম্বার সম্পাদনা" : "নতুন পেমেন্ট মেথড যোগ করুন"}
                  </h3>
                  <p className="text-[11px] text-slate-500">গ্রাহক চেকআউট ও গেটওয়েতে এই নম্বর ও নির্দেশনা দেখতে পাবে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentMethodModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">পেমেন্ট মেথডের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বিকাশ (bKash) বা নগদ"
                    value={paymentMethodFormData.name}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">মেথড কোড (System Code) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPaymentMethod}
                    placeholder="যেমন: bkash, nagad, rocket, upay"
                    value={paymentMethodFormData.code}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, code: e.target.value.toLowerCase() })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">একাউন্ট / মার্চেন্ট নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: 01886123456"
                    value={paymentMethodFormData.accountNumber}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, accountNumber: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">একাউন্টের ধরন (Account Type)</label>
                  <select
                    value={paymentMethodFormData.accountType}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, accountType: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="Personal">Personal (সেন্ড মানি)</option>
                    <option value="Merchant">Merchant (পেমেন্ট)</option>
                    <option value="Agent">Agent (ক্যাশ ইন)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">
                  পেমেন্ট নির্দেশনাবলী (Bangla Instructions)
                </label>
                <textarea
                  rows={4}
                  placeholder="গ্রাহক পেমেন্ট পাঠানোর জন্য যে নিয়ম দেখবে..."
                  value={paymentMethodFormData.instructions}
                  onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, instructions: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">অতিরিক্ত চার্জ %</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={paymentMethodFormData.chargePercent}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, chargePercent: parseFloat(e.target.value || "0") })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">ডিসপ্লে ক্রম (Order)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1"
                    value={paymentMethodFormData.displayOrder}
                    onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, displayOrder: parseInt(e.target.value || "0", 10) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={paymentMethodFormData.isActive}
                  onChange={(e) => setPaymentMethodFormData({ ...paymentMethodFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <label htmlFor="isActiveToggle" className="text-slate-800 font-bold cursor-pointer select-none">
                  চেকআউটে সক্রিয় রাখুন (Enable for customers)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMethodModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  {editingPaymentMethod ? "আপডেট সংরক্ষণ করুন" : "পেমেন্ট মেথড তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: DELETE CONFIRMATION ===================== */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">আপনি কি নিশ্চিত মুছে ফেলতে চান?</h3>
              <p className="text-xs text-rose-600 font-semibold">{deleteConfirm.title}</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirm({ open: false, type: "user", id: "", title: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
