import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Save, X, Plus, Trash2 } from "lucide-react";
import { Token } from "@/lib/api";

export interface TokenGroup {
  id: string;
  name: string;
  tokens: Token[];
}

interface TokenGroupPanelProps {
  groups: TokenGroup[];
  selectedGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => void;
  onUpdateGroup: (group: TokenGroup) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddToken: (groupId: string, token: Token) => void;
  onRemoveToken: (groupId: string, tokenId: string) => void;
}

const TokenGroupPanel = ({
  groups = [],
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddToken,
  onRemoveToken,
}: TokenGroupPanelProps) => {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName("");
    }
  };

  const handleUpdateGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && editingName.trim()) {
      onUpdateGroup({ ...group, name: editingName.trim() });
      setEditingGroupId(null);
      setEditingName("");
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Token Groups
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`rounded-lg border ${selectedGroupId === group.id ? "border-indigo-600" : "border-gray-200"} p-3`}
            >
              <div className="flex items-center justify-between mb-2">
                {editingGroupId === group.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdateGroupName(group.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingGroupId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <button
                      className="font-medium text-gray-900 hover:text-indigo-600"
                      onClick={() => onSelectGroup(group.id)}
                    >
                      {group.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditingName(group.name);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {group.tokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between py-1 px-2 rounded bg-gray-50"
                  >
                    <span className="text-sm text-gray-600">
                      {token.symbol}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onRemoveToken(group.id, token.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TokenGroupPanel;
