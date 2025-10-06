import { useAuth } from "@/hooks/useAuth";

export function AdminBanner() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 px-4 py-3 mb-4">
      <div className="flex items-center">
        <span className="mr-2">👑</span>
        <p className="text-sm font-medium">
          Admin Mode: All hunts 5 KES
        </p>
      </div>
    </div>
  );
}