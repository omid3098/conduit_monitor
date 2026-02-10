import { AddServerDialog } from "@/components/add-server-dialog";
import { ServerList } from "@/components/server-list";

export default function ServersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Servers</h2>
        <AddServerDialog />
      </div>
      <ServerList />
    </div>
  );
}
