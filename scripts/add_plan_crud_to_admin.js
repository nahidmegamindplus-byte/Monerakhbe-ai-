const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Add planModalOpen state if not present
if (!content.includes('const [planModalOpen, setPlanModalOpen] = useState')) {
  content = content.replace(
    'const [editingPlan, setEditingPlan] = useState<any | null>(null);',
    `const [editingPlan, setEditingPlan] = useState<any | null>(null);\n  const [planModalOpen, setPlanModalOpen] = useState(false);`
  );
}

// 2. Update handleSavePlan to support both CREATE (POST) and UPDATE (PUT)
const newSavePlanLogic = `  // Plan Save Handler (Create & Update)
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
      title: \`প্যাকেজ "\${planName} (\${planId})"\`,
    });
  };`;

content = content.replace(/\/\/ Plan Save Handler[\s\S]*?const handleManualVerifyPayment/m, `${newSavePlanLogic}\n\n  // Payment Manual Verify Action\n  const handleManualVerifyPayment`);

// 3. Update handleExecuteDelete to support type === "plan"
const deletePlanBranch = `    try {
      if (deleteConfirm.type === "plan") {
        const res = await fetch(\`/api/admin/plans?id=\${deleteConfirm.id}\`, {
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
      }`;

content = content.replace(/const handleExecuteDelete = async \(\) => \{\s*try \{/m, `const handleExecuteDelete = async () => {\n${deletePlanBranch}`);

// 4. Update the Plans Tab UI to have Add Plan Button and Delete Buttons on each card
const oldPlansTabPattern = /\{\/\* ----------------- TAB: PLANS CONFIG ----------------- \*\/\}[\s\S]*?\{\/\* ----------------- TAB 1: OVERVIEW ----------------- \*\/\}/m;

const newPlansTabUI = `{/* ----------------- TAB: PLANS CONFIG ----------------- */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    SaaS সাবস্ক্রিপশন প্যাকেজ ও লিমিট ব্যবস্থাপনা
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    এখানে নতুন প্ল্যান যুক্ত করতে পারবেন, যেকোনো প্যাকেজের মূল্য, লিমিট পরিবর্তন বা প্রয়োজন অনুযায়ী মুছে ফেলতে পারবেন।
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setPlanFormData({
                        id: "",
                        name: "",
                        description: "",
                        monthlyPrice: 299,
                        yearlyPrice: 2990,
                        reminderLimit: 500,
                        memoryLimit: 500,
                        taskLimit: 500,
                        aiLimit: 500,
                        fileSizeLimit: 25,
                        telegramEnabled: true,
                        advancedFeatures: false,
                        isActive: true,
                      });
                      setPlanModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন প্ল্যান যুক্ত করুন (Add Plan)</span>
                  </button>

                  <Link
                    href="/checkout?plan=PRO"
                    target="_blank"
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>চেকআউট প্রিভিউ</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plansList.map((p) => (
                  <div
                    key={p.id}
                    className={\`p-6 rounded-3xl bg-white border space-y-4 flex flex-col justify-between shadow-sm transition-all \${
                      p.isActive ? "border-slate-200 hover:border-slate-300" : "border-rose-200 bg-rose-50/20 opacity-85"
                    }\`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-900">{p.name}</h4>
                          <span
                            className={\`px-2 py-0.5 rounded-full text-[9px] font-black uppercase \${
                              p.isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"
                            }\`}
                          >
                            {p.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                          ID: {p.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                      <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">মাসিক মূল্য:</span>
                          <strong className="text-rose-600 font-mono text-base font-black">৳{p.monthlyPrice} BDT</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">বাৎসরিক মূল্য:</span>
                          <strong className="text-emerald-700 font-mono text-base font-black">৳{p.yearlyPrice} BDT</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-2xl border border-slate-100">
                        <p className="flex justify-between">
                          <span className="text-slate-500">⏰ রিমাইন্ডার লিমিট:</span>
                          <strong className="text-slate-900">{p.reminderLimit}টি</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">🧠 মেমোরি লিমিট:</span>
                          <strong className="text-slate-900">{p.memoryLimit}টি</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">📋 টাস্ক লিমিট:</span>
                          <strong className="text-slate-900">{p.taskLimit}টি</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">✨ AI রিকোয়েস্ট:</span>
                          <strong className="text-slate-900">{p.aiLimit}টি</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">📁 ফাইল আপলোড:</span>
                          <strong className="text-slate-900">{p.fileSizeLimit} MB</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">🤖 টেলিগ্রাম সাপোর্ট:</span>
                          <strong className={p.telegramEnabled ? "text-emerald-700" : "text-rose-600"}>
                            {p.telegramEnabled ? "সক্রিয়" : "বন্ধ"}
                          </strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-500">🚀 প্রিমিয়াম ফিচার:</span>
                          <strong className={p.advancedFeatures ? "text-indigo-700" : "text-slate-400"}>
                            {p.advancedFeatures ? "আনলকড" : "স্ট্যান্ডার্ড"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(p);
                          setPlanFormData(p);
                          setPlanModalOpen(true);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>এডিট করুন</span>
                      </button>

                      {p.id !== "FREE" && (
                        <button
                          onClick={() => handleDeletePlan(p.id, p.name)}
                          className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition-all hover:scale-105"
                          title="প্ল্যান মুছে ফেলুন বা নিষ্ক্রিয় করুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 1: OVERVIEW ----------------- */}`;

content = content.replace(oldPlansTabPattern, newPlansTabUI);

// 5. Update the Plan Modal JSX to support full fields (Create & Edit)
const oldPlanModalPattern = /\{\/\* ===================== MODAL: PLAN EDIT ===================== \*\/\}[\s\S]*?\{\/\* ===================== MODAL: USER CREATE \/ EDIT ===================== \*\/\}/m;

const newPlanModalJSX = `{/* ===================== MODAL: PLAN CREATE / EDIT ===================== */}
      {(planModalOpen || editingPlan) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingPlan ? \`প্যাকেজ এডিট করুন (\${editingPlan.name})\` : "নতুন SaaS প্ল্যান তৈরি করুন (Create Plan)"}
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

      {/* ===================== MODAL: USER CREATE / EDIT ===================== */}`;

content = content.replace(oldPlanModalPattern, newPlanModalJSX);

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Successfully updated Admin Panel with Plan Add & Remove features!');
