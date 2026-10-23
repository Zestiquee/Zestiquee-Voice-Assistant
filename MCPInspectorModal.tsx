import React, { useState } from 'react';
import {
  Terminal,
  X,
  Play,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Code2,
} from 'lucide-react';

interface MCPInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MCPInspectorModal: React.FC<MCPInspectorModalProps> = ({ isOpen, onClose }) => {
  const [selectedTool, setSelectedTool] = useState('get_pantry');
  const [toolArgs, setToolArgs] = useState('{}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestCall = async () => {
    setIsCalling(true);
    setTestResult(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(toolArgs || '{}');
      } catch (e) {
        setTestResult(JSON.stringify({ error: 'Invalid JSON arguments' }, null, 2));
        setIsCalling(false);
        return;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'test_' + Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs,
          },
        }),
      });

      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTestResult(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsCalling(false);
    }
  };

  const copyEndpoint = () => {
    const url = `${window.location.origin}/api/mcp`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ALL_20_TOOLS = [
    { name: 'get_pantry', desc: 'Retrieve full current pantry inventory' },
    { name: 'search_pantry', desc: 'Search pantry items by keyword' },
    { name: 'add_pantry_item', desc: 'Add food item or update quantity' },
    { name: 'update_pantry_item', desc: 'Modify item details & notes' },
    { name: 'remove_pantry_item', desc: 'Delete an item from inventory' },
    { name: 'get_shopping_list', desc: 'Retrieve items on shopping list' },
    { name: 'add_shopping_item', desc: 'Add a grocery item to purchase' },
    { name: 'update_shopping_item', desc: 'Modify shopping item details' },
    { name: 'remove_shopping_item', desc: 'Delete item from shopping list' },
    { name: 'mark_item_purchased', desc: 'Mark bought & transfer to pantry' },
    { name: 'generate_recipe', desc: 'Dual-option recipe generation' },
    { name: 'compare_recipe_with_pantry', desc: 'Pantry cross-referencing' },
    { name: 'add_missing_ingredients', desc: 'Add missing items to shopping list' },
    { name: 'get_meal_plan', desc: 'Retrieve weekly household meal plans' },
    { name: 'create_meal_plan', desc: 'Update weekly meal plan entries' },
    { name: 'create_timer', desc: 'Start an accurate cooking timer' },
    { name: 'list_timers', desc: 'List active and running timers' },
    { name: 'cancel_timer', desc: 'Cancel or delete an active timer' },
    { name: 'get_user_preferences', desc: 'Retrieve user allergens & units' },
    { name: 'get_conversation_history', desc: 'Retrieve chat logs & recipe refs' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E6DFD5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#2D5A43] text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Terminal className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">
                Model Context Protocol (MCP)
              </div>
              <h2 className="text-xl font-serif font-bold">
                Zestiquee MCP Server & Tool Gateway
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Endpoint Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Live HTTP Streamable RPC Endpoint
              </span>
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Operational (JSON-RPC 2.0)</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2.5 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto">
                {window.location.origin}/api/mcp
              </code>
              <button
                onClick={copyEndpoint}
                className="px-3 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-[#1F2421] transition flex items-center space-x-1"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs text-[#5A625B]">
              This live endpoint adheres to the Model Context Protocol specification. Compatible AI
              tools (Cursor, Claude Desktop, custom Alexa developer proxies) can query all 20
              tools directly.
            </p>
          </div>

          {/* Interactive Tool Playground */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6DFD5] space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1F2421] flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-[#2D5A43]" />
              <span>Interactive Tool Execution Test</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Tool ({ALL_20_TOOLS.length} available)
                </label>
                <select
                  value={selectedTool}
                  onChange={(e) => {
                    setSelectedTool(e.target.value);
                    if (e.target.value === 'search_pantry') setToolArgs('{"query": "rice"}');
                    else if (e.target.value === 'create_timer')
                      setToolArgs('{"label": "MCP Pasta", "durationSeconds": 600}');
                    else setToolArgs('{}');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white"
                >
                  {ALL_20_TOOLS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Arguments (JSON)
                </label>
                <input
                  type="text"
                  value={toolArgs}
                  onChange={(e) => setToolArgs(e.target.value)}
                  placeholder="{}"
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleTestCall}
              disabled={isCalling}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#2D5A43] hover:bg-[#234734] disabled:bg-gray-400 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isCalling ? 'Executing...' : 'Invoke Tool via JSON-RPC'}</span>
            </button>

            {testResult && (
              <div className="mt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Live Response from Server:
                </div>
                <pre className="p-3 bg-gray-900 text-emerald-400 text-xs font-mono rounded-xl overflow-x-auto max-h-56">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
