import React, { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import "../assets/css/App.css";
import { formatTime, getTabTools } from "../lib/utils";

const App = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isToolsVisible, setIsToolsVisible] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const handleTabChange = async () => {
      const result = await getTabTools();
      if (Array.isArray(result)) {
        setMessage(result[0]?.message || "No tools found for the current tab");
        setTools([]);
      } else {
        setMessage(result.message);
        setTools(result.toolsForTab || []);
      }
    };

    let debounceTimeout = setTimeout(handleTabChange, 300);
    chrome.tabs.onActivated.addListener(handleTabChange);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === "complete") {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(handleTabChange, 300);
      }
    });

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabChange);
      clearTimeout(debounceTimeout);
    };
  }, []);

  const toggleToolsVisibility = () => {
    setIsToolsVisible((prev) => !prev);
  };

  const handleToolExecute = async (
    executeFn: () => Promise<any>,
    slug: string
  ) => {
    const result = await executeFn();
    console.log(result?.result);

    setSlug(slug);
    setResult(result?.result);
  };

  // Map tool slugs to corresponding rendering logic
  const renderResult = () => {
    const resultMapping: Record<string, JSX.Element | null> = {
      "getting-transcript": <div>{result}</div>,
      "yt-metadata": <div>{JSON.stringify(result, null, 2)}</div>,
      "yt-subtitle-with-time": <div>{JSON.stringify(result, null, 2)}</div>,
    };

    return resultMapping[slug!] || null; // Render based on the slug
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-4 relative">
      {/* Message Display */}
      <div className="mb-4 text-center text-lg text-gray-700">{message}</div>

      {/* Render Result */}
      <div className="mb-4">{renderResult()}</div>

      {/* Flex-Column Layout for Tools */}
      {isToolsVisible && tools.length > 0 && (
        <div className="absolute bottom-16 left-4 flex flex-col items-center space-y-3">
          {tools.map((tool: any) => {
            const { name, description, slug } = tool;
            return (
              <div
                key={slug}
                className="bg-blue-600 text-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2 hover:bg-blue-700 transition duration-300"
                onClick={() => handleToolExecute(tool.execute, slug)}
              >
                <Bot className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="font-semibold">{name}</span>
                  <span className="text-sm">{description}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Button to toggle tools visibility */}
      {tools.length > 0 && (
        <button
          onClick={toggleToolsVisibility}
          className="fixed bottom-4 left-4 bg-blue-600 text-white py-2 px-4 rounded-full shadow-lg flex items-center space-x-2 hover:bg-blue-700 transition duration-300"
        >
          <Bot className="w-6 h-6" />
          <span>{isToolsVisible ? "Hide Tools" : "Open Tools"}</span>
        </button>
      )}
    </div>
  );
};

export default App;
