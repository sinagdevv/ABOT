import { Sidebar } from "../../components/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-warm">
      <Sidebar />
      <main className="min-h-screen px-4 pb-12 pt-20 md:ml-64 md:px-8 md:pt-8"><div className="mx-auto max-w-[1320px]">{children}</div></main>
    </div>
  );
}
