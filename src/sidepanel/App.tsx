import React, { useState } from "react";
import "../assets/css/App.css";
import { toolSpecifications, getYTSubtitles } from "../lib/utils"; // Import the function

const App = () => {
  const [subs, setSubs] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleGetSubtitles = async () => {
    setLoading(true);
    setError(""); // Clear any previous errors
    setSubs(""); // Reset previous subtitles

    try {
      const scrapedSubs = await getYTSubtitles(toolSpecifications);
      setSubs(scrapedSubs);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching subtitles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-700">
          YouTube Subtitles Fetcher
        </h1>

        <button
          onClick={handleGetSubtitles}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white font-semibold focus:outline-none transition-all duration-200 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "Loading..." : "Get Subtitles"}
        </button>

        {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}

        {subs && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Subtitles
            </h2>
            <p className="text-gray-600 text-sm whitespace-pre-line">{subs}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
