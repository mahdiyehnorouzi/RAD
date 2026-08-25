import { PackageCheck, Sparkles, Users } from "lucide-react";

const submissions = [
  { title: "فرم زیتونی", artist: "سحر میرزایی", status: "در انتظار بررسی" },
  { title: "کاسه خاک خام", artist: "نیلوفر راد", status: "تأیید شده" },
];

export default function AdminHome() {
  return <div className="shell"><aside><h1>رَد / مدیریت</h1><nav><span>محصولات</span><span>هنرمندان</span><span>سفارش‌ها</span></nav></aside><main><header className="heading"><div><small>داشبورد استودیو</small><h2>مرور امروز</h2></div><span>نسخه پروتوتایپ</span></header><section className="stats"><article className="stat"><PackageCheck/><b>۶</b><span>اثر در مجموعه</span></article><article className="stat"><Users/><b>۲</b><span>هنرمند مهمان</span></article><article className="stat"><Sparkles/><b>۳</b><span>طرح AI در انتظار بررسی</span></article></section><section className="panel"><h3>آثار ارسالی هنرمندان</h3>{submissions.map((item)=><div className="row" key={item.title}><div><b>{item.title}</b><div>{item.artist}</div></div><span className="badge">هنرمند مهمان</span><span>{item.status}</span></div>)}</section></main></div>;
}
